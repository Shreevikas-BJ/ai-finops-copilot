"use client";

import Link from "next/link";
import {
  CalendarClock,
  CircleDollarSign,
  CloudCog,
  Database,
  FileSearch,
  FileText,
  History,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { useActiveDataset } from "@/components/active-dataset-provider";
import { DashboardInsights } from "@/components/dashboard-insights";
import { DashboardMetricCard } from "@/components/dashboard-metric-card";
import { DatasetEmptyState, DatasetPageLoading } from "@/components/dataset-empty-state";
import { DatasetHistory } from "@/components/dataset-history";
import { EmbeddedCopilot } from "@/components/embedded-copilot";
import { FindingsExplorer } from "@/components/findings-explorer";
import { MetricDetailList } from "@/components/metric-detail-list";
import { Panel } from "@/components/ui";
import { currency, monthLabel, percent } from "@/lib/format";

export function DashboardContent() {
  const { activeDataset, ready } = useActiveDataset();
  if (!ready) return <DatasetPageLoading />;
  if (!activeDataset) {
    return (
      <DatasetEmptyState
        title="No dashboard data yet"
        description="Choose Sample Data, upload a named custom dataset, or load a dataset from history."
      />
    );
  }

  const { analysis, datasets, summary } = activeDataset;
  const currentCosts = datasets.costs
    .filter((cost) => cost.month === analysis.dataMonth)
    .sort((a, b) => b.monthlyCost - a.monthlyCost);
  const previousCosts = datasets.costs
    .filter((cost) => cost.month === analysis.previousMonth)
    .sort((a, b) => b.monthlyCost - a.monthlyCost);
  const previousByResource = new Map(
    previousCosts.map((cost) => [cost.resourceId, cost.monthlyCost]),
  );
  const costMovers = currentCosts
    .map((cost) => ({
      ...cost,
      change: cost.monthlyCost - (previousByResource.get(cost.resourceId) ?? 0),
    }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  const issueCounts = [...new Set(analysis.findings.map((finding) => finding.issueType))]
    .map((issueType) => ({
      issueType,
      count: analysis.findings.filter((finding) => finding.issueType === issueType).length,
    }))
    .sort((a, b) => b.count - a.count);
  const serviceCounts = [...new Set(datasets.resources.map((resource) => resource.service))]
    .map((service) => ({
      service,
      count: datasets.resources.filter((resource) => resource.service === service).length,
    }))
    .sort((a, b) => b.count - a.count);

  const costItems = currentCosts.slice(0, 6).map((cost) => ({
    id: cost.resourceId,
    label: cost.resourceId,
    value: currency.format(cost.monthlyCost),
    meta: `${cost.resourceName} | ${cost.service} | ${cost.team}`,
  }));
  const previousItems = previousCosts.slice(0, 6).map((cost) => ({
    id: cost.resourceId,
    label: cost.resourceId,
    value: currency.format(cost.monthlyCost),
    meta: `${cost.service} | ${cost.team}`,
  }));
  const moverItems = costMovers.slice(0, 6).map((cost) => ({
    id: cost.resourceId,
    label: cost.resourceId,
    value: currency.format(cost.change),
    meta: `${cost.service} | ${currency.format(previousByResource.get(cost.resourceId) ?? 0)} to ${currency.format(cost.monthlyCost)}`,
  }));
  const savingsItems = analysis.findings.slice(0, 6).map((finding) => ({
    id: finding.id,
    label: finding.resourceId,
    value: currency.format(finding.estimatedSavings),
    meta: `${finding.severity} | ${finding.issueType}`,
  }));
  const annualSavingsItems = analysis.findings.slice(0, 6).map((finding) => ({
    id: finding.id,
    label: finding.resourceId,
    value: currency.format(finding.estimatedSavings * 12),
    meta: `${currency.format(finding.estimatedSavings)}/month | ${finding.team}`,
  }));
  const resourceItems = serviceCounts.map((service) => ({
    id: service.service,
    label: service.service,
    value: String(service.count),
    meta: "resources",
  }));
  const findingItems = issueCounts.map((issue) => ({
    id: issue.issueType,
    label: issue.issueType,
    value: String(issue.count),
    meta: "findings",
  }));
  const findingsBySeverity = (severity: "high" | "medium" | "low") =>
    analysis.findings
      .filter((finding) => finding.severity === severity)
      .map((finding) => ({
        id: finding.id,
        label: finding.resourceId,
        value: currency.format(finding.estimatedSavings),
        meta: `${finding.issueType} | ${finding.team}`,
      }));

  return (
    <>
      <div className="mb-5 flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.075] bg-[#0d1219] p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400">
            Active FinOps workspace
          </p>
          <h1 className="mt-2 truncate text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
            {activeDataset.name}
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            {activeDataset.sourceLabel} | {monthLabel(analysis.dataMonth)} | Loaded {new Date(activeDataset.loadedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/[0.1] px-3 text-xs font-semibold text-slate-300 hover:bg-white/[0.04]"
          >
            <Database className="size-3.5" /> Change data
          </Link>
          <Link
            href="/report"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-3 text-xs font-semibold text-[#06110c] hover:bg-emerald-300"
          >
            <FileText className="size-3.5" /> Executive report
          </Link>
        </div>
      </div>

      <details className="group mb-4 rounded-2xl border border-white/[0.075] bg-[#0d1219]">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden sm:px-5">
          <History className="size-4 text-violet-300" />
          <span className="flex-1 text-xs font-semibold text-slate-200">Upload and dataset selector</span>
          <span className="text-[10px] text-slate-600">Switch from latest 3</span>
        </summary>
        <div className="grid gap-3 border-t border-white/[0.06] p-3 lg:grid-cols-[auto_1fr]">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.1] px-4 text-xs font-semibold text-slate-300 hover:bg-white/[0.04]"
          >
            <Database className="size-3.5" /> Upload another dataset
          </Link>
          <DatasetHistory compact />
        </div>
      </details>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)] 2xl:grid-cols-[minmax(0,2.15fr)_minmax(390px,1fr)]">
        <div className="min-w-0 space-y-4 xl:col-start-1 xl:row-start-1">
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            <DashboardMetricCard
              label="Current monthly spend"
              value={currency.format(summary.totalMonthlySpend)}
              detail={monthLabel(summary.dataMonth)}
              icon={CircleDollarSign}
            >
              <MetricDetailList items={costItems} empty="No current cost rows." />
            </DashboardMetricCard>
            <DashboardMetricCard
              label="Previous monthly spend"
              value={currency.format(summary.previousMonthlySpend)}
              detail={monthLabel(summary.previousMonth)}
              icon={CalendarClock}
            >
              <MetricDetailList items={previousItems} empty="No previous cost rows." />
            </DashboardMetricCard>
            <DashboardMetricCard
              label="Cost change"
              value={currency.format(summary.costChange)}
              detail={`${percent(summary.monthChangePercent)} month over month`}
              icon={TrendingUp}
            >
              <MetricDetailList items={moverItems} empty="No resource cost changes." />
            </DashboardMetricCard>
            <DashboardMetricCard
              label="Estimated monthly savings"
              value={currency.format(summary.estimatedMonthlySavings)}
              detail="Expand for savings by resource"
              icon={CloudCog}
              accent="emerald"
            >
              <MetricDetailList items={savingsItems} empty="No monthly savings findings." />
            </DashboardMetricCard>
            <DashboardMetricCard
              label="Estimated annual savings"
              value={currency.format(summary.estimatedYearlySavings)}
              detail="Monthly opportunities annualized"
              icon={CloudCog}
              accent="emerald"
            >
              <MetricDetailList items={annualSavingsItems} empty="No annual savings findings." />
            </DashboardMetricCard>
            <DashboardMetricCard
              label="Resources analyzed"
              value={String(summary.resourceCount)}
              detail={`Across ${summary.serviceCount} services`}
              icon={Database}
            >
              <MetricDetailList items={resourceItems} empty="No resources were analyzed." />
            </DashboardMetricCard>
            <DashboardMetricCard
              label="Total findings"
              value={String(summary.findingCount)}
              detail="Deterministic rule matches"
              icon={FileSearch}
            >
              <MetricDetailList items={findingItems} empty="No findings were detected." />
            </DashboardMetricCard>
            <DashboardMetricCard
              label="High severity"
              value={String(summary.highSeverityCount)}
              detail="Savings above $100 or spike above 50%"
              icon={TriangleAlert}
              accent="rose"
            >
              <MetricDetailList items={findingsBySeverity("high")} empty="No high severity findings." maxItems={analysis.findings.length} />
            </DashboardMetricCard>
            <DashboardMetricCard
              label="Medium severity"
              value={String(summary.mediumSeverityCount)}
              detail="Savings from $30 through $100"
              icon={TriangleAlert}
            >
              <MetricDetailList items={findingsBySeverity("medium")} empty="No medium severity findings." maxItems={analysis.findings.length} />
            </DashboardMetricCard>
            <DashboardMetricCard
              label="Low severity"
              value={String(summary.lowSeverityCount)}
              detail="Savings below $30"
              icon={TriangleAlert}
            >
              <MetricDetailList items={findingsBySeverity("low")} empty="No low severity findings." maxItems={analysis.findings.length} />
            </DashboardMetricCard>
          </div>

          <DashboardInsights dataset={activeDataset} />

        </div>

        <aside className="min-w-0 xl:sticky xl:top-20 xl:col-start-2 xl:row-span-2 xl:row-start-1">
          <EmbeddedCopilot />
        </aside>

        <Panel className="overflow-hidden xl:col-start-1 xl:row-start-2">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 [&::-webkit-details-marker]:hidden sm:px-5">
              <div>
                <p className="text-sm font-semibold text-white">Findings workspace</p>
                <p className="mt-1 text-xs text-slate-500">Expand to filter evidence and actions without leaving the dashboard.</p>
              </div>
              <span className="font-mono text-xs text-slate-500">{analysis.findings.length} findings</span>
            </summary>
            <div className="border-t border-white/[0.06] p-4 sm:p-5">
              <FindingsExplorer findings={analysis.findings} limit={8} />
            </div>
          </details>
        </Panel>
      </div>
    </>
  );
}
