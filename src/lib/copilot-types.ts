import type { DatasetSummary } from "@/lib/types";

export type DatasetChunkSource =
  | "advisor"
  | "cost"
  | "finding"
  | "metric"
  | "optimizer"
  | "resource"
  | "service"
  | "summary"
  | "team";

export interface DatasetChunk {
  id: string;
  source: DatasetChunkSource;
  text: string;
  resourceId?: string;
  service?: string;
  team?: string;
  severity?: "high" | "medium" | "low";
  mandatory?: boolean;
}

export interface RetrievedDatasetChunk extends DatasetChunk {
  score: number;
}

export interface CopilotRequestPayload {
  question: string;
  datasetSummary: DatasetSummary;
  retrievedContext: RetrievedDatasetChunk[];
  activeDatasetName: string;
}

export interface CopilotSource {
  id: string;
  source: DatasetChunkSource;
  resourceId?: string;
}

export interface CopilotResponsePayload {
  answer: string;
  sources: CopilotSource[];
  model?: string;
}

export function isDatasetSummary(value: unknown): value is DatasetSummary {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DatasetSummary>;
  return (
    typeof candidate.totalMonthlySpend === "number" &&
    typeof candidate.previousMonthlySpend === "number" &&
    typeof candidate.estimatedMonthlySavings === "number" &&
    typeof candidate.resourceCount === "number" &&
    typeof candidate.findingCount === "number"
  );
}

export function isRetrievedDatasetChunk(value: unknown): value is RetrievedDatasetChunk {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RetrievedDatasetChunk>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.source === "string" &&
    typeof candidate.text === "string" &&
    typeof candidate.score === "number"
  );
}
