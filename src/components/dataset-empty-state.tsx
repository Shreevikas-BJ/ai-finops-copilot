"use client";

import Link from "next/link";
import { ArrowRight, DatabaseZap, LoaderCircle } from "lucide-react";

export function DatasetPageLoading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <LoaderCircle className="size-4 animate-spin text-emerald-400" /> Loading active dataset
      </div>
    </div>
  );
}

export function DatasetEmptyState({
  title = "Load data to continue",
  description = "Start with the built-in sample or upload your own five-file dataset before opening this workspace.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="grid min-h-[62vh] place-items-center">
      <div className="max-w-lg rounded-2xl border border-white/[0.075] bg-[#0d1219] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:p-10">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
          <DatabaseZap className="size-5" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-[#06110c] transition hover:bg-emerald-300"
        >
          Go to Upload <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
