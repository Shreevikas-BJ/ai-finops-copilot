"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, LoaderCircle, Sparkles } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import type { ExecutiveReport } from "@/lib/types";

export function ReportViewer({ initialReport }: { initialReport: ExecutiveReport }) {
  const [report, setReport] = useState(initialReport);
  const [source, setSource] = useState<"deterministic" | "groq">("deterministic");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const copiedTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    };
  }, []);

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report.markdown);
      setCopied(true);
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Clipboard access is unavailable. Select the report text and copy it manually.");
    }
  }

  async function refine() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enhance: true }),
      });
      const payload = (await response.json()) as { report?: ExecutiveReport; source?: "deterministic" | "groq"; error?: string };
      if (!response.ok || !payload.report) throw new Error(payload.error || "Report generation failed.");
      setReport(payload.report);
      setSource(payload.source ?? "deterministic");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Report generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-col justify-between gap-3 rounded-2xl border border-white/[0.075] bg-[#0d1219] p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-slate-200">{report.period} · {source === "groq" ? "AI-refined narrative" : "Deterministic report"}</p>
          <p className="mt-1 text-xs text-slate-500">{report.summary}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={refine} disabled={loading} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.035] px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.07] disabled:opacity-50">
            {loading ? <LoaderCircle className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5 text-emerald-400" />} Refine with Groq
          </button>
          <button type="button" onClick={copyReport} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-3 text-xs font-semibold text-[#06110c] transition hover:bg-emerald-300">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy report"}
          </button>
        </div>
      </div>
      {error && <div role="alert" className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-xs text-rose-200">{error}</div>}
      <article className="mx-auto max-w-5xl rounded-2xl border border-white/[0.075] bg-[#0d1219] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-10">
        <MarkdownContent content={report.markdown} />
      </article>
    </>
  );
}
