"use client";

import { TriangleAlert } from "lucide-react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="grid min-h-[65vh] place-items-center text-center">
      <div className="max-w-md rounded-2xl border border-rose-400/15 bg-rose-400/[0.04] p-8">
        <TriangleAlert className="mx-auto size-7 text-rose-300" />
        <h1 className="mt-4 text-xl font-semibold text-white">The analysis hit a snag</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          No cloud actions were taken. Retry the read-only analysis or check the server configuration.
        </p>
        <button type="button" onClick={reset} className="mt-5 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#06110c] hover:bg-emerald-300">
          Try again
        </button>
      </div>
    </div>
  );
}
