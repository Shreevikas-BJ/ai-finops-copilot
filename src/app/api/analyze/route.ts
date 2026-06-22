import { NextResponse } from "next/server";
import { getAnalysis } from "@/lib/analysis";
import {
  parseCosts,
  parseMetrics,
  parseRecommendations,
  parseResources,
  parseTrustedAdvisor,
} from "@/lib/data-loader";
import { REQUIRED_UPLOAD_FILE_NAMES } from "@/lib/upload-schema";
import { validateUploadContents } from "@/lib/upload-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(await getAnalysis());
    }

    const formData = await request.formData();
    const files = [...formData.values()].filter((value): value is File => value instanceof File);
    const uploadContents = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        size: file.size,
        content: await file.text(),
      })),
    );
    const validation = validateUploadContents(uploadContents);
    if (!validation.valid) {
      const firstIssue = validation.issues[0];
      const status = validation.issues.some((issue) => issue.code === "file_too_large")
        ? 413
        : 400;
      return NextResponse.json(
        {
          error: firstIssue
            ? `${firstIssue.message} ${firstIssue.resolution}`
            : "Upload validation failed.",
          validation,
        },
        { status },
      );
    }

    const byName = new Map(uploadContents.map((file) => [file.name, file.content]));
    const contentFor = (name: (typeof REQUIRED_UPLOAD_FILE_NAMES)[number]) => {
      const content = byName.get(name);
      if (content === undefined) throw new Error(`${name} is missing.`);
      return content;
    };

    return NextResponse.json(
      await getAnalysis({
        costs: parseCosts(contentFor("cost_usage.csv")),
        resources: parseResources(contentFor("resource_inventory.csv")),
        metrics: parseMetrics(contentFor("cloudwatch_metrics.csv")),
        recommendations: parseRecommendations(contentFor("optimizer_recommendations.json")),
        trustedAdvisor: parseTrustedAdvisor(contentFor("trusted_advisor_findings.json")),
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze the data.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
