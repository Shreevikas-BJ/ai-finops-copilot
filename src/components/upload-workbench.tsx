"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  FileUp,
  LoaderCircle,
  Play,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { UploadValidationStatus } from "@/components/upload-validation-status";
import { currency } from "@/lib/format";
import type { AnalysisResult } from "@/lib/types";
import {
  validateUploadFiles,
  type UploadValidationReport,
} from "@/lib/upload-validation";

export function UploadWorkbench() {
  const inputRef = useRef<HTMLInputElement>(null);
  const validationRun = useRef(0);
  const [files, setFiles] = useState<File[]>([]);
  const [validation, setValidation] = useState<UploadValidationReport | null>(null);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFiles(selectedFiles: File[]) {
    const run = validationRun.current + 1;
    validationRun.current = run;
    setFiles(selectedFiles);
    setResult(null);
    setError("");
    setValidation(null);

    if (selectedFiles.length === 0) {
      setValidating(false);
      return;
    }

    setValidating(true);
    try {
      const report = await validateUploadFiles(selectedFiles);
      if (validationRun.current === run) setValidation(report);
    } catch {
      if (validationRun.current === run) {
        setError("The selected files could not be read. Re-select the five files and try again.");
      }
    } finally {
      if (validationRun.current === run) setValidating(false);
    }
  }

  async function analyze(useUpload: boolean) {
    setLoading(true);
    setError("");
    try {
      if (useUpload) {
        const currentValidation = validation ?? (await validateUploadFiles(files));
        setValidation(currentValidation);
        if (!currentValidation.valid) {
          throw new Error("Resolve the validation issues before analyzing your upload.");
        }
      }

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

  function openFilePicker() {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    inputRef.current.click();
  }

  function resetUpload() {
    validationRun.current += 1;
    setFiles([]);
    setValidation(null);
    setValidating(false);
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
      <section className="rounded-2xl border border-white/[0.075] bg-[#0d1219] p-5 sm:p-6">
        <div className="mb-5">
          <p className="text-sm font-semibold text-white">Choose your data source</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Sample data needs no setup. For your own data, select all five required files together.
          </p>
        </div>

        <button
          type="button"
          onClick={openFilePicker}
          className="grid min-h-48 w-full place-items-center rounded-2xl border border-dashed border-white/[0.14] bg-white/[0.018] p-6 text-center transition hover:border-emerald-400/35 hover:bg-emerald-400/[0.025]"
        >
          <span>
            <span className="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300">
              <FileUp className="size-5" />
            </span>
            <span className="block text-sm font-medium text-slate-200">Select all 5 upload files</span>
            <span className="mt-2 block text-xs leading-5 text-slate-500">
              Exact file names required · CSV and JSON · 2 MB maximum per file
            </span>
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
          onChange={(event) => void handleFiles(Array.from(event.target.files ?? []))}
        />

        {files.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>{files.length} file{files.length === 1 ? "" : "s"} selected</span>
              <span>{validation?.selectedRequiredFiles ?? 0}/5 required files found</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {files.map((file) => (
                <span
                  key={`${file.name}-${file.size}`}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 font-mono text-[11px] text-slate-300"
                >
                  {file.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={loading}
            onClick={() => void analyze(false)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-[#06110c] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />}
            Use Sample Data
          </button>
          <button
            type="button"
            disabled={loading || validating || validation?.valid !== true}
            onClick={() => void analyze(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.035] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileUp className="size-4" /> Analyze Upload
          </button>
          {files.length > 0 && (
            <button
              type="button"
              onClick={resetUpload}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs text-slate-500 hover:text-slate-300"
            >
              <RotateCcw className="size-3.5" /> Reset files
            </button>
          )}
        </div>

        <p className="mt-3 text-[11px] leading-5 text-slate-600">
          Analyze Upload unlocks only after validation passes. Use Sample Data always remains available.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-3 text-xs leading-5 text-rose-200"
          >
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
      </section>

      <UploadValidationStatus report={validation} validating={validating} />
    </div>
  );
}
