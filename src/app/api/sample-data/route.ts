import { NextResponse } from "next/server";
import { loadSampleDatasets } from "@/lib/data-loader";
import { createZip } from "@/lib/zip";

export const runtime = "nodejs";

function csvValue(value: string | number | boolean | undefined) {
  const text = value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(headers: string[], rows: Array<Record<string, string | number | boolean | undefined>>) {
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvValue(row[header])).join(",")),
  ].join("\n");
}

function monthEnd(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return `${month}-${String(lastDay).padStart(2, "0")}`;
}

export async function GET() {
  const datasets = await loadSampleDatasets();
  const months = [...new Set(datasets.costs.map((cost) => cost.month))].sort();
  const currentMonth = months.at(-1) ?? "2026-05";
  const previousMonth = months.at(-2) ?? currentMonth;
  const resources = new Map(datasets.resources.map((resource) => [resource.resourceId, resource]));
  const previousCosts = new Map(
    datasets.costs
      .filter((cost) => cost.month === previousMonth)
      .map((cost) => [cost.resourceId, cost.monthlyCost]),
  );
  const currentCosts = datasets.costs.filter((cost) => cost.month === currentMonth);
  const recommendationSavings = new Map(
    datasets.recommendations.map((recommendation) => [
      recommendation.resourceId,
      recommendation.projectedSavings,
    ]),
  );

  const costUsage = csv(
    [
      "billing_month",
      "service",
      "resource_id",
      "resource_name",
      "account_id",
      "region",
      "usage_type",
      "usage_amount",
      "usage_unit",
      "current_month_cost_usd",
      "previous_month_cost_usd",
      "team",
      "environment",
      "project",
    ],
    currentCosts.map((cost) => {
      const resource = resources.get(cost.resourceId);
      return {
        billing_month: currentMonth,
        service: cost.service,
        resource_id: cost.resourceId,
        resource_name: resource?.resourceName || cost.resourceName,
        account_id: "123456789012",
        region: resource?.region || "us-east-1",
        usage_type: "MonthlyUsage",
        usage_amount: 1,
        usage_unit: "month",
        current_month_cost_usd: cost.monthlyCost,
        previous_month_cost_usd: previousCosts.get(cost.resourceId) ?? 0,
        team: cost.team,
        environment: resource?.environment || "unknown",
        project: resource?.project || "finops-portfolio",
      };
    }),
  );

  const inventory = csv(
    [
      "resource_id",
      "resource_type",
      "resource_name",
      "status",
      "size_or_class",
      "region",
      "team",
      "environment",
      "project",
      "created_date",
      "production",
      "business_criticality",
      "tags",
    ],
    datasets.resources.map((resource) => ({
      resource_id: resource.resourceId,
      resource_type: resource.service,
      resource_name: resource.resourceName,
      status: resource.status,
      size_or_class: resource.storageClass || resource.sizeOrClass || resource.resourceType,
      region: resource.region,
      team: resource.team,
      environment: resource.environment,
      project: resource.project || "finops-portfolio",
      created_date: resource.createdDate || "2025-01-15",
      production: resource.environment === "prod",
      business_criticality: resource.criticality,
      tags: `owner=${resource.owner};team=${resource.team}`,
    })),
  );

  const metricsByResource = new Map<string, Record<string, number>>();
  datasets.metrics.forEach((metric) => {
    const values = metricsByResource.get(metric.resourceId) ?? {};
    const field = {
      CPUUtilization: "avg_cpu_percent",
      MemoryUtilization: "avg_memory_percent",
      NetworkIn: "network_in_gb",
      NetworkOut: "network_out_gb",
      ReadIOPS: "read_iops",
      WriteIOPS: "write_iops",
      ObjectCount: "object_count",
      AverageObjectAge: "avg_object_age_days",
    }[metric.metricName];
    if (field) values[field] = metric.average;
    if (metric.metricName === "CPUUtilization") values.max_cpu_percent = metric.maximum;
    metricsByResource.set(metric.resourceId, values);
  });
  const metrics = csv(
    [
      "resource_id",
      "metric_start",
      "metric_end",
      "avg_cpu_percent",
      "max_cpu_percent",
      "avg_memory_percent",
      "network_in_gb",
      "network_out_gb",
      "read_iops",
      "write_iops",
      "object_count",
      "avg_object_age_days",
    ],
    datasets.resources.map((resource) => ({
      resource_id: resource.resourceId,
      metric_start: `${currentMonth}-01`,
      metric_end: monthEnd(currentMonth),
      ...(metricsByResource.get(resource.resourceId) ?? {}),
      avg_object_age_days:
        metricsByResource.get(resource.resourceId)?.avg_object_age_days ||
        resource.objectAgeDays ||
        undefined,
    })),
  );

  const optimizer = JSON.stringify(
    datasets.recommendations.map((recommendation) => {
      const resource = resources.get(recommendation.resourceId);
      return {
        resource_id: recommendation.resourceId,
        service: recommendation.service || resource?.service || "Unknown",
        finding: recommendation.finding || "Cost optimization opportunity",
        current_type: recommendation.currentType || resource?.sizeOrClass || resource?.resourceType || "Current configuration",
        recommended_type: recommendation.recommendedType || "Review recommendation",
        estimated_monthly_savings_usd: recommendation.projectedSavings,
        confidence: recommendation.confidence || "High",
        reason: recommendation.reason || recommendation.recommendation,
      };
    }),
    null,
    2,
  );

  const advisor = JSON.stringify(
    datasets.trustedAdvisor.map((finding, index) => {
      const resource = resources.get(finding.resourceId);
      return {
        check_id: `TA-${String(index + 1).padStart(3, "0")}`,
        category: finding.category,
        resource_id: finding.resourceId,
        service: finding.service || resource?.service || "Unknown",
        status: finding.status,
        finding: finding.check,
        estimated_monthly_savings_usd: finding.estimatedSavings ?? recommendationSavings.get(finding.resourceId) ?? 0,
        recommended_action: finding.recommendedAction || finding.note,
        risk: finding.risk || resource?.criticality || "medium",
        owner: finding.owner || resource?.team || "Unassigned",
      };
    }),
    null,
    2,
  );

  const archive = createZip([
    { name: "cost_usage.csv", data: Buffer.from(costUsage) },
    { name: "resource_inventory.csv", data: Buffer.from(inventory) },
    { name: "cloudwatch_metrics.csv", data: Buffer.from(metrics) },
    { name: "optimizer_recommendations.json", data: Buffer.from(optimizer) },
    { name: "trusted_advisor_findings.json", data: Buffer.from(advisor) },
  ]);
  return new NextResponse(new Uint8Array(archive), {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Disposition": 'attachment; filename="ai-finops-sample-data.zip"',
      "Content-Type": "application/zip",
    },
  });
}
