import type { CostRecord } from "@/lib/types";

export interface CostAnalysis {
  currentMonth: string;
  previousMonth: string;
  currentRecords: CostRecord[];
  previousRecords: CostRecord[];
  currentByResource: Map<string, number>;
  previousByResource: Map<string, number>;
  totalMonthlySpend: number;
  previousMonthlySpend: number;
  serviceSpend: Array<{ service: string; cost: number; percent: number }>;
}

export function analyzeCosts(costs: CostRecord[]): CostAnalysis {
  const months = [...new Set(costs.map((record) => record.month))].sort();
  const currentMonth = months.at(-1) ?? "Unknown";
  const previousMonth = months.at(-2) ?? currentMonth;
  const currentRecords = costs.filter((record) => record.month === currentMonth);
  const previousRecords = costs.filter((record) => record.month === previousMonth);

  const currentByResource = new Map(
    currentRecords.map((record) => [record.resourceId, record.monthlyCost]),
  );
  const previousByResource = new Map(
    previousRecords.map((record) => [record.resourceId, record.monthlyCost]),
  );
  const totalMonthlySpend = currentRecords.reduce(
    (total, record) => total + record.monthlyCost,
    0,
  );
  const previousMonthlySpend = previousRecords.reduce(
    (total, record) => total + record.monthlyCost,
    0,
  );
  const byService = new Map<string, number>();
  currentRecords.forEach((record) =>
    byService.set(record.service, (byService.get(record.service) ?? 0) + record.monthlyCost),
  );
  const serviceSpend = [...byService.entries()]
    .map(([service, cost]) => ({
      service,
      cost,
      percent: totalMonthlySpend ? (cost / totalMonthlySpend) * 100 : 0,
    }))
    .sort((a, b) => b.cost - a.cost);

  return {
    currentMonth,
    previousMonth,
    currentRecords,
    previousRecords,
    currentByResource,
    previousByResource,
    totalMonthlySpend,
    previousMonthlySpend,
    serviceSpend,
  };
}
