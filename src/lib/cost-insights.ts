import type { CostRecord } from "@/lib/types";

export interface ServiceCostChange {
  service: string;
  currentCost: number;
  previousCost: number;
  change: number;
  changePercent: number;
}

function totalsByService(records: CostRecord[]) {
  const totals = new Map<string, number>();
  records.forEach((record) => {
    totals.set(record.service, (totals.get(record.service) ?? 0) + record.monthlyCost);
  });
  return totals;
}

export function calculateServiceCostChanges(
  costs: CostRecord[],
  currentMonth: string,
  previousMonth: string,
): ServiceCostChange[] {
  const current = totalsByService(costs.filter((record) => record.month === currentMonth));
  const previous = totalsByService(costs.filter((record) => record.month === previousMonth));
  const services = new Set([...current.keys(), ...previous.keys()]);

  return [...services]
    .map((service) => {
      const currentCost = current.get(service) ?? 0;
      const previousCost = previous.get(service) ?? 0;
      const change = currentCost - previousCost;
      return {
        service,
        currentCost,
        previousCost,
        change,
        changePercent: previousCost ? (change / previousCost) * 100 : currentCost ? 100 : 0,
      };
    })
    .sort((a, b) => b.change - a.change || b.currentCost - a.currentCost);
}
