import { NextResponse } from "next/server";
import { createDatasetSummary } from "@/lib/active-dataset";
import { getAnalysis } from "@/lib/analysis";
import {
  loadSampleDatasets,
  parseCosts,
  parseMetrics,
  parseRecommendations,
  parseResources,
  parseTrustedAdvisor,
} from "@/lib/data-loader";
import { REQUIRED_UPLOAD_FILE_NAMES } from "@/lib/upload-schema";
import { validateUploadContents } from "@/lib/upload-validation";
import type { Datasets } from "@/lib/types";

export const runtime = "nodejs";

async function analyzedPayload(datasets: Datasets, fileNames: string[]) {
  const analysis = await getAnalysis(datasets);
  return {
    analysis,
    datasets,
    summary: createDatasetSummary(analysis),
    fileNames,
  };
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      const datasets = await loadSampleDatasets();
      return NextResponse.json(
        await analyzedPayload(datasets, [...REQUIRED_UPLOAD_FILE_NAMES]),
      );
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

    const datasets: Datasets = {
        costs: parseCosts(contentFor("cost_usage.csv")),
        resources: parseResources(contentFor("resource_inventory.csv")),
        metrics: parseMetrics(contentFor("cloudwatch_metrics.csv")),
        recommendations: parseRecommendations(contentFor("optimizer_recommendations.json")),
        trustedAdvisor: parseTrustedAdvisor(contentFor("trusted_advisor_findings.json")),
    };

    return NextResponse.json(
      await analyzedPayload(datasets, [...REQUIRED_UPLOAD_FILE_NAMES]),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze the data.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
