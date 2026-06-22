import type { AnalysisResult, ExecutiveReport } from "@/lib/types";
import { currency, monthLabel, percent } from "@/lib/format";

export function generateExecutiveReport(analysis: AnalysisResult): ExecutiveReport {
  const topFindings = analysis.findings.slice(0, 5);
  const priorityActions = topFindings
    .map(
      (finding, index) =>
        `${index + 1}. **${finding.ticketTitle}** — ${finding.team} / ${finding.owner}. Save ${currency.format(finding.estimatedSavings)}/month. ${finding.recommendedAction}`,
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
        `### FINOPS-${String(index + 1).padStart(3, "0")} · ${finding.ticketTitle}\n\n${finding.ticketBody}`,
    )
    .join("\n\n");

  const summary = `${currency.format(analysis.totalMonthlySpend)} current monthly spend with ${currency.format(analysis.estimatedMonthlySavings)} in identified monthly savings across ${analysis.wasteFindings} findings.`;
  const markdown = `# AI FinOps Executive Report

**Reporting period:** ${monthLabel(analysis.dataMonth)}  
**Scope:** ${analysis.resourceCount} resources across ${analysis.serviceSpend.length} services  
**Mode:** Read-only analysis; no cloud resources were changed.

## Executive summary

Cloud spend is **${currency.format(analysis.totalMonthlySpend)}/month**, up **${percent(analysis.monthChangePercent)}** from ${monthLabel(analysis.previousMonth)}. The analysis identified **${currency.format(analysis.estimatedMonthlySavings)}/month** (**${currency.format(analysis.estimatedYearlySavings)}/year**) in explainable, owner-assigned opportunities.

## Cost summary

${analysis.serviceSpend.map((item) => `- **${item.service}:** ${currency.format(item.cost)} (${percent(item.percent)} of spend)`).join("\n")}

## Top findings

${topFindings.map((finding) => `- **${finding.issueType} · ${finding.resourceId}:** ${currency.format(finding.monthlyCost)}/month cost, ${currency.format(finding.estimatedSavings)}/month opportunity, ${finding.severity} severity.`).join("\n")}

## Priority actions

${priorityActions}

## Team ownership

${ownership}

## Risk notes

${topFindings.map((finding) => `- **${finding.resourceId}:** ${finding.riskNote}`).join("\n")}

## Jira / GitHub-style action items

${tickets}

---

This report is decision support, not proof of realized savings. Owners should validate dependencies, performance, and change controls before execution.`;

  return {
    title: "AI FinOps Executive Report",
    period: monthLabel(analysis.dataMonth),
    summary,
    markdown,
  };
}
