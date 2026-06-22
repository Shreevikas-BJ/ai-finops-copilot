"use client";

import { useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { ServiceMark, SeverityBadge } from "@/components/ui";
import { currency, percent } from "@/lib/format";
import type { Finding, Severity } from "@/lib/types";

export function FindingsExplorer({
  findings,
  limit,
}: {
  findings: Finding[];
  limit?: number;
}) {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [service, setService] = useState("all");
  const [team, setTeam] = useState("all");
  const services = [...new Set(findings.map((item) => item.service))];
  const teams = [...new Set(findings.map((item) => item.team))];

  const normalized = query.trim().toLowerCase();
  const filtered = findings.filter((finding) => {
    const matchesQuery =
      !normalized ||
      [finding.resourceId, finding.resourceName, finding.issueType, finding.owner, finding.team]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    return (
      matchesQuery &&
      (severity === "all" || finding.severity === severity) &&
      (service === "all" || finding.service === service) &&
      (team === "all" || finding.team === team)
    );
  });
  const visibleFindings = limit ? filtered.slice(0, limit) : filtered;

  return (
    <>
      <div className="mb-4 grid gap-3 rounded-2xl border border-white/[0.075] bg-[#0d1219] p-3 sm:grid-cols-2 xl:grid-cols-[1fr_180px_180px_180px]">
        <label className="relative">
          <span className="sr-only">Search findings</span>
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search resource, owner, or issue"
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#090d13] pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600"
          />
        </label>
        {[
          { label: "Severity", value: severity, set: (value: string) => setSeverity(value as Severity | "all"), options: ["all", "high", "medium", "low"] },
          { label: "Service", value: service, set: setService, options: ["all", ...services] },
          { label: "Team", value: team, set: setTeam, options: ["all", ...teams] },
        ].map((filter) => (
          <label key={filter.label}>
            <span className="sr-only">{filter.label}</span>
            <select
              value={filter.value}
              onChange={(event) => filter.set(event.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#090d13] px-3 text-sm text-slate-300"
            >
              {filter.options.map((option) => (
                <option key={option} value={option}>
                  {option === "all"
                    ? filter.label === "Severity"
                      ? "All severities"
                      : `All ${filter.label.toLowerCase()}s`
                    : option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between px-1 text-xs text-slate-500">
        <span>Showing {visibleFindings.length} of {filtered.length} matching findings</span>
        <span>Sorted by severity + savings</span>
      </div>

      {filtered.length === 0 ? (
        <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/[0.1] text-center">
          <div>
            <Search className="mx-auto mb-3 size-5 text-slate-600" />
            <p className="text-sm text-slate-300">No findings match these filters.</p>
            <button type="button" onClick={() => { setQuery(""); setSeverity("all"); setService("all"); setTeam("all"); }} className="mt-2 text-xs font-semibold text-emerald-400">
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleFindings.map((finding) => (
            <article key={finding.id} className="rounded-2xl border border-white/[0.075] bg-[#0d1219] p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                <div className="flex min-w-0 items-start gap-3">
                  <ServiceMark service={finding.service} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-mono text-sm font-semibold text-white">{finding.resourceId}</h2>
                      <SeverityBadge severity={finding.severity} />
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{finding.resourceName}</p>
                    <p className="mt-1.5 text-sm font-medium text-slate-300">{finding.issueType}</p>
                    <p className="mt-1 text-xs text-slate-500">{finding.service} · {finding.region} · {finding.environment}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-5 xl:text-right">
                  <div><p className="text-[10px] uppercase tracking-wider text-slate-600">Monthly cost</p><p className="mt-1 font-mono text-sm text-slate-200">{currency.format(finding.monthlyCost)}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wider text-slate-600">Savings</p><p className="mt-1 font-mono text-sm font-semibold text-emerald-300">{currency.format(finding.estimatedSavings)}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wider text-slate-600">Reduction</p><p className="mt-1 font-mono text-sm text-slate-200">{percent(finding.savingsPercent)}</p></div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 border-t border-white/[0.06] pt-5 lg:grid-cols-[0.8fr_1.2fr_1.4fr]">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Owner</p>
                  <p className="text-sm text-slate-200">{finding.owner}</p>
                  <p className="mt-1 text-xs text-slate-500">{finding.team}</p>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Evidence</p>
                  <ul className="space-y-1.5 text-xs leading-5 text-slate-400">
                    {finding.evidence.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Recommended action</p>
                  <p className="text-xs leading-5 text-slate-300">{finding.recommendedAction}</p>
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/[0.025] p-2.5 text-[11px] leading-4 text-slate-500">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-amber-300" /> {finding.riskNote}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
