export type Severity = "high" | "medium" | "low";

export interface CostRecord {
  month: string;
  resourceId: string;
  resourceName: string;
  service: string;
  owner: string;
  team: string;
  monthlyCost: number;
  accountId?: string;
  region?: string;
  usageType?: string;
  usageAmount?: number;
  usageUnit?: string;
  environment?: string;
  project?: string;
}

export interface ResourceRecord {
  resourceId: string;
  resourceName: string;
  service: string;
  resourceType: string;
  status: string;
  owner: string;
  team: string;
  region: string;
  environment: string;
  criticality: "high" | "medium" | "low";
  storageClass?: string;
  sizeOrClass?: string;
  objectAgeDays: number;
  project?: string;
  createdDate?: string;
  production?: boolean;
}

export interface MetricRecord {
  resourceId: string;
  metricName: string;
  average: number;
  maximum: number;
  unit: string;
  periodDays: number;
  metricStart?: string;
  metricEnd?: string;
}

export interface OptimizerRecommendation {
  resourceId: string;
  source: string;
  recommendation: string;
  projectedSavings: number;
  risk: "high" | "medium" | "low";
  service?: string;
  finding?: string;
  currentType?: string;
  recommendedType?: string;
  confidence?: string;
  reason?: string;
}

export interface TrustedAdvisorFinding {
  resourceId: string;
  category: string;
  check: string;
  status: string;
  note: string;
  service?: string;
  estimatedSavings?: number;
  recommendedAction?: string;
  risk?: "high" | "medium" | "low";
  owner?: string;
}

export interface Datasets {
  costs: CostRecord[];
  resources: ResourceRecord[];
  metrics: MetricRecord[];
  recommendations: OptimizerRecommendation[];
  trustedAdvisor: TrustedAdvisorFinding[];
}

export interface Finding {
  id: string;
  resourceId: string;
  resourceName: string;
  service: string;
  owner: string;
  team: string;
  region: string;
  environment: string;
  monthlyCost: number;
  issueType:
    | "Idle EC2"
    | "Unattached EBS"
    | "Over-provisioned RDS"
    | "NAT Gateway cost spike"
    | "S3 storage class opportunity";
  severity: Severity;
  estimatedSavings: number;
  savingsPercent: number;
  costSpikePercent?: number;
  evidence: string[];
  recommendedAction: string;
  risk: "high" | "medium" | "low";
  riskNote: string;
  ticketTitle: string;
  ticketBody: string;
}

export interface AnalysisResult {
  generatedAt: string;
  dataMonth: string;
  previousMonth: string;
  totalMonthlySpend: number;
  previousMonthlySpend: number;
  monthChangePercent: number;
  estimatedMonthlySavings: number;
  estimatedYearlySavings: number;
  wasteFindings: number;
  highRiskAnomalies: number;
  resourceCount: number;
  findings: Finding[];
  serviceSpend: Array<{ service: string; cost: number; percent: number }>;
  savingsByService: Array<{ service: string; savings: number; findings: number }>;
  teamExposure: Array<{
    team: string;
    monthlySpend: number;
    potentialSavings: number;
    findings: number;
  }>;
}

export interface DatasetSummary {
  dataMonth: string;
  previousMonth: string;
  totalMonthlySpend: number;
  previousMonthlySpend: number;
  costChange: number;
  monthChangePercent: number;
  estimatedMonthlySavings: number;
  estimatedYearlySavings: number;
  resourceCount: number;
  findingCount: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  serviceCount: number;
  teamCount: number;
}

export interface AnalyzedDatasetPayload {
  analysis: AnalysisResult;
  datasets: Datasets;
  summary: DatasetSummary;
  fileNames: string[];
}

export interface ExecutiveReport {
  title: string;
  period: string;
  summary: string;
  markdown: string;
  dataSource: string;
  generatedAt: string;
}
