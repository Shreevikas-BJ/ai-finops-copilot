import type { CostAnalysis } from "@/lib/agents/cost-analyzer";
import type { AnomalySignal } from "@/lib/agents/anomaly-detector";
import type { OptimizationSignal } from "@/lib/agents/usage-analyzer";
import type { Datasets, Finding, Severity } from "@/lib/types";

function severityFor(savings: number, spikePercent?: number): Severity {
  if (savings > 100 || (spikePercent ?? 0) > 50) return "high";
  if (savings >= 30) return "medium";
  return "low";
}

function riskNote(criticality: "high" | "medium" | "low", issue: Finding["issueType"]) {
  if (criticality === "high") {
    return "Production or business-critical resource: require owner approval, rollback steps, and a maintenance window.";
  }
  if (issue === "Unattached EBS") {
    return "Low runtime risk, but snapshot and retention validation are required before deletion.";
  }
  if (criticality === "medium") {
    return "Validate dependencies and monitor after the change; use a reversible first step.";
  }
  return "Low operational risk after ownership and dependency checks.";
}

export function recommendOptimizations(
  datasets: Datasets,
  costs: CostAnalysis,
  signals: Array<OptimizationSignal | AnomalySignal>,
): Finding[] {
  const resources = new Map(datasets.resources.map((item) => [item.resourceId, item]));
  const recommendations = new Map(
    datasets.recommendations.map((item) => [item.resourceId, item]),
  );
  const advisor = new Map(
    datasets.trustedAdvisor.map((item) => [item.resourceId, item]),
  );

  const findings = signals.flatMap((signal) => {
    const resource = resources.get(signal.resourceId);
    if (!resource) return [];
    const monthlyCost = costs.currentByResource.get(signal.resourceId) ?? 0;
    const optimizer = recommendations.get(signal.resourceId);
    const trustedAdvisor = advisor.get(signal.resourceId);
    const anomaly = "costSpikePercent" in signal ? signal : undefined;
    const estimatedSavings = Number(
      (optimizer?.projectedSavings ?? monthlyCost * signal.savingsRatio).toFixed(2),
    );
    const recommendedAction = optimizer?.recommendation ?? signal.recommendedAction;
    const evidence = [
      ...signal.evidence,
      ...(trustedAdvisor ? [`Trusted Advisor context: ${trustedAdvisor.note}`] : []),
    ];
    const severity = severityFor(estimatedSavings, anomaly?.costSpikePercent);
    const title = `[${severity.toUpperCase()}] ${signal.issueType}: ${signal.resourceId}`;

    return [
      {
        id: signal.resourceId,
        resourceId: signal.resourceId,
        resourceName: resource.resourceName,
        service: resource.service,
        owner: resource.owner,
        team: resource.team,
        region: resource.region,
        environment: resource.environment,
        monthlyCost,
        issueType: signal.issueType,
        severity,
        estimatedSavings,
        savingsPercent: monthlyCost ? (estimatedSavings / monthlyCost) * 100 : 0,
        costSpikePercent: anomaly?.costSpikePercent,
        evidence,
        recommendedAction,
        risk: optimizer?.risk ?? resource.criticality,
        riskNote: riskNote(resource.criticality, signal.issueType),
        ticketTitle: title,
        ticketBody: [
          `Owner: ${resource.owner} (${resource.team})`,
          `Resource: ${signal.resourceId} in ${resource.region}`,
          `Monthly cost: $${monthlyCost.toFixed(2)}`,
          `Estimated monthly savings: $${estimatedSavings.toFixed(2)}`,
          `Action: ${recommendedAction}`,
          `Risk controls: ${riskNote(resource.criticality, signal.issueType)}`,
          "Done when: owner approves, change is executed through normal controls, and savings are verified after 7 days.",
        ].join("\n"),
      },
    ];
  });

  const rank: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  return findings.sort(
    (a, b) => rank[a.severity] - rank[b.severity] || b.estimatedSavings - a.estimatedSavings,
  );
}
