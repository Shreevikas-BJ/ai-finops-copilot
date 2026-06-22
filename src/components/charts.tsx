import { currency } from "@/lib/format";

const colors = ["#34d399", "#60a5fa", "#a78bfa", "#fbbf24", "#fb7185"];

export function ServiceSpendChart({
  data,
}: {
  data: Array<{ service: string; cost: number; percent: number }>;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const segments = data.map((item, index) => ({
    item,
    index,
    length: (item.percent / 100) * circumference,
    offset:
      (data.slice(0, index).reduce((total, previous) => total + previous.percent, 0) /
        100) *
      circumference,
  }));
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[180px_1fr]">
      <div className="relative mx-auto size-44">
        <svg viewBox="0 0 128 128" className="size-full -rotate-90" role="img" aria-label="Service spend distribution">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#18202a" strokeWidth="13" />
          {segments.map(({ item, index, length, offset }) => (
              <circle
                key={item.service}
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke={colors[index % colors.length]}
                strokeWidth="13"
                strokeDasharray={`${Math.max(length - 2, 0)} ${circumference}`}
                strokeDashoffset={-offset}
              />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">Services</span>
          <span className="mt-1 text-2xl font-semibold text-white">{data.length}</span>
        </div>
      </div>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item.service} className="flex items-center gap-3">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
            <span className="flex-1 text-sm text-slate-300">{item.service}</span>
            <span className="font-mono text-xs text-slate-500">{item.percent.toFixed(1)}%</span>
            <span className="w-16 text-right font-mono text-xs font-semibold text-slate-200">
              {currency.format(item.cost)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SavingsChart({
  data,
}: {
  data: Array<{ service: string; savings: number; findings: number }>;
}) {
  const max = Math.max(...data.map((item) => item.savings), 1);
  return (
    <div className="space-y-5">
      {data.map((item) => (
        <div key={item.service}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-300">{item.service}</span>
            <span className="font-mono text-xs text-slate-400">
              {currency.format(item.savings)} · {item.findings} findings
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"
              style={{ width: `${(item.savings / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
