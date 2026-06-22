import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { asNumber, parseCsv } from "@/lib/csv";
import type {
  CostRecord,
  Datasets,
  MetricRecord,
  OptimizerRecommendation,
  ResourceRecord,
  TrustedAdvisorFinding,
} from "@/lib/types";

type JsonRecommendation = {
  resource_id: string;
  source: string;
  recommendation: string;
  projected_savings: number;
  risk: "high" | "medium" | "low";
};

type JsonTrustedAdvisor = {
  resource_id: string;
  category: string;
  check: string;
  status: string;
  note: string;
};

export function parseCosts(input: string): CostRecord[] {
  return parseCsv(input).map((row) => ({
    month: row.month,
    resourceId: row.resource_id,
    service: row.service,
    owner: row.owner,
    team: row.team,
    monthlyCost: asNumber(row.monthly_cost),
  }));
}

export function parseResources(input: string): ResourceRecord[] {
  return parseCsv(input).map((row) => ({
    resourceId: row.resource_id,
    service: row.service,
    resourceType: row.resource_type,
    status: row.status,
    owner: row.owner,
    team: row.team,
    region: row.region,
    environment: row.environment,
    criticality: (row.criticality || "low") as ResourceRecord["criticality"],
    storageClass: row.storage_class || undefined,
    objectAgeDays: asNumber(row.object_age_days),
  }));
}

export function parseMetrics(input: string): MetricRecord[] {
  return parseCsv(input).map((row) => ({
    resourceId: row.resource_id,
    metricName: row.metric_name,
    average: asNumber(row.average),
    maximum: asNumber(row.maximum),
    unit: row.unit,
    periodDays: asNumber(row.period_days),
  }));
}

export function parseRecommendations(input: string): OptimizerRecommendation[] {
  const records = JSON.parse(input) as JsonRecommendation[];
  return records.map((record) => ({
    resourceId: record.resource_id,
    source: record.source,
    recommendation: record.recommendation,
    projectedSavings: record.projected_savings,
    risk: record.risk,
  }));
}

export function parseTrustedAdvisor(input: string): TrustedAdvisorFinding[] {
  const records = JSON.parse(input) as JsonTrustedAdvisor[];
  return records.map((record) => ({
    resourceId: record.resource_id,
    category: record.category,
    check: record.check,
    status: record.status,
    note: record.note,
  }));
}

async function readDataFile(fileName: string) {
  return readFile(path.join(process.cwd(), "data", fileName), "utf8");
}

export async function loadSampleDatasets(): Promise<Datasets> {
  const [costs, resources, metrics, recommendations, trustedAdvisor] =
    await Promise.all([
      readDataFile("cost_usage.csv"),
      readDataFile("resource_inventory.csv"),
      readDataFile("cloudwatch_metrics.csv"),
      readDataFile("optimizer_recommendations.json"),
      readDataFile("trusted_advisor_findings.json"),
    ]);

  return {
    costs: parseCosts(costs),
    resources: parseResources(resources),
    metrics: parseMetrics(metrics),
    recommendations: parseRecommendations(recommendations),
    trustedAdvisor: parseTrustedAdvisor(trustedAdvisor),
  };
}
