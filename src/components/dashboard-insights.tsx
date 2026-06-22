import { ChevronDown, ListChecks, Users } from "lucide-react";
import { SavingsChart, ServiceSpendChart } from "@/components/charts";
import { Panel, SeverityBadge } from "@/components/ui";
import { currency, percent } from "@/lib/format";
import type { ActiveDataset } from "@/lib/active-dataset";

export function DashboardInsights({ dataset }: { dataset: ActiveDataset }) {
  const { analysis, datasets } = dataset;
  const currentCosts = datasets.costs.filter((cost) => cost.month === analysis.dataMonth);
  const topFindings = analysis.findings.slice(0, 5);
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-4 sm:p-5">
          <div className="mb-5">
            <p className="text-sm font-semibold text-white">Top services by cost</p>
            <p className="mt-1 text-xs text-slate-500">Expand a service to inspect its resources.</p>
          </div>
          <ServiceSpendChart data={analysis.serviceSpend} />
          <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4">
            {analysis.serviceSpend.slice(0, 5).map((service) => {
              const resources = currentCosts
                .filter((cost) => cost.service === service.service)
                .sort((a, b) => b.monthlyCost - a.monthlyCost);
              return (
                <details key={service.service} className="group rounded-xl border border-white/[0.06] bg-white/[0.018]">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3 [&::-webkit-details-marker]:hidden">
                    <span className="flex-1 text-xs font-medium text-slate-300">{service.service}</span>
                    <span className="font-mono text-[10px] text-slate-500">{percent(service.percent)}</span>
                    <span className="font-mono text-xs font-semibold text-slate-200">{currency.format(service.cost)}</span>
                    <ChevronDown className="size-3.5 text-slate-600 transition group-open:rotate-180" />
                  </summary>
                  <div className="space-y-2 border-t border-white/[0.055] px-3.5 py-3">
                    {resources.slice(0, 6).map((resource) => (
                      <div key={`${service.service}-${resource.resourceId}`} className="flex items-start justify-between gap-3 text-[10px]">
                        <span className="min-w-0">
                          <strong className="block truncate font-mono font-medium text-slate-300">{resource.resourceId}</strong>
                          <span className="block truncate text-slate-600">{resource.resourceName} | {resource.team}</span>
                        </span>
                        <span className="shrink-0 font-mono text-slate-300">{currency.format(resource.monthlyCost)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-violet-400/10 text-violet-300">
              <Users className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Top teams by cost</p>
              <p className="mt-1 text-xs text-slate-500">Ownership, findings, and savings exposure.</p>
            </div>
          </div>
          <div className="space-y-2">
            {analysis.teamExposure
              .slice()
              .sort((a, b) => b.monthlySpend - a.monthlySpend)
              .slice(0, 5)
              .map((team) => {
                const resources = currentCosts
                  .filter((cost) => cost.team === team.team)
                  .sort((a, b) => b.monthlyCost - a.monthlyCost);
                const findings = analysis.findings.filter((finding) => finding.team === team.team);
                return (
                  <details key={team.team} className="group rounded-xl border border-white/[0.06] bg-white/[0.018]">
                    <summary className="cursor-pointer list-none p-3.5 [&::-webkit-details-marker]:hidden">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-slate-200">{team.team}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-white">{currency.format(team.monthlySpend)}</span>
                          <ChevronDown className="size-3.5 text-slate-600 transition group-open:rotate-180" />
                        </div>
                      </div>
                      <div className="mt-2 flex gap-3 text-[10px] text-slate-500">
                        <span>{team.findings} findings</span>
                        <span className="text-emerald-300">{currency.format(team.potentialSavings)} savings</span>
                      </div>
                    </summary>
                    <div className="border-t border-white/[0.055] px-3.5 py-3">
                      <p className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-slate-600">Top resources</p>
                      <div className="space-y-2">
                        {resources.slice(0, 4).map((resource) => (
                          <div key={`${team.team}-${resource.resourceId}`} className="flex justify-between gap-3 text-[10px]">
                            <span className="truncate font-mono text-slate-400">{resource.resourceId}</span>
                            <span className="font-mono text-slate-300">{currency.format(resource.monthlyCost)}</span>
                          </div>
                        ))}
                      </div>
                      {findings.length > 0 && (
                        <p className="mt-3 border-t border-white/[0.05] pt-2 text-[10px] text-slate-500">
                          Highest priority: <span className="text-slate-300">{findings[0].issueType}</span>
                        </p>
                      )}
                    </div>
                  </details>
                );
              })}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-4 sm:p-5">
          <div className="mb-5">
            <p className="text-sm font-semibold text-white">Top savings opportunities</p>
            <p className="mt-1 text-xs text-slate-500">Estimated monthly savings by service and resource.</p>
          </div>
          <SavingsChart data={analysis.savingsByService} />
          <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4">
            {topFindings.map((finding) => (
              <details key={`saving-${finding.id}`} className="group rounded-xl border border-white/[0.06] bg-white/[0.018]">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate font-mono text-[11px] text-slate-200">{finding.resourceId}</strong>
                    <span className="mt-0.5 block truncate text-[10px] text-slate-600">{finding.issueType}</span>
                  </span>
                  <SeverityBadge severity={finding.severity} />
                  <span className="font-mono text-xs font-semibold text-emerald-300">{currency.format(finding.estimatedSavings)}</span>
                  <ChevronDown className="size-3.5 text-slate-600 transition group-open:rotate-180" />
                </summary>
                <div className="border-t border-white/[0.055] px-3.5 py-3 text-[10px] leading-5 text-slate-500">
                  <p>{finding.evidence[0]}</p>
                  <p className="mt-2 text-slate-300">{finding.recommendedAction}</p>
                </div>
              </details>
            ))}
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
              <ListChecks className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Priority action list</p>
              <p className="mt-1 text-xs text-slate-500">Owner-ready actions ranked by severity and savings.</p>
            </div>
          </div>
          <ol className="space-y-2.5">
            {topFindings.map((finding, index) => (
              <li key={`action-${finding.id}`} className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.018] p-3.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-400/10 font-mono text-[10px] font-semibold text-emerald-300">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-slate-200">{finding.issueType} | {finding.resourceId}</p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-500">{finding.recommendedAction}</p>
                  <p className="mt-2 text-[10px] text-emerald-300">{finding.team} / {finding.owner} | {currency.format(finding.estimatedSavings)}/month</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </>
  );
}
