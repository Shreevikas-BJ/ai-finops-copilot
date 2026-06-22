import type { AnalysisResult, ExecutiveReport } from "@/lib/types";
import { currency, monthLabel, percent } from "@/lib/format";

export function generateExecutiveReport(
  analysis: AnalysisResult,
  options?: { dataSource?: string; generatedAt?: string },
): ExecutiveReport {
  const dataSource = options?.dataSource ?? "Active dataset";
  const generatedAt = options?.generatedAt ?? new Date().toISOString();
  const topFindings = analysis.findings.slice(0, 5);
  const costChange = analysis.totalMonthlySpend - analysis.previousMonthlySpend;
  const direction = costChange >= 0 ? "increased" : "decreased";
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
  const noFindings = "No deterministic waste findings were detected in this dataset.";
  const tickets = topFindings
    .map(
      (finding, index) =>
        `### FINOPS-${String(index + 1).padStart(3, "0")} | ${finding.ticketTitle}\n\n${finding.ticketBody}`,
    )
    .join("\n\n");

  const summary = `${currency.format(analysis.totalMonthlySpend)} current monthly spend with ${currency.format(analysis.estimatedMonthlySavings)} in identified monthly savings across ${analysis.findings.length} findings.`;
  const markdown = `# AI FinOps Executive Report

- **Reporting period:** ${monthLabel(analysis.dataMonth)}
- **Data source:** ${dataSource}
- **Generated:** ${generatedAt}
- **Scope:** ${analysis.resourceCount} resources across ${analysis.serviceSpend.length} services
- **Mode:** Read-only analysis. No cloud resources were changed.

## Executive summary

Cloud spend is **${currency.format(analysis.totalMonthlySpend)}/month**. Spend ${direction} by **${currency.format(Math.abs(costChange))}** (${percent(Math.abs(analysis.monthChangePercent))}) compared with ${monthLabel(analysis.previousMonth)}. The analysis identified **${currency.format(analysis.estimatedMonthlySavings)}/month** and **${currency.format(analysis.estimatedYearlySavings)}/year** in explainable, owner-assigned opportunities.

## Top cost drivers

${analysis.serviceSpend.map((item) => `- **${item.service}:** ${currency.format(item.cost)} (${percent(item.percent)} of spend)`).join("\n")}

## Top waste findings

${topFindings.map((finding) => `- **${finding.issueType} | ${finding.resourceId}:** ${currency.format(finding.monthlyCost)}/month cost, ${currency.format(finding.estimatedSavings)}/month opportunity, ${finding.severity} severity.`).join("\n") || noFindings}

## Team ownership summary

${ownership}

## Priority action plan

${priorityActions || noFindings}

## Risk notes

${topFindings.map((finding) => `- **${finding.resourceId}:** ${finding.riskNote}`).join("\n") || "No finding-specific risk notes are required."}

## Jira-style action items

${tickets || "No Jira-style actions are required from the current deterministic findings."}

---

This report provides decision support, not proof of realized savings. Owners should validate dependencies, performance, and change controls before execution.`;

  return {
    title: "AI FinOps Executive Report",
    period: monthLabel(analysis.dataMonth),
    summary,
    markdown,
    dataSource,
    generatedAt,
  };
}
