import type { CostAnalysis } from "@/lib/agents/cost-analyzer";
import type { Datasets } from "@/lib/types";
import type { OptimizationSignal } from "@/lib/agents/usage-analyzer";

export interface AnomalySignal extends OptimizationSignal {
  costSpikePercent: number;
  absoluteIncrease: number;
}

export function detectAnomalies(
  datasets: Datasets,
  costs: CostAnalysis,
): AnomalySignal[] {
  return datasets.resources
    .filter((resource) => resource.service === "NAT Gateway")
    .flatMap((resource) => {
      const current = costs.currentByResource.get(resource.resourceId) ?? 0;
      const previous = costs.previousByResource.get(resource.resourceId) ?? 0;
      const spike = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      if (spike <= 50) return [];

      return [
        {
          resourceId: resource.resourceId,
          issueType: "NAT Gateway cost spike" as const,
          costSpikePercent: spike,
          absoluteIncrease: current - previous,
          savingsRatio: current ? (current - previous) / current : 0,
          evidence: [
            `Monthly cost increased from $${previous.toFixed(0)} to $${current.toFixed(0)} (${spike.toFixed(1)}%).`,
            "Rule triggers when current-month cost is more than 50% above the previous month.",
          ],
          recommendedAction:
            "Inspect traffic by route and availability zone; prioritize S3/DynamoDB gateway endpoints and remove cross-AZ NAT paths.",
        },
      ];
    });
}
