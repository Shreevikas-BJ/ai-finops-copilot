import type { AnalysisResult } from "@/lib/types";

export type DatasetSource = "custom" | "sample";

export interface ActiveDataset {
  version: 1;
  source: DatasetSource;
  label: string;
  loadedAt: string;
  analysis: AnalysisResult;
}

export function datasetSourceLabel(source: DatasetSource) {
  return source === "sample" ? "Sample Data" : "Custom Upload";
}

export function isActiveDataset(value: unknown): value is ActiveDataset {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ActiveDataset>;
  const analysis = candidate.analysis as Partial<AnalysisResult> | undefined;
  return (
    candidate.version === 1 &&
    (candidate.source === "sample" || candidate.source === "custom") &&
    typeof candidate.label === "string" &&
    typeof candidate.loadedAt === "string" &&
    Boolean(analysis) &&
    typeof analysis?.totalMonthlySpend === "number" &&
    Array.isArray(analysis.findings) &&
    Array.isArray(analysis.serviceSpend) &&
    Array.isArray(analysis.teamExposure)
  );
}
