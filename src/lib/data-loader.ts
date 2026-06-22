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

function previousMonth(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeRisk(value: unknown): "high" | "medium" | "low" {
  const normalized = String(value ?? "medium").toLowerCase();
  return normalized === "high" || normalized === "low" ? normalized : "medium";
}

function serviceFromType(resourceType: string) {
  const normalized = resourceType.toLowerCase();
  if (normalized.includes("nat")) return "NAT Gateway";
  if (normalized.includes("ec2") || normalized.includes("instance")) return "EC2";
  if (normalized.includes("ebs") || normalized.includes("volume")) return "EBS";
  if (normalized.includes("rds") || normalized.includes("database")) return "RDS";
  if (normalized.includes("s3") || normalized.includes("bucket")) return "S3";
  return resourceType;
}

function ownerFromTags(tags: string | undefined, team: string) {
  const owner = tags?.match(/(?:^|[,;{])\s*["']?owner["']?\s*[:=]\s*["']?([^,;}"']+)/i)?.[1]?.trim();
  return owner || `${team} owner`;
}

function periodDays(start: string | undefined, end: string | undefined) {
  const startTime = Date.parse(start ?? "");
  const endTime = Date.parse(end ?? "");
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return 30;
  return Math.max(1, Math.round((endTime - startTime) / 86_400_000) + 1);
}

export function parseCosts(input: string): CostRecord[] {
  return parseCsv(input).flatMap((row) => {
    if (row.billing_month) {
      const owner = row.owner || `${row.team} owner`;
      const shared = {
        resourceId: row.resource_id,
        resourceName: row.resource_name || row.resource_id,
        service: row.service,
        owner,
        team: row.team,
        accountId: row.account_id,
        region: row.region,
        usageType: row.usage_type,
        usageAmount: asNumber(row.usage_amount),
        usageUnit: row.usage_unit,
        environment: row.environment,
        project: row.project,
      };
      return [
        {
          ...shared,
          month: previousMonth(row.billing_month),
          monthlyCost: asNumber(row.previous_month_cost_usd),
        },
        {
          ...shared,
          month: row.billing_month,
          monthlyCost: asNumber(row.current_month_cost_usd),
        },
      ];
    }
    return [{
      month: row.month,
      resourceId: row.resource_id,
      resourceName: row.resource_name || row.resource_id,
      service: row.service,
      owner: row.owner,
      team: row.team,
      monthlyCost: asNumber(row.monthly_cost),
    }];
  });
}

export function parseResources(input: string): ResourceRecord[] {
  return parseCsv(input).map((row) => {
    const service = row.service || serviceFromType(row.resource_type);
    return {
      resourceId: row.resource_id,
      resourceName: row.resource_name || row.resource_id,
      service,
      resourceType: row.resource_type,
      status: row.status,
      owner: row.owner || ownerFromTags(row.tags, row.team),
      team: row.team,
      region: row.region,
      environment: row.environment,
      criticality: normalizeRisk(row.criticality || row.business_criticality),
      storageClass:
        row.storage_class || (service === "S3" ? row.size_or_class : undefined),
      sizeOrClass: row.size_or_class || row.resource_type,
      objectAgeDays: asNumber(row.object_age_days),
      project: row.project,
      createdDate: row.created_date,
      production: String(row.production).toLowerCase() === "true",
    };
  });
}

export function parseMetrics(input: string): MetricRecord[] {
  return parseCsv(input).flatMap((row) => {
    if (row.metric_name) {
      return [{
        resourceId: row.resource_id,
        metricName: row.metric_name,
        average: asNumber(row.average),
        maximum: asNumber(row.maximum),
        unit: row.unit,
        periodDays: asNumber(row.period_days),
      }];
    }

    const days = periodDays(row.metric_start, row.metric_end);
    const metrics: MetricRecord[] = [];
    const addMetric = (
      metricName: string,
      average: string | undefined,
      maximum: string | undefined,
      unit: string,
    ) => {
      if (!average || average.toLowerCase() === "null") return;
      metrics.push({
        resourceId: row.resource_id,
        metricName,
        average: asNumber(average),
        maximum: asNumber(maximum || average),
        unit,
        periodDays: days,
        metricStart: row.metric_start,
        metricEnd: row.metric_end,
      });
    };
    addMetric("CPUUtilization", row.avg_cpu_percent, row.max_cpu_percent, "Percent");
    addMetric("MemoryUtilization", row.avg_memory_percent, row.avg_memory_percent, "Percent");
    addMetric("NetworkIn", row.network_in_gb, row.network_in_gb, "GB");
    addMetric("NetworkOut", row.network_out_gb, row.network_out_gb, "GB");
    addMetric("ReadIOPS", row.read_iops, row.read_iops, "Count/Second");
    addMetric("WriteIOPS", row.write_iops, row.write_iops, "Count/Second");
    addMetric("ObjectCount", row.object_count, row.object_count, "Count");
    addMetric("AverageObjectAge", row.avg_object_age_days, row.avg_object_age_days, "Days");
    return metrics;
  });
}

export function parseRecommendations(input: string): OptimizerRecommendation[] {
  const records = JSON.parse(input) as Array<Record<string, unknown>>;
  return records.map((record) => ({
    resourceId: String(record.resource_id ?? ""),
    source: String(record.source ?? "Optimizer upload"),
    recommendation: String(
      record.recommendation ??
        `${record.finding ?? "Rightsize resource"}: change ${record.current_type ?? "current type"} to ${record.recommended_type ?? "the recommended type"}. ${record.reason ?? ""}`,
    ).trim(),
    projectedSavings: numberValue(
      record.projected_savings ?? record.estimated_monthly_savings_usd,
    ),
    risk: normalizeRisk(record.risk),
    service: record.service ? String(record.service) : undefined,
    finding: record.finding ? String(record.finding) : undefined,
    currentType: record.current_type ? String(record.current_type) : undefined,
    recommendedType: record.recommended_type ? String(record.recommended_type) : undefined,
    confidence: record.confidence ? String(record.confidence) : undefined,
    reason: record.reason ? String(record.reason) : undefined,
  }));
}

export function parseTrustedAdvisor(input: string): TrustedAdvisorFinding[] {
  const records = JSON.parse(input) as Array<Record<string, unknown>>;
  return records.map((record) => ({
    resourceId: String(record.resource_id ?? ""),
    category: String(record.category ?? "Cost Optimization"),
    check: String(record.check ?? record.finding ?? "Optimization finding"),
    status: String(record.status ?? "warning"),
    note: String(
      record.note ?? record.recommended_action ?? record.finding ?? "Review the finding.",
    ),
    service: record.service ? String(record.service) : undefined,
    estimatedSavings: record.estimated_monthly_savings_usd === undefined
      ? undefined
      : numberValue(record.estimated_monthly_savings_usd),
    recommendedAction: record.recommended_action
      ? String(record.recommended_action)
      : undefined,
    risk: record.risk ? normalizeRisk(record.risk) : undefined,
    owner: record.owner ? String(record.owner) : undefined,
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
