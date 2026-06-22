import type { Datasets, Finding } from "@/lib/types";

export interface OptimizationSignal {
  resourceId: string;
  issueType: Finding["issueType"];
  evidence: string[];
  savingsRatio: number;
  recommendedAction: string;
}

export function analyzeUsage(datasets: Datasets): OptimizationSignal[] {
  const metrics = new Map(
    datasets.metrics
      .filter((metric) => metric.metricName === "CPUUtilization")
      .map((metric) => [metric.resourceId, metric]),
  );
  const objectAgeMetrics = new Map(
    datasets.metrics
      .filter((metric) => metric.metricName === "AverageObjectAge")
      .map((metric) => [metric.resourceId, metric]),
  );
  const signals: OptimizationSignal[] = [];

  datasets.resources.forEach((resource) => {
    const metric = metrics.get(resource.resourceId);

    if (
      resource.service === "EC2" &&
      metric &&
      metric.average < 5 &&
      metric.maximum < 15
    ) {
      signals.push({
        resourceId: resource.resourceId,
        issueType: "Idle EC2",
        evidence: [
          `30-day average CPU is ${metric.average}% (rule: < 5%).`,
          `30-day maximum CPU is ${metric.maximum}% (rule: < 15%).`,
        ],
        savingsRatio: 0.85,
        recommendedAction:
          "Confirm workload ownership, snapshot if needed, then stop on a schedule or rightsize the instance.",
      });
    }

    if (resource.service === "EBS" && resource.status.toLowerCase() === "unattached") {
      signals.push({
        resourceId: resource.resourceId,
        issueType: "Unattached EBS",
        evidence: [
          "Inventory status is unattached.",
          "The full provisioned storage charge continues until the volume is deleted.",
        ],
        savingsRatio: 1,
        recommendedAction:
          "Validate retention with the owner, create a final snapshot, and delete the unattached volume after the hold period.",
      });
    }

    if (resource.service === "RDS" && metric && metric.average < 10) {
      signals.push({
        resourceId: resource.resourceId,
        issueType: "Over-provisioned RDS",
        evidence: [
          `30-day average CPU is ${metric.average}% (rule: < 10%).`,
          `Peak CPU is ${metric.maximum}%; validate memory and connections before resizing.`,
        ],
        savingsRatio: resource.environment === "prod" ? 0.45 : 0.4,
        recommendedAction:
          "Benchmark one instance size down, verify memory and connection headroom, then resize in an approved maintenance window.",
      });
    }

    const objectAgeDays =
      resource.objectAgeDays || objectAgeMetrics.get(resource.resourceId)?.average || 0;

    if (
      resource.service === "S3" &&
      resource.storageClass === "Standard" &&
      objectAgeDays > 60
    ) {
      signals.push({
        resourceId: resource.resourceId,
        issueType: "S3 storage class opportunity",
        evidence: [
          `Storage class is Standard and average object age is ${objectAgeDays} days.`,
          "Rule triggers when Standard objects are older than 60 days.",
        ],
        savingsRatio: objectAgeDays > 120 ? 0.5 : 0.45,
        recommendedAction:
          "Review access patterns, then add a lifecycle transition to Intelligent-Tiering or an appropriate archive tier.",
      });
    }
  });

  return signals;
}
