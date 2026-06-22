import { ChevronDown, type LucideIcon } from "lucide-react";

export function DashboardMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  children,
  accent = "default",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  children: React.ReactNode;
  accent?: "default" | "emerald" | "rose";
}) {
  const accentStyles = {
    default: "border-white/[0.075] bg-[#0d1219]",
    emerald: "border-emerald-400/20 bg-emerald-400/[0.04]",
    rose: "border-rose-400/20 bg-rose-400/[0.035]",
  };
  return (
    <details className={`group rounded-2xl border ${accentStyles[accent]}`}>
      <summary className="cursor-pointer list-none p-4 [&::-webkit-details-marker]:hidden sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-medium text-slate-400">{label}</span>
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-slate-400">
            <Icon className="size-3.5" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-5 font-mono text-xl font-semibold tracking-[-0.04em] text-white sm:text-2xl">
          {value}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[11px] leading-5 text-slate-500">{detail}</p>
          <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-slate-600">
            Details
            <ChevronDown className="size-3 transition group-open:rotate-180" />
          </span>
        </div>
      </summary>
      <div className="border-t border-white/[0.06] px-4 py-4 sm:px-5">{children}</div>
    </details>
  );
}
