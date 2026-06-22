export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-28 rounded bg-white/[0.06]" />
      <div className="mt-4 h-9 w-80 max-w-full rounded bg-white/[0.07]" />
      <div className="mt-3 h-4 w-[34rem] max-w-full rounded bg-white/[0.04]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-44 rounded-2xl border border-white/[0.05] bg-white/[0.025]" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="h-80 rounded-2xl border border-white/[0.05] bg-white/[0.025]" />
        <div className="h-80 rounded-2xl border border-white/[0.05] bg-white/[0.025]" />
      </div>
    </div>
  );
}
