import { NextResponse } from "next/server";
import { getAnalysis } from "@/lib/analysis";
import {
  loadSampleDatasets,
  parseCosts,
  parseMetrics,
  parseRecommendations,
  parseResources,
  parseTrustedAdvisor,
} from "@/lib/data-loader";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(await getAnalysis());
    }

    const datasets = await loadSampleDatasets();
    const formData = await request.formData();
    const files = [...formData.values()].filter((value): value is File => value instanceof File);
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `${file.name} exceeds the 2 MB MVP upload limit.` },
          { status: 413 },
        );
      }
      const content = await file.text();
      switch (file.name.toLowerCase()) {
        case "cost_usage.csv":
          datasets.costs = parseCosts(content);
          break;
        case "resource_inventory.csv":
          datasets.resources = parseResources(content);
          break;
        case "cloudwatch_metrics.csv":
          datasets.metrics = parseMetrics(content);
          break;
        case "optimizer_recommendations.json":
          datasets.recommendations = parseRecommendations(content);
          break;
        case "trusted_advisor_findings.json":
          datasets.trustedAdvisor = parseTrustedAdvisor(content);
          break;
        default:
          return NextResponse.json(
            { error: `Unsupported file name: ${file.name}` },
            { status: 400 },
          );
      }
    }

    return NextResponse.json(await getAnalysis(datasets));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze the data.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
