"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileUp, LoaderCircle, Play, RotateCcw, TriangleAlert } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { currency } from "@/lib/format";

const expectedFiles = [
  { name: "cost_usage.csv", description: "Monthly resource-level costs", rows: "48 rows" },
  { name: "resource_inventory.csv", description: "Ownership, tags, and metadata", rows: "24 resources" },
  { name: "cloudwatch_metrics.csv", description: "30-day utilization evidence", rows: "14 metrics" },
  { name: "optimizer_recommendations.json", description: "Optimization context", rows: "10 recommendations" },
  { name: "trusted_advisor_findings.json", description: "Advisory context", rows: "7 checks" },
];

export function UploadWorkbench() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyze(useUpload: boolean) {
    setLoading(true);
    setError("");
    try {
      const body = useUpload ? new FormData() : undefined;
      if (body) files.forEach((file) => body.append(file.name, file));
      const response = await fetch("/api/analyze", { method: "POST", body });
      const payload = (await response.json()) as AnalysisResult & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Analysis failed.");
      setResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
      <div className="rounded-2xl border border-white/[0.075] bg-[#0d1219] p-5 sm:p-6">
        <div className="mb-5">
          <p className="text-sm font-semibold text-white">Dataset input</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Use the included demo or replace any files by uploading their exact expected names.
          </p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="grid min-h-48 w-full place-items-center rounded-2xl border border-dashed border-white/[0.14] bg-white/[0.018] p-6 text-center transition hover:border-emerald-400/35 hover:bg-emerald-400/[0.025]"
        >
          <span>
            <span className="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300">
              <FileUp className="size-5" />
            </span>
            <span className="block text-sm font-medium text-slate-200">Choose CSV or JSON files</span>
            <span className="mt-2 block text-xs text-slate-500">Up to 2 MB per file · processed in memory only</span>
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".csv,.json,application/json,text/csv"
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
        />

        {files.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {files.map((file) => (
              <span key={`${file.name}-${file.size}`} className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 font-mono text-[11px] text-slate-300">
                {file.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={loading}
            onClick={() => analyze(false)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-[#06110c] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />}
            Use included sample
          </button>
          <button
            type="button"
            disabled={loading || files.length === 0}
            onClick={() => analyze(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.035] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileUp className="size-4" /> Analyze upload
          </button>
          {files.length > 0 && (
            <button
              type="button"
              onClick={() => { setFiles([]); setResult(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs text-slate-500 hover:text-slate-300"
            >
              <RotateCcw className="size-3.5" /> Reset
            </button>
          )}
        </div>

        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-3 text-xs leading-5 text-rose-200">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {error}
          </div>
        )}

        {result && (
          <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.045] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
              <CheckCircle2 className="size-4" /> Analysis complete
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Resources", result.resourceCount],
                ["Findings", result.wasteFindings],
                ["Spend", currency.format(result.totalMonthlySpend)],
                ["Savings", currency.format(result.estimatedMonthlySavings)],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <p className="text-[10px] uppercase tracking-widest text-emerald-300/60">{label}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/[0.075] bg-[#0d1219] p-5 sm:p-6">
        <div className="mb-5">
          <p className="text-sm font-semibold text-white">Included sample</p>
          <p className="mt-1 text-xs text-slate-500">Realistic, synthetic AWS-shaped data</p>
        </div>
        <div className="space-y-2.5">
          {expectedFiles.map((file) => (
            <div key={file.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate font-mono text-xs font-medium text-slate-200">{file.name}</p>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-slate-500">{file.rows}</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">{file.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-sky-400/15 bg-sky-400/[0.04] p-4 text-xs leading-5 text-sky-200/75">
          Uploaded data is analyzed for the current request only. This MVP has no database, persistence, AWS credentials, or destructive actions.
        </div>
      </div>
    </div>
  );
}
