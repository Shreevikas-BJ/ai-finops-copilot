"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  FileUp,
  LoaderCircle,
  Play,
  RotateCcw,
  TriangleAlert,
  UploadCloud,
} from "lucide-react";
import { useActiveDataset } from "@/components/active-dataset-provider";
import { UploadRequirements } from "@/components/upload-requirements";
import { UploadValidationStatus } from "@/components/upload-validation-status";
import type { AnalysisResult } from "@/lib/types";
import {
  validateUploadFiles,
  type UploadValidationReport,
} from "@/lib/upload-validation";

type LoadingSource = "custom" | "sample" | null;

export function UploadWorkbench() {
  const router = useRouter();
  const { activeDataset, activateDataset, clearDataset } = useActiveDataset();
  const inputRef = useRef<HTMLInputElement>(null);
  const validationRun = useRef(0);
  const [files, setFiles] = useState<File[]>([]);
  const [validation, setValidation] = useState<UploadValidationReport | null>(null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const [loadingSource, setLoadingSource] = useState<LoadingSource>(null);

  async function handleFiles(selectedFiles: File[]) {
    const run = validationRun.current + 1;
    validationRun.current = run;
    setFiles(selectedFiles);
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
        setError("The selected files could not be read. Select the five files again and retry.");
      }
    } finally {
      if (validationRun.current === run) setValidating(false);
    }
  }

  async function activate(source: "custom" | "sample") {
    setLoadingSource(source);
    setError("");
    try {
      if (source === "custom") {
        const currentValidation = validation ?? (await validateUploadFiles(files));
        setValidation(currentValidation);
        if (!currentValidation.valid) {
          throw new Error("Resolve every validation issue before analyzing this upload.");
        }
      }

      const body = source === "custom" ? new FormData() : undefined;
      if (body) files.forEach((file) => body.append(file.name, file));
      const response = await fetch("/api/analyze", { method: "POST", body });
      const payload = (await response.json()) as AnalysisResult & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Analysis failed.");

      activateDataset(source, payload);
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis failed.");
    } finally {
      setLoadingSource(null);
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
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      {activeDataset && (
        <div className="mb-4 flex flex-col justify-between gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold text-emerald-100">
              Active dataset: {activeDataset.label}
            </p>
            <p className="mt-1 text-[11px] text-emerald-100/55">
              Loading another source will replace it across Dashboard, Findings, Copilot, and Report.
            </p>
          </div>
          <button
            type="button"
            onClick={clearDataset}
            className="text-left text-xs font-semibold text-emerald-300 hover:text-emerald-200 sm:text-right"
          >
            Clear active data
          </button>
        </div>
      )}

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-emerald-400/18 bg-emerald-400/[0.045] p-5 sm:p-6">
          <span className="grid size-11 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300">
            <Database className="size-5" />
          </span>
          <h2 className="mt-5 text-base font-semibold text-white">Use Sample Data</h2>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Load the included synthetic cost, inventory, metric, optimizer, and advisory files.
            This is the fastest way to explore the full product.
          </p>
          <button
            type="button"
            disabled={loadingSource !== null}
            onClick={() => void activate("sample")}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-[#06110c] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loadingSource === "sample" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            {loadingSource === "sample" ? "Validating sample" : "Use Sample Data"}
          </button>
        </section>

        <section className="rounded-2xl border border-sky-400/18 bg-sky-400/[0.04] p-5 sm:p-6">
          <span className="grid size-11 place-items-center rounded-xl bg-sky-400/10 text-sky-300">
            <UploadCloud className="size-5" />
          </span>
          <h2 className="mt-5 text-base font-semibold text-white">Upload Custom Data</h2>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Select all five required files. They are checked in your browser before the server runs
            deterministic analysis.
          </p>
          <button
            type="button"
            disabled={loadingSource !== null}
            onClick={openFilePicker}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 text-sm font-semibold text-sky-100 transition hover:bg-sky-300/15 disabled:opacity-60 sm:w-auto"
          >
            <FileUp className="size-4" /> Select 5 files
          </button>
        </section>
      </div>

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

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-3 text-xs leading-5 text-rose-200"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {error}
        </div>
      )}

      <UploadRequirements validation={validation} />

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-2xl border border-white/[0.075] bg-[#0d1219] p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-sm font-semibold text-white">Custom upload workspace</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              File names and field names must match the requirements exactly.
            </p>
          </div>

          <button
            type="button"
            onClick={openFilePicker}
            className="grid min-h-40 w-full place-items-center rounded-2xl border border-dashed border-white/[0.14] bg-white/[0.018] p-6 text-center transition hover:border-sky-400/35 hover:bg-sky-400/[0.025]"
          >
            <span>
              <FileUp className="mx-auto mb-3 size-5 text-sky-300" />
              <span className="block text-sm font-medium text-slate-200">Select all 5 upload files</span>
              <span className="mt-2 block text-xs text-slate-500">
                CSV and JSON, 2 MB maximum per file
              </span>
            </span>
          </button>

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

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={
                loadingSource !== null || validating || validation?.valid !== true
              }
              onClick={() => void activate("custom")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-300 px-4 text-sm font-semibold text-[#071018] transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {loadingSource === "custom" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <UploadCloud className="size-4" />
              )}
              {loadingSource === "custom" ? "Running analysis" : "Analyze Custom Data"}
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
        </section>

        <UploadValidationStatus report={validation} validating={validating} />
      </div>
    </>
  );
}
