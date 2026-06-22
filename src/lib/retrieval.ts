import type { ActiveDataset } from "@/lib/active-dataset";
import type { DatasetChunk, RetrievedDatasetChunk } from "@/lib/copilot-types";
import type { DatasetSummary } from "@/lib/types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "for",
  "from",
  "i",
  "in",
  "is",
  "me",
  "my",
  "of",
  "on",
  "the",
  "to",
  "what",
  "which",
]);

const QUERY_EXPANSIONS: Record<string, string[]> = {
  action: ["recommendation", "recommended", "finding", "savings"],
  bill: ["cost", "spend", "monthly", "change"],
  change: ["increase", "decrease", "previous", "current", "spike"],
  fix: ["finding", "recommended", "action", "savings", "high"],
  increase: ["change", "previous", "current", "spike", "cost"],
  jira: ["ticket", "finding", "action", "owner"],
  priority: ["high", "severity", "savings", "finding", "action"],
  safe: ["risk", "idle", "unattached", "stop", "shutdown"],
  savings: ["save", "opportunity", "finding", "recommendation"],
  shutdown: ["stop", "idle", "risk", "unattached"],
  spend: ["cost", "monthly", "service", "team"],
  ticket: ["jira", "finding", "action", "owner"],
};

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function summaryText(name: string, summary: DatasetSummary) {
  return [
    `Dashboard summary for ${name}.`,
    `Current monthly spend ${money(summary.totalMonthlySpend)} in ${summary.dataMonth}.`,
    `Previous monthly spend ${money(summary.previousMonthlySpend)} in ${summary.previousMonth}.`,
    `Cost change ${money(summary.costChange)} (${summary.monthChangePercent.toFixed(1)} percent).`,
    `Estimated savings ${money(summary.estimatedMonthlySavings)} monthly and ${money(summary.estimatedYearlySavings)} annually.`,
    `${summary.resourceCount} resources and ${summary.findingCount} findings.`,
    `Severity counts: ${summary.highSeverityCount} high, ${summary.mediumSeverityCount} medium, ${summary.lowSeverityCount} low.`,
  ].join(" ");
}

export function buildDatasetChunks(activeDataset: ActiveDataset): DatasetChunk[] {
  const { analysis, datasets, name, summary } = activeDataset;
  const resources = new Map(datasets.resources.map((resource) => [resource.resourceId, resource]));
  const chunks: DatasetChunk[] = [
    {
      id: "summary:dashboard",
      source: "summary",
      text: summaryText(name, summary),
    },
  ];

  datasets.costs.forEach((cost, index) => {
    chunks.push({
      id: `cost:${cost.month}:${cost.resourceId}:${index}`,
      source: "cost",
      resourceId: cost.resourceId,
      service: cost.service,
      team: cost.team,
      text: `Cost row: ${cost.month}, resource ${cost.resourceId} (${cost.resourceName}), service ${cost.service}, team ${cost.team}, owner ${cost.owner}, monthly cost ${money(cost.monthlyCost)}${cost.environment ? `, environment ${cost.environment}` : ""}${cost.project ? `, project ${cost.project}` : ""}.`,
    });
  });

  datasets.resources.forEach((resource) => {
    chunks.push({
      id: `resource:${resource.resourceId}`,
      source: "resource",
      resourceId: resource.resourceId,
      service: resource.service,
      team: resource.team,
      text: `Resource inventory: ${resource.resourceId} (${resource.resourceName}), ${resource.service} ${resource.resourceType}, status ${resource.status}, owner ${resource.owner}, team ${resource.team}, region ${resource.region}, environment ${resource.environment}, criticality ${resource.criticality}${resource.storageClass ? `, storage class ${resource.storageClass}` : ""}.`,
    });
  });

  datasets.metrics.forEach((metric, index) => {
    const resource = resources.get(metric.resourceId);
    chunks.push({
      id: `metric:${metric.resourceId}:${metric.metricName}:${index}`,
      source: "metric",
      resourceId: metric.resourceId,
      service: resource?.service,
      team: resource?.team,
      text: `Usage metric: resource ${metric.resourceId}, ${metric.metricName} average ${metric.average} ${metric.unit}, maximum ${metric.maximum} ${metric.unit}, measured over ${metric.periodDays} days.`,
    });
  });

  datasets.recommendations.forEach((recommendation, index) => {
    const resource = resources.get(recommendation.resourceId);
    chunks.push({
      id: `optimizer:${recommendation.resourceId}:${index}`,
      source: "optimizer",
      resourceId: recommendation.resourceId,
      service: recommendation.service || resource?.service,
      team: resource?.team,
      text: `Optimizer recommendation for ${recommendation.resourceId}: ${recommendation.recommendation} Estimated monthly savings ${money(recommendation.projectedSavings)}. Risk ${recommendation.risk}. Source ${recommendation.source}${recommendation.confidence ? `. Confidence ${recommendation.confidence}` : ""}${recommendation.reason ? `. Evidence ${recommendation.reason}` : ""}.`,
    });
  });

  datasets.trustedAdvisor.forEach((advisor, index) => {
    const resource = resources.get(advisor.resourceId);
    chunks.push({
      id: `advisor:${advisor.resourceId}:${index}`,
      source: "advisor",
      resourceId: advisor.resourceId,
      service: advisor.service || resource?.service,
      team: resource?.team,
      text: `Trusted Advisor finding for ${advisor.resourceId}: ${advisor.check}. Category ${advisor.category}, status ${advisor.status}. ${advisor.note}${advisor.estimatedSavings === undefined ? "" : ` Estimated monthly savings ${money(advisor.estimatedSavings)}.`}`,
    });
  });

  analysis.findings.forEach((finding) => {
    chunks.push({
      id: `finding:${finding.id}`,
      source: "finding",
      resourceId: finding.resourceId,
      service: finding.service,
      team: finding.team,
      severity: finding.severity,
      text: `Generated finding ${finding.id}: ${finding.severity} severity ${finding.issueType} for ${finding.resourceId} (${finding.resourceName}), service ${finding.service}, team ${finding.team}, owner ${finding.owner}. Monthly cost ${money(finding.monthlyCost)} and estimated monthly savings ${money(finding.estimatedSavings)}. Evidence: ${finding.evidence.join(" ")} Recommended action: ${finding.recommendedAction} Risk: ${finding.riskNote}`,
    });
  });

  analysis.serviceSpend.forEach((service) => {
    const savings = analysis.savingsByService.find((item) => item.service === service.service);
    chunks.push({
      id: `service:${service.service}`,
      source: "service",
      service: service.service,
      text: `Service summary: ${service.service} costs ${money(service.cost)} monthly, ${service.percent.toFixed(1)} percent of total spend, with ${money(savings?.savings ?? 0)} potential monthly savings across ${savings?.findings ?? 0} findings.`,
    });
  });

  analysis.teamExposure.forEach((team) => {
    chunks.push({
      id: `team:${team.team}`,
      source: "team",
      team: team.team,
      text: `Team summary: ${team.team} owns ${money(team.monthlySpend)} in monthly spend, ${money(team.potentialSavings)} in potential monthly savings, and ${team.findings} findings.`,
    });
  });

  return chunks;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_.:$-]+/g, " ").trim();
}

