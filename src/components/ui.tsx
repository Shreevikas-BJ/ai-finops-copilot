import type { Severity } from "@/lib/types";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/[0.075] bg-[#0d1219] shadow-[0_18px_60px_rgba(0,0,0,0.18)] ${className}`}
    >
      {children}
    </section>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const styles = {
    high: "border-rose-400/20 bg-rose-400/10 text-rose-300",
    medium: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    low: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${styles[severity]}`}
    >
      {severity}
    </span>
  );
}

export function ServiceMark({ service }: { service: string }) {
  const value = service === "NAT Gateway" ? "NAT" : service;
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.04] font-mono text-[10px] font-bold text-slate-300">
      {value.slice(0, 3).toUpperCase()}
    </span>
  );
}
