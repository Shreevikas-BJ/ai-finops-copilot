export const UPLOAD_FILE_REQUIREMENTS = [
  {
    name: "cost_usage.csv",
    format: "CSV",
    purpose: [
      "Cost analysis and service spend reporting",
      "Monthly cost comparison",
      "Team and project cost allocation",
    ],
    requiredFields: [
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
    guidance: "One row per resource and billing month. billing_month uses YYYY-MM and both cost fields must be numeric.",
    preview:
      "billing_month,service,resource_id,...,current_month_cost_usd,previous_month_cost_usd\n2026-05,EC2,i-ec2-001,...,120,100",
  },
  {
    name: "resource_inventory.csv",
    format: "CSV",
    purpose: [
      "Resource ownership tracking",
      "Environment classification",
      "Risk and business context analysis",
    ],
    requiredFields: [
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
    guidance: "This is the source of truth for resource IDs. created_date uses YYYY-MM-DD.",
    preview:
      "resource_id,resource_type,resource_name,status,size_or_class,...\ni-ec2-001,EC2,api-worker,running,m5.xlarge,...",
  },
  {
    name: "cloudwatch_metrics.csv",
    format: "CSV",
    purpose: [
      "Idle resource detection and rightsizing analysis",
      "Traffic and utilization analysis",
      "Storage optimization insights",
    ],
    requiredFields: [
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
    guidance: "metric_start and metric_end use YYYY-MM-DD. Optional metric values may be blank or null.",
    preview:
      "resource_id,metric_start,metric_end,avg_cpu_percent,max_cpu_percent,...\ni-ec2-001,2026-05-01,2026-05-31,2.1,8.7,...",
  },
  {
    name: "optimizer_recommendations.json",
    format: "JSON array",
    purpose: ["Rightsizing recommendations", "Estimated savings analysis"],
    requiredFields: [
      "resource_id",
      "service",
      "finding",
      "current_type",
      "recommended_type",
      "estimated_monthly_savings_usd",
      "confidence",
      "reason",
    ],
    guidance: "The file must contain a JSON array. Each object represents one recommendation.",
    preview:
      '[{"resource_id":"i-ec2-001","service":"EC2","finding":"Over-provisioned","estimated_monthly_savings_usd":82,...}]',
  },
  {
    name: "trusted_advisor_findings.json",
    format: "JSON array",
    purpose: [
      "Trusted Advisor-style optimization findings",
      "Cost-saving opportunities",
      "Operational recommendations",
    ],
    requiredFields: [
      "check_id",
      "category",
      "resource_id",
      "service",
      "status",
      "finding",
      "estimated_monthly_savings_usd",
      "recommended_action",
      "risk",
      "owner",
    ],
    guidance: "The file must contain a JSON array. Each object represents one advisory finding.",
    preview:
      '[{"check_id":"TA-001","resource_id":"vol-ebs-002","service":"EBS","status":"warning",...}]',
  },
] as const;

export type UploadFileName = (typeof UPLOAD_FILE_REQUIREMENTS)[number]["name"];

export const REQUIRED_UPLOAD_FILE_NAMES = UPLOAD_FILE_REQUIREMENTS.map(
  (requirement) => requirement.name,
) as UploadFileName[];

export function isRequiredUploadFileName(name: string): name is UploadFileName {
  return REQUIRED_UPLOAD_FILE_NAMES.includes(name as UploadFileName);
}
