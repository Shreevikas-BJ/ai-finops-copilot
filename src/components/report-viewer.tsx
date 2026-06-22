"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  Copy,
  Download,
  FileCheck2,
  ShieldAlert,
} from "lucide-react";
import { SeverityBadge } from "@/components/ui";
import { generateExecutiveReport } from "@/lib/agents/report-generator";
import { currency, percent } from "@/lib/format";
import type { AnalysisResult } from "@/lib/types";

export function ReportViewer({
  analysis,
  datasetName,
  dataSource,
  generatedAt,
}: {
  analysis: AnalysisResult;
  datasetName: string;
  dataSource: string;
  generatedAt: string;
}) {
  const report = generateExecutiveReport(analysis, { datasetName, dataSource, generatedAt });
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const copiedTimer = useRef<number | null>(null);
  const topFindings = analysis.findings.slice(0, 5);
  const highSeverity = analysis.findings.filter((finding) => finding.severity === "high");
  const costChange = analysis.totalMonthlySpend - analysis.previousMonthlySpend;

  useEffect(() => {
    return () => {
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    };
  }, []);

  async function copyReport() {
    setError("");
    const markCopied = () => {
      setCopied(true);
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 1800);
    };
    try {
      await navigator.clipboard.writeText(report.markdown);
      markCopied();
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = report.markdown;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copiedWithFallback = document.execCommand("copy");
      textarea.remove();
      if (copiedWithFallback) {
        markCopied();
      } else {
        setError("Clipboard access is unavailable. Select the report text and copy it manually.");
      }
    }
  }

  function downloadMarkdown() {
    const blob = new Blob([report.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const safeName = datasetName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    anchor.download = `${safeName || "ai-finops"}-report-${analysis.dataMonth}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="mb-4 flex flex-col justify-between gap-3 rounded-2xl border border-white/[0.075] bg-[#0d1219] p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-slate-200">{report.period} | {datasetName}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">{dataSource}</p>
          <p className="mt-1 text-xs text-slate-500">Copy or download the full Markdown report.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={downloadMarkdown}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.035] px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.07]"
          >
            <Download className="size-3.5 text-sky-300" /> Download Markdown
          </button>
          <button
            type="button"
            onClick={() => void copyReport()}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-3 text-xs font-semibold text-[#06110c] transition hover:bg-emerald-300"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy Report"}
          </button>
        </div>
      </div>
      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-xs text-rose-200">
          {error}
        </div>
      )}

      <article className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1219] shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
        <header className="border-b border-white/[0.07] bg-gradient-to-br from-emerald-400/[0.08] via-transparent to-sky-400/[0.04] p-6 sm:p-9">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
                <FileCheck2 className="size-4" /> Executive brief
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">
                {report.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{report.summary}</p>
            </div>
            <div className="shrink-0 rounded-xl border border-white/[0.08] bg-black/10 p-3.5 text-xs text-slate-400">
              <p className="font-semibold text-slate-200">{datasetName}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">{dataSource}</p>
              <p className="mt-1 flex items-center gap-1.5"><CalendarDays className="size-3.5" /> {new Date(generatedAt).toLocaleString()}</p>
            </div>
          </div>
        </header>

        <div className="p-5 sm:p-8">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Current monthly spend", currency.format(analysis.totalMonthlySpend)],
              ["Previous monthly spend", currency.format(analysis.previousMonthlySpend)],
              ["Month-over-month change", `${currency.format(costChange)} (${percent(analysis.monthChangePercent)})`],
              ["Estimated monthly savings", currency.format(analysis.estimatedMonthlySavings)],
              ["Estimated annual savings", currency.format(analysis.estimatedYearlySavings)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.022] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
                <p className="mt-3 font-mono text-lg font-semibold text-white">{value}</p>
              </div>
            ))}
          </section>

          <section className="mt-8">
            <h3 className="text-sm font-semibold text-white">Executive summary</h3>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              The active dataset covers {analysis.resourceCount} resources across {analysis.serviceSpend.length} services.
              {" "}Deterministic analysis identified {analysis.findings.length} findings with{" "}
              {currency.format(analysis.estimatedMonthlySavings)} in potential monthly savings. Spend changed by{" "}
              {currency.format(costChange)} compared with the previous month.
            </p>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section>
              <h3 className="text-sm font-semibold text-white">Top cost drivers</h3>
              <div className="mt-3 space-y-2">
                {analysis.serviceSpend.slice(0, 5).map((service) => (
                  <div key={service.service} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.018] px-3.5 py-3">
                    <span className="text-sm text-slate-300">{service.service}</span>
                    <span className="font-mono text-xs text-slate-200">{currency.format(service.cost)} | {percent(service.percent)}</span>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-sm font-semibold text-white">Top savings opportunities</h3>
              <div className="mt-3 space-y-2">
                {topFindings.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/[0.08] px-4 py-8 text-center text-xs text-slate-500">
                    No deterministic waste findings were detected.
                  </div>
                ) : topFindings.map((finding) => (
                  <div key={finding.id} className="rounded-lg border border-white/[0.06] bg-white/[0.018] px-3.5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-mono text-xs text-slate-200">{finding.resourceId}</span>
                      <SeverityBadge severity={finding.severity} />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">{finding.issueType} | {currency.format(finding.estimatedSavings)}/month</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-8">
            <h3 className="text-sm font-semibold text-white">High severity findings</h3>
            {highSeverity.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">No high severity findings were detected.</p>
            ) : (
              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {highSeverity.map((finding) => (
                  <div key={`high-${finding.id}`} className="rounded-xl border border-rose-400/12 bg-rose-400/[0.025] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-mono text-xs text-slate-200">{finding.resourceId}</span>
                      <span className="font-mono text-xs font-semibold text-rose-300">{currency.format(finding.estimatedSavings)}/month</span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">{finding.issueType} | {finding.team}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-8">
            <h3 className="text-sm font-semibold text-white">Team ownership summary</h3>
            <div className="mt-3 overflow-x-auto rounded-xl border border-white/[0.07]">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead className="bg-white/[0.025] text-slate-500">
                  <tr><th className="px-4 py-3 font-medium">Team</th><th className="px-4 py-3 font-medium">Monthly spend</th><th className="px-4 py-3 font-medium">Potential savings</th><th className="px-4 py-3 font-medium">Findings</th></tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-slate-300">
                  {analysis.teamExposure.map((team) => (
                    <tr key={team.team}><td className="px-4 py-3 font-medium text-slate-200">{team.team}</td><td className="px-4 py-3 font-mono">{currency.format(team.monthlySpend)}</td><td className="px-4 py-3 font-mono text-emerald-300">{currency.format(team.potentialSavings)}</td><td className="px-4 py-3">{team.findings}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-sm font-semibold text-white">Priority action plan</h3>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {topFindings.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/[0.08] p-5 text-xs text-slate-500">
                  No cost optimization actions are required from the current deterministic findings.
                </p>
              ) : topFindings.map((finding, index) => (
                <div key={finding.id} className="flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-400/10 font-mono text-xs font-semibold text-emerald-300">{index + 1}</span>
                  <div><p className="text-xs font-semibold text-slate-200">{finding.issueType} | {finding.resourceId}</p><p className="mt-1.5 text-xs leading-5 text-slate-500">{finding.recommendedAction}</p><p className="mt-2 text-[11px] text-emerald-300">Owner: {finding.team} / {finding.owner} | Save {currency.format(finding.estimatedSavings)}/month</p></div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><ShieldAlert className="size-4 text-amber-300" /> Risk notes</h3>
            <div className="mt-3 space-y-2">
              {topFindings.length === 0 ? (
                <p className="text-xs text-slate-500">No finding-specific risk notes are required.</p>
              ) : topFindings.map((finding) => (
                <div key={finding.id} className="rounded-lg border border-amber-400/10 bg-amber-400/[0.025] px-3.5 py-3 text-xs leading-5 text-amber-100/60"><span className="font-mono font-semibold text-amber-200/80">{finding.resourceId}:</span> {finding.riskNote}</div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-sm font-semibold text-white">Jira-style action items</h3>
            <div className="mt-3 space-y-2">
              {topFindings.length === 0 ? (
                <p className="text-xs text-slate-500">No Jira-style actions are required.</p>
              ) : topFindings.map((finding, index) => (
                <details key={finding.id} className="rounded-xl border border-white/[0.07] bg-white/[0.018]">
                  <summary className="cursor-pointer list-none px-4 py-3.5 text-xs font-medium text-slate-200 [&::-webkit-details-marker]:hidden">FINOPS-{String(index + 1).padStart(3, "0")} | {finding.ticketTitle}</summary>
                  <pre className="whitespace-pre-wrap border-t border-white/[0.06] px-4 py-4 font-sans text-xs leading-6 text-slate-500">{finding.ticketBody}</pre>
                </details>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-sm font-semibold text-white">Evidence table</h3>
            <div className="mt-3 overflow-x-auto rounded-xl border border-white/[0.07]">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-white/[0.025] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Resource ID</th>
                    <th className="px-4 py-3 font-medium">Service</th>
                    <th className="px-4 py-3 font-medium">Team</th>
                    <th className="px-4 py-3 font-medium">Severity</th>
                    <th className="px-4 py-3 font-medium">Primary evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-slate-400">
                  {analysis.findings.slice(0, 10).map((finding) => (
                    <tr key={`evidence-${finding.id}`}>
                      <td className="px-4 py-3 font-mono text-slate-200">{finding.resourceId}</td>
                      <td className="px-4 py-3">{finding.service}</td>
                      <td className="px-4 py-3">{finding.team}</td>
                      <td className="px-4 py-3"><SeverityBadge severity={finding.severity} /></td>
                      <td className="max-w-md px-4 py-3 leading-5">{finding.evidence[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
