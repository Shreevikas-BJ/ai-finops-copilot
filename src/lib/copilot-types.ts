import type { ActiveDataset } from "@/lib/active-dataset";
import type { Finding } from "@/lib/types";

export interface CopilotDatasetPayload {
  source: ActiveDataset["source"];
  label: string;
  loadedAt: string;
  summary: {
    dataMonth: string;
    previousMonth: string;
    totalMonthlySpend: number;
    previousMonthlySpend: number;
    monthChangePercent: number;
    estimatedMonthlySavings: number;
    estimatedYearlySavings: number;
    resourceCount: number;
    findingCount: number;
  };
  costs: {
    services: ActiveDataset["analysis"]["serviceSpend"];
    teams: ActiveDataset["analysis"]["teamExposure"];
  };
  findings: Finding[];
  recommendations: Array<{
    resourceId: string;
    owner: string;
    team: string;
    action: string;
    estimatedMonthlySavings: number;
    risk: Finding["risk"];
  }>;
}

export function buildCopilotDataset(activeDataset: ActiveDataset): CopilotDatasetPayload {
  const { analysis } = activeDataset;
  return {
    source: activeDataset.source,
    label: activeDataset.label,
    loadedAt: activeDataset.loadedAt,
    summary: {
      dataMonth: analysis.dataMonth,
      previousMonth: analysis.previousMonth,
      totalMonthlySpend: analysis.totalMonthlySpend,
      previousMonthlySpend: analysis.previousMonthlySpend,
      monthChangePercent: Number(analysis.monthChangePercent.toFixed(1)),
      estimatedMonthlySavings: analysis.estimatedMonthlySavings,
      estimatedYearlySavings: analysis.estimatedYearlySavings,
      resourceCount: analysis.resourceCount,
      findingCount: analysis.findings.length,
    },
    costs: {
      services: analysis.serviceSpend,
      teams: analysis.teamExposure,
    },
    findings: analysis.findings,
    recommendations: analysis.findings.map((finding) => ({
      resourceId: finding.resourceId,
      owner: finding.owner,
      team: finding.team,
      action: finding.recommendedAction,
      estimatedMonthlySavings: finding.estimatedSavings,
      risk: finding.risk,
    })),
  };
}

export function isCopilotDatasetPayload(value: unknown): value is CopilotDatasetPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CopilotDatasetPayload>;
  return (
    (candidate.source === "sample" || candidate.source === "custom") &&
    typeof candidate.label === "string" &&
    Boolean(candidate.summary) &&
    typeof candidate.summary?.totalMonthlySpend === "number" &&
    Array.isArray(candidate.costs?.services) &&
    Array.isArray(candidate.costs?.teams) &&
    Array.isArray(candidate.findings) &&
    Array.isArray(candidate.recommendations)
  );
}