function queryTerms(question: string) {
  const initial = normalize(question)
    .split(/\s+/)
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term));
  const expanded = new Set(initial);
  initial.forEach((term) => QUERY_EXPANSIONS[term]?.forEach((value) => expanded.add(value)));
  return [...expanded];
}

function scoreChunk(question: string, terms: string[], chunk: DatasetChunk) {
  const text = normalize(chunk.text);
  const normalizedQuestion = normalize(question);
  let score = 0;
  if (normalizedQuestion.length > 4 && text.includes(normalizedQuestion)) score += 12;
  terms.forEach((term) => {
    if (text.includes(term)) score += term.length > 5 ? 2.2 : 1.4;
    if (chunk.resourceId && normalize(chunk.resourceId).includes(term)) score += 8;
    if (chunk.service && normalize(chunk.service).includes(term)) score += 4;
    if (chunk.team && normalize(chunk.team).includes(term)) score += 5;
    if (chunk.severity === term) score += 6;
    if (chunk.source === term) score += 3;
  });
  return score;
}

export function retrieveRelevantContext(
  question: string,
  chunks: DatasetChunk[],
  limit = 10,
): RetrievedDatasetChunk[] {
  const terms = queryTerms(question);
  if (terms.length === 0) return [];
  const safeLimit = Math.min(12, Math.max(8, limit));
  return chunks
    .map((chunk) => ({ ...chunk, score: scoreChunk(question, terms, chunk) }))
    .filter((chunk) => chunk.score >= 2)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, safeLimit);
}

export function buildCopilotPrompt({
  question,
  activeDatasetName,
  datasetSummary,
  retrievedContext,
}: {
  question: string;
  activeDatasetName: string;
  datasetSummary: DatasetSummary;
  retrievedContext: RetrievedDatasetChunk[];
}) {
  const context = retrievedContext
    .map((chunk) => `[${chunk.id}] ${chunk.text.slice(0, 900)}`)
    .join("\n");
  return `Active dataset: ${activeDatasetName}

Dataset summary:
${JSON.stringify(datasetSummary)}

Retrieved context:
${context}

User question:
${question}

Answer only from the retrieved context and dataset summary. Cite resource IDs or chunk IDs used. If the answer is not present, reply exactly: I could not find that in the active dataset.`;
}
