import Link from "next/link";
import {
  ArrowUpRight,
  CircleDollarSign,
  CloudCog,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { SavingsChart, ServiceSpendChart } from "@/components/charts";
import { PageHeader, Panel, ServiceMark, SeverityBadge } from "@/components/ui";
import { getAnalysis } from "@/lib/analysis";
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
      <div className="mb-7 flex items-start justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span className={`grid size-9 place-items-center rounded-xl ${accent ? "bg-emerald-400/12 text-emerald-300" : "bg-white/[0.04] text-slate-400"}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="font-mono text-2xl font-semibold tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </Panel>
  );
}

export default async function DashboardPage() {
  const analysis = await getAnalysis();
  const priorityFindings = analysis.findings.slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow={monthLabel(analysis.dataMonth)}
        title="Cloud cost command center"
        description="A prioritized action layer that connects cloud cost signals to evidence, accountable owners, risk, and ticket-ready next steps."
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
          label="Monthly cloud spend"
          value={currency.format(analysis.totalMonthlySpend)}
          detail={`${percent(analysis.monthChangePercent)} vs. ${monthLabel(analysis.previousMonth)}`}
          icon={CircleDollarSign}
        />
        <MetricCard
          label="Estimated monthly savings"
          value={currency.format(analysis.estimatedMonthlySavings)}
          detail={`${currency.format(analysis.estimatedYearlySavings)} annualized opportunity`}
          icon={CloudCog}
          accent
        />
        <MetricCard
          label="Waste findings"
          value={String(analysis.wasteFindings)}
          detail={`Across ${analysis.serviceSpend.length} cloud services`}
          icon={TriangleAlert}
        />
        <MetricCard
          label="High-risk anomalies"
          value={String(analysis.highRiskAnomalies)}
          detail="Savings > $100 or cost spike > 50%"
          icon={ShieldAlert}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel className="p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold text-white">Top expensive services</p>
            <p className="mt-1 text-xs text-slate-500">Current monthly cost distribution</p>
          </div>
          <ServiceSpendChart data={analysis.serviceSpend} />
        </Panel>
        <Panel className="p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold text-white">Savings opportunity</p>
            <p className="mt-1 text-xs text-slate-500">Deterministic opportunity by service</p>
          </div>
          <SavingsChart data={analysis.savingsByService} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_0.75fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-white">Priority action queue</p>
              <p className="mt-1 text-xs text-slate-500">Ranked by severity and monthly savings</p>
            </div>
            <Link href="/findings" className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {priorityFindings.map((finding) => (
              <div key={finding.id} className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                  <ServiceMark service={finding.service} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-mono text-xs font-semibold text-slate-200">{finding.resourceId}</p>
                      <SeverityBadge severity={finding.severity} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{finding.issueType} · {finding.team} / {finding.owner}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-mono text-sm font-semibold text-emerald-300">{currency.format(finding.estimatedSavings)}/mo</p>
                  <p className="mt-1 text-[11px] text-slate-500">on {currency.format(finding.monthlyCost)} cost</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-sm font-semibold text-white">Ownership radar</p>
            <p className="mt-1 text-xs text-slate-500">Opportunity routed by team</p>
          </div>
          <div className="space-y-3">
            {analysis.teamExposure.map((team) => (
              <div key={team.team} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">{team.team}</span>
                  <span className="font-mono text-xs font-semibold text-emerald-300">{currency.format(team.potentialSavings)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{team.findings} findings</span>
                  <span>{currency.format(team.monthlySpend)} spend</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
