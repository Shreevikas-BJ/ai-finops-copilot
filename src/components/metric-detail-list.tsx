export function MetricDetailList({
  items,
  empty,
  maxItems = 6,
}: {
  items: Array<{ id: string; label: string; value: string; meta?: string }>;
  empty: string;
  maxItems?: number;
}) {
  if (items.length === 0) return <p className="text-[11px] text-slate-500">{empty}</p>;
  return (
    <div className="space-y-2">
      {items.slice(0, maxItems).map((item) => (
        <div key={item.id} className="flex items-start justify-between gap-3 text-[10px]">
          <span className="min-w-0">
            <strong className="block truncate font-mono font-medium text-slate-300">
              {item.label}
            </strong>
            {item.meta && <span className="mt-0.5 block truncate text-slate-600">{item.meta}</span>}
          </span>
          <span className="shrink-0 font-mono font-semibold text-slate-300">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
