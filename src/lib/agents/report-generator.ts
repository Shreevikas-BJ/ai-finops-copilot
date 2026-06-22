import type { AnalysisResult, ExecutiveReport } from "@/lib/types";
import { currency, monthLabel, percent } from "@/lib/format";
import type { ServiceCostChange } from "@/lib/cost-insights";

export function generateExecutiveReport(
  analysis: AnalysisResult,
  options?: {
    datasetName?: string;
    dataSource?: string;
    generatedAt?: string;
    serviceCostChanges?: ServiceCostChange[];
  },
): ExecutiveReport {
  const datasetName = options?.datasetName ?? "Active dataset";
  const dataSource = options?.dataSource ?? "Active dataset";
  const generatedAt = options?.generatedAt ?? new Date().toISOString();
  const topFindings = analysis.findings.slice(0, 5);
  const highSeverity = analysis.findings.filter((finding) => finding.severity === "high");
  const costChange = analysis.totalMonthlySpend - analysis.previousMonthlySpend;
  const serviceCostChanges = (options?.serviceCostChanges ?? analysis.serviceCostChanges ?? [])
    .filter((item) => item.change > 0)
    .slice(0, 5);
  const direction = costChange >= 0 ? "increased" : "decreased";
  const noFindings = "No deterministic waste findings were detected in this dataset.";
  const priorityActions = topFindings
    .map(
      (finding, index) =>
        `${index + 1}. **${finding.ticketTitle}**: ${finding.team} / ${finding.owner}. Save ${currency.format(finding.estimatedSavings)}/month. ${finding.recommendedAction}`,
    )
    .join("\n");
  const ownership = analysis.teamExposure
    .map(
      (team) =>
        `- **${team.team}:** ${team.findings} findings, ${currency.format(team.potentialSavings)}/month potential savings on ${currency.format(team.monthlySpend)} spend.`,
    )
    .join("\n");
  const tickets = topFindings
    .map(
      (finding, index) =>
        `### FINOPS-${String(index + 1).padStart(3, "0")} | ${finding.ticketTitle}\n\n${finding.ticketBody}`,
    )
    .join("\n\n");
  const evidenceRows = analysis.findings
    .slice(0, 10)
    .map(
      (finding) =>
        `| ${finding.resourceId} | ${finding.service} | ${finding.team} | ${finding.severity} | ${finding.evidence[0] || "No evidence supplied"} |`,
    )
    .join("\n");

  const summary = `${currency.format(analysis.totalMonthlySpend)} current monthly spend with ${currency.format(analysis.estimatedMonthlySavings)} in identified monthly savings across ${analysis.findings.length} findings.`;
  const title = `${datasetName} | FinOps Executive Report`;
  const markdown = `# ${title}

- **Reporting period:** ${monthLabel(analysis.dataMonth)}
- **Dataset name:** ${datasetName}
- **Data source used:** ${dataSource}
- **Generated:** ${generatedAt}
- **Scope:** ${analysis.resourceCount} resources across ${analysis.serviceSpend.length} services
- **Mode:** Read-only analysis. No cloud resources were changed.

## Executive summary

Current monthly spend is **${currency.format(analysis.totalMonthlySpend)}**, compared with **${currency.format(analysis.previousMonthlySpend)}** in ${monthLabel(analysis.previousMonth)}. Spend ${direction} by **${currency.format(Math.abs(costChange))}** (${percent(Math.abs(analysis.monthChangePercent))}). The analysis identified **${currency.format(analysis.estimatedMonthlySavings)}/month** and **${currency.format(analysis.estimatedYearlySavings)}/year** in explainable, owner-assigned opportunities.

## Top 5 cost drivers

${analysis.serviceSpend.slice(0, 5).map((item) => `- **${item.service}:** ${currency.format(item.cost)} (${percent(item.percent)} of spend)`).join("\n")}

## Top cost increases

${serviceCostChanges.map((item) => `- **${item.service}:** increased ${currency.format(item.change)} (${percent(item.changePercent)}), from ${currency.format(item.previousCost)} to ${currency.format(item.currentCost)}.`).join("\n") || "No service-level cost increases were detected."}

## Top 5 savings opportunities

${topFindings.map((finding) => `- **${finding.resourceId} | ${finding.issueType}:** ${currency.format(finding.estimatedSavings)}/month savings on ${currency.format(finding.monthlyCost)}/month cost. Owner: ${finding.team} / ${finding.owner}.`).join("\n") || noFindings}

## High severity findings

${highSeverity.map((finding) => `- **${finding.resourceId}:** ${finding.issueType}, ${currency.format(finding.estimatedSavings)}/month opportunity. ${finding.riskNote}`).join("\n") || "No high severity findings were detected."}

## Team ownership summary

${ownership}

## Priority action plan

${priorityActions || noFindings}

## Risk notes

${topFindings.map((finding) => `- **${finding.resourceId}:** ${finding.riskNote}`).join("\n") || "No finding-specific risk notes are required."}

## Jira-style action items

${tickets || "No Jira-style actions are required from the current deterministic findings."}

## Evidence table

| Resource ID | Service | Team | Severity | Primary evidence |
| --- | --- | --- | --- | --- |
${evidenceRows || "| None | None | None | None | No findings detected |"}

This report provides decision support, not proof of realized savings. Owners should validate dependencies, performance, and change controls before execution.`;

  return {
    title,
    period: monthLabel(analysis.dataMonth),
    summary,
    markdown,
    dataSource,
    generatedAt,
  };
}
