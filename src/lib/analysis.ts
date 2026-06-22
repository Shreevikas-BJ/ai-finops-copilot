import "server-only";

import { analyzeCosts } from "@/lib/agents/cost-analyzer";
import { analyzeUsage } from "@/lib/agents/usage-analyzer";
import { detectAnomalies } from "@/lib/agents/anomaly-detector";
import { recommendOptimizations } from "@/lib/agents/optimization-recommender";
import { loadSampleDatasets } from "@/lib/data-loader";
import { calculateServiceCostChanges } from "@/lib/cost-insights";
import type { AnalysisResult, Datasets } from "@/lib/types";

function validateDatasetIntegrity(datasets: Datasets) {
  if (datasets.costs.length === 0) {
    throw new Error("The active dataset has no cost records.");
  }
  if (datasets.resources.length === 0) {
    throw new Error("The active dataset has no resource inventory records.");
  }

  const inventoryIds = new Set(datasets.resources.map((resource) => resource.resourceId));
  const relatedIds = [
    ...datasets.costs.map((record) => record.resourceId),
    ...datasets.metrics.map((record) => record.resourceId),
    ...datasets.recommendations.map((record) => record.resourceId),
    ...datasets.trustedAdvisor.map((record) => record.resourceId),
  ].filter(Boolean);
  const unmatched = [...new Set(relatedIds.filter((resourceId) => !inventoryIds.has(resourceId)))];
  if (unmatched.length > 0) {
    throw new Error(
      `Related files contain resource IDs that are missing from inventory: ${unmatched.slice(0, 5).join(", ")}.`,
    );
  }
}

export async function getAnalysis(input?: Datasets): Promise<AnalysisResult> {
  const datasets = input ?? (await loadSampleDatasets());
  validateDatasetIntegrity(datasets);
  const costAnalysis = analyzeCosts(datasets.costs);
  const usageSignals = analyzeUsage(datasets);
  const anomalies = detectAnomalies(datasets, costAnalysis);
  const findings = recommendOptimizations(datasets, costAnalysis, [
    ...usageSignals,
    ...anomalies,
  ]);
  const estimatedMonthlySavings = Number(
    findings.reduce((sum, item) => sum + item.estimatedSavings, 0).toFixed(2),
  );

  const savingsByService = [...new Set(findings.map((item) => item.service))]
    .map((service) => {
      const serviceFindings = findings.filter((item) => item.service === service);
      return {
        service,
        findings: serviceFindings.length,
        savings: Number(
          serviceFindings.reduce((sum, item) => sum + item.estimatedSavings, 0).toFixed(2),
        ),
      };
    })
    .sort((a, b) => b.savings - a.savings);

  const teams = [...new Set(costAnalysis.currentRecords.map((item) => item.team))];
  const teamExposure = teams
    .map((team) => {
      const teamFindings = findings.filter((item) => item.team === team);
      return {
        team,
        monthlySpend: costAnalysis.currentRecords
          .filter((item) => item.team === team)
          .reduce((sum, item) => sum + item.monthlyCost, 0),
        potentialSavings: teamFindings.reduce(
          (sum, item) => sum + item.estimatedSavings,
          0,
        ),
        findings: teamFindings.length,
      };
    })
    .sort((a, b) => b.potentialSavings - a.potentialSavings);

  const monthChangePercent = costAnalysis.previousMonthlySpend
    ? ((costAnalysis.totalMonthlySpend - costAnalysis.previousMonthlySpend) /
        costAnalysis.previousMonthlySpend) *
      100
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    dataMonth: costAnalysis.currentMonth,
    previousMonth: costAnalysis.previousMonth,
    totalMonthlySpend: costAnalysis.totalMonthlySpend,
    previousMonthlySpend: costAnalysis.previousMonthlySpend,
    monthChangePercent,
    estimatedMonthlySavings,
    estimatedYearlySavings: estimatedMonthlySavings * 12,
    wasteFindings: findings.length,
    highRiskAnomalies: findings.filter((item) => item.severity === "high").length,
    resourceCount: datasets.resources.length,
    findings,
    serviceSpend: costAnalysis.serviceSpend,
    serviceCostChanges: calculateServiceCostChanges(
      datasets.costs,
      costAnalysis.currentMonth,
      costAnalysis.previousMonth,
    ),
    savingsByService,
    teamExposure,
  };
}
