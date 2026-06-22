"use client";

import Link from "next/link";
import { Database, UploadCloud } from "lucide-react";
import { useActiveDataset } from "@/components/active-dataset-provider";

export function DataSourceIndicator() {
  const { activeDataset, ready } = useActiveDataset();

  if (!ready) {
    return <div className="h-8 w-28 animate-pulse rounded-full bg-white/[0.04]" />;
  }

  if (!activeDataset) {
    return (
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full border border-amber-400/15 bg-amber-400/[0.045] px-3 py-1.5 text-[11px] font-medium text-amber-200/80"
      >
        <Database className="size-3.5" /> No data loaded
      </Link>
    );
  }

  const Icon = activeDataset.source === "sample" ? Database : UploadCloud;
  return (
    <Link
      href="/"
      title="Change active dataset"
      className={`inline-flex max-w-48 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium ${
        activeDataset.source === "sample"
          ? "border-emerald-400/15 bg-emerald-400/[0.055] text-emerald-200"
          : "border-sky-400/15 bg-sky-400/[0.055] text-sky-200"
      }`}
    >
      <Icon className="size-3.5 shrink-0" /> <span className="truncate">{activeDataset.name}</span>
    </Link>
  );
}
