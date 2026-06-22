"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CircleDollarSign,
  CloudCog,
  Database,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { useActiveDataset } from "@/components/active-dataset-provider";
import { SavingsChart, ServiceSpendChart } from "@/components/charts";
import { DatasetEmptyState, DatasetPageLoading } from "@/components/dataset-empty-state";
import { PageHeader, Panel, ServiceMark, SeverityBadge } from "@/components/ui";
import { currency, monthLabel, percent } from "@/lib/format";

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof CircleDollarSign;
  accent?: boolean;
}) {
  return (
    <Panel className={`p-5 ${accent ? "border-emerald-400/20 bg-emerald-400/[0.045]" : ""}`}>
      <div className="mb-6 flex items-start justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span
          className={`grid size-9 place-items-center rounded-xl ${
            accent ? "bg-emerald-400/12 text-emerald-300" : "bg-white/[0.04] text-slate-400"
          }`}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="font-mono text-2xl font-semibold tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </Panel>
  );
}

export function DashboardContent() {
  const { activeDataset, ready } = useActiveDataset();
  if (!ready) return <DatasetPageLoading />;
  if (!activeDataset) {
    return (
      <DatasetEmptyState
        title="No dashboard data yet"
        description="Choose Sample Data or upload a validated custom dataset to calculate cloud cost and savings metrics."
      />
    );
  }

  const { analysis } = activeDataset;
  const priorityFindings = analysis.findings.slice(0, 5);
  const costChange = analysis.totalMonthlySpend - analysis.previousMonthlySpend;
  const severityCounts = {
    high: analysis.findings.filter((finding) => finding.severity === "high").length,
    medium: analysis.findings.filter((finding) => finding.severity === "medium").length,
    low: analysis.findings.filter((finding) => finding.severity === "low").length,
  };

  return (
    <>
      <PageHeader
        eyebrow={`${monthLabel(analysis.dataMonth)} | ${activeDataset.label}`}
        title="Cloud cost command center"
        description="Every metric below is recalculated from the active dataset and its deterministic findings."
      >
        <Link
          href="/copilot"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-[#06110c] transition hover:bg-emerald-300"
        >
          <Sparkles className="size-4" /> Ask Copilot
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Current monthly spend"
          value={currency.format(analysis.totalMonthlySpend)}
          detail={monthLabel(analysis.dataMonth)}
          icon={CircleDollarSign}
        />
        <MetricCard
          label="Previous monthly spend"
          value={currency.format(analysis.previousMonthlySpend)}
          detail={monthLabel(analysis.previousMonth)}
          icon={CircleDollarSign}
        />
        <MetricCard
          label="Month-over-month change"
          value={currency.format(costChange)}
          detail={`${percent(analysis.monthChangePercent)} compared with the previous month`}
          icon={TrendingUp}
        />
        <MetricCard
          label="Estimated monthly savings"
          value={currency.format(analysis.estimatedMonthlySavings)}
          detail={`${currency.format(analysis.estimatedYearlySavings)} estimated annually`}
          icon={CloudCog}
          accent
        />
        <MetricCard
          label="Resources analyzed"
          value={String(analysis.resourceCount)}
          detail={`Across ${analysis.serviceSpend.length} cloud services`}
          icon={Database}
        />
        <MetricCard
          label="Total findings"
          value={String(analysis.findings.length)}
          detail="Deterministic cost and usage rules"
          icon={TriangleAlert}
        />
        <MetricCard
          label="High severity"
          value={String(severityCounts.high)}
          detail="Savings above $100 or cost spike above 50%"
          icon={TriangleAlert}
        />
        <MetricCard
          label="Medium / low severity"
          value={`${severityCounts.medium} / ${severityCounts.low}`}
          detail="Prioritized by estimated monthly savings"
          icon={TriangleAlert}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel className="p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold text-white">Top services by cost</p>
            <p className="mt-1 text-xs text-slate-500">Current monthly cost distribution</p>
          </div>
          <ServiceSpendChart data={analysis.serviceSpend} />
        </Panel>
        <Panel className="p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold text-white">Savings opportunities</p>
            <p className="mt-1 text-xs text-slate-500">Estimated monthly savings by service</p>
          </div>
          <SavingsChart data={analysis.savingsByService} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-white">Top savings opportunities</p>
              <p className="mt-1 text-xs text-slate-500">Ranked by severity and estimated savings</p>
            </div>
            <Link
              href="/findings"
              className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {priorityFindings.length === 0 ? (
              <div className="px-6 py-12 text-center text-xs leading-5 text-slate-500">
                No deterministic waste findings were detected in this dataset.
              </div>
            ) : priorityFindings.map((finding) => (
              <div
                key={finding.id}
                className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <ServiceMark service={finding.service} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-mono text-xs font-semibold text-slate-200">
                        {finding.resourceId}
                      </p>
                      <SeverityBadge severity={finding.severity} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {finding.issueType} | {finding.team} / {finding.owner}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-mono text-sm font-semibold text-emerald-300">
                    {currency.format(finding.estimatedSavings)}/month
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {currency.format(finding.monthlyCost)} current cost
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-sm font-semibold text-white">Top teams by cost</p>
            <p className="mt-1 text-xs text-slate-500">Current spend and savings ownership</p>
          </div>
          <div className="space-y-3">
            {analysis.teamExposure
              .slice()
              .sort((a, b) => b.monthlySpend - a.monthlySpend)
              .slice(0, 5)
              .map((team) => (
                <div
                  key={team.team}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200">{team.team}</span>
                    <span className="font-mono text-xs font-semibold text-white">
                      {currency.format(team.monthlySpend)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{team.findings} findings</span>
                    <span>{currency.format(team.potentialSavings)} savings</span>
                  </div>
                </div>
              ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
