import type {
  AnalysisResult,
  AnalyzedDatasetPayload,
  DatasetSummary,
  Datasets,
} from "@/lib/types";

export type DatasetSource = "custom" | "sample";

export interface ActiveDataset {
  version: 2;
  id: string;
  name: string;
  source: DatasetSource;
  sourceLabel: string;
  loadedAt: string;
  fileNames: string[];
  datasets: Datasets;
  analysis: AnalysisResult;
  summary: DatasetSummary;
}

export interface DatasetStore {
  version: 2;
  activeId: string | null;
  history: ActiveDataset[];
}

export function datasetSourceLabel(source: DatasetSource) {
  return source === "sample" ? "Sample Data" : "Custom Upload";
}

export function createDatasetSummary(analysis: AnalysisResult): DatasetSummary {
  return {
    dataMonth: analysis.dataMonth,
    previousMonth: analysis.previousMonth,
    totalMonthlySpend: analysis.totalMonthlySpend,
    previousMonthlySpend: analysis.previousMonthlySpend,
    costChange: analysis.totalMonthlySpend - analysis.previousMonthlySpend,
    monthChangePercent: analysis.monthChangePercent,
    estimatedMonthlySavings: analysis.estimatedMonthlySavings,
    estimatedYearlySavings: analysis.estimatedYearlySavings,
    resourceCount: analysis.resourceCount,
    findingCount: analysis.findings.length,
    highSeverityCount: analysis.findings.filter((finding) => finding.severity === "high").length,
    mediumSeverityCount: analysis.findings.filter((finding) => finding.severity === "medium").length,
    lowSeverityCount: analysis.findings.filter((finding) => finding.severity === "low").length,
    serviceCount: analysis.serviceSpend.length,
    teamCount: analysis.teamExposure.length,
  };
}

export function createActiveDataset({
  name,
  source,
  payload,
}: {
  name: string;
  source: DatasetSource;
  payload: AnalyzedDatasetPayload;
}): ActiveDataset {
  return {
    version: 2,
    id: `${Date.now()}-${crypto.randomUUID()}`,
    name: name.trim(),
    source,
    sourceLabel: datasetSourceLabel(source),
    loadedAt: new Date().toISOString(),
    fileNames: payload.fileNames,
    datasets: payload.datasets,
    analysis: payload.analysis,
    summary: payload.summary,
  };
}

function isDatasets(value: unknown): value is Datasets {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Datasets>;
  return (
    Array.isArray(candidate.costs) &&
    Array.isArray(candidate.resources) &&
    Array.isArray(candidate.metrics) &&
    Array.isArray(candidate.recommendations) &&
    Array.isArray(candidate.trustedAdvisor)
  );
}

export function isActiveDataset(value: unknown): value is ActiveDataset {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ActiveDataset>;
  const analysis = candidate.analysis as Partial<AnalysisResult> | undefined;
  const summary = candidate.summary as Partial<DatasetSummary> | undefined;
  return (
    candidate.version === 2 &&
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    (candidate.source === "sample" || candidate.source === "custom") &&
    typeof candidate.sourceLabel === "string" &&
    typeof candidate.loadedAt === "string" &&
    Array.isArray(candidate.fileNames) &&
    isDatasets(candidate.datasets) &&
    Boolean(analysis) &&
    typeof analysis?.totalMonthlySpend === "number" &&
    Array.isArray(analysis.findings) &&
    Array.isArray(analysis.serviceSpend) &&
    Array.isArray(analysis.teamExposure) &&
    Boolean(summary) &&
    typeof summary?.findingCount === "number"
  );
}

export function isDatasetStore(value: unknown): value is DatasetStore {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DatasetStore>;
  return (
    candidate.version === 2 &&
    (candidate.activeId === null || typeof candidate.activeId === "string") &&
    Array.isArray(candidate.history) &&
    candidate.history.every(isActiveDataset)
  );
}
