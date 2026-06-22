"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  Download,
  FileClock,
  FileUp,
  LoaderCircle,
  Play,
  RotateCcw,
  TriangleAlert,
  UploadCloud,
} from "lucide-react";
import { useActiveDataset } from "@/components/active-dataset-provider";
import { DatasetHistory } from "@/components/dataset-history";
import { UploadRequirements } from "@/components/upload-requirements";
import { UploadValidationStatus } from "@/components/upload-validation-status";
import type { AnalyzedDatasetPayload } from "@/lib/types";
import {
  validateUploadFiles,
  type UploadValidationReport,
} from "@/lib/upload-validation";

type LoadingSource = "custom" | "sample" | null;

export function UploadWorkbench() {
  const router = useRouter();
  const { activeDataset, history, activateDataset, clearDataset } = useActiveDataset();
  const inputRef = useRef<HTMLInputElement>(null);
  const validationRun = useRef(0);
  const [files, setFiles] = useState<File[]>([]);
  const [datasetName, setDatasetName] = useState("");
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
        if (!datasetName.trim()) throw new Error("Enter a name for this custom dataset.");
        const currentValidation = validation ?? (await validateUploadFiles(files));
        setValidation(currentValidation);
        if (!currentValidation.valid) {
          throw new Error("Resolve every validation issue before analyzing this upload.");
        }
      }

      const body = source === "custom" ? new FormData() : undefined;
      if (body) files.forEach((file) => body.append(file.name, file));
      const response = await fetch("/api/analyze", { method: "POST", body });
      const payload = (await response.json()) as AnalyzedDatasetPayload & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Analysis failed.");

      activateDataset({
        name: source === "sample" ? "Sample AWS FinOps Dataset" : datasetName,
        source,
        payload,
      });
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
    setDatasetName("");
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
              Active dataset: {activeDataset.name}
            </p>
            <p className="mt-1 text-[11px] text-emerald-100/55">
              {activeDataset.sourceLabel} | Loaded {new Date(activeDataset.loadedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-left text-xs font-semibold text-emerald-300 hover:text-emerald-200"
            >
              Open dashboard
            </button>
            <button
              type="button"
              onClick={clearDataset}
              className="text-left text-xs font-semibold text-slate-500 hover:text-slate-300"
            >
              Clear active data
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-emerald-400/18 bg-emerald-400/[0.045] p-5 sm:p-6">
          <span className="grid size-11 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300">
            <Database className="size-5" />
          </span>
          <h2 className="mt-5 text-base font-semibold text-white">Use Sample Data</h2>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Load the included synthetic dataset and save it to browser history.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <button
              type="button"
              disabled={loadingSource !== null}
              onClick={() => void activate("sample")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-[#06110c] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingSource === "sample" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              {loadingSource === "sample" ? "Validating sample" : "Use Sample Data"}
            </button>
            <a
              href="/api/sample-data"
              download
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] px-3 text-xs font-semibold text-emerald-100 hover:bg-emerald-300/[0.1]"
            >
              <Download className="size-3.5" /> Download Sample Data
            </a>
          </div>
        </section>

        <section className="rounded-2xl border border-sky-400/18 bg-sky-400/[0.04] p-5 sm:p-6">
          <span className="grid size-11 place-items-center rounded-xl bg-sky-400/10 text-sky-300">
            <UploadCloud className="size-5" />
          </span>
          <h2 className="mt-5 text-base font-semibold text-white">Upload Custom Data</h2>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Name the dataset, select all five files, validate them, and run analysis.
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

        <section className="rounded-2xl border border-violet-400/18 bg-violet-400/[0.04] p-5 sm:p-6">
          <span className="grid size-11 place-items-center rounded-xl bg-violet-400/10 text-violet-300">
            <FileClock className="size-5" />
          </span>
          <h2 className="mt-5 text-base font-semibold text-white">Load from History</h2>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Switch the dashboard and Copilot to one of the latest three datasets.
          </p>
          <a
            href="#history"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-300/10 px-4 text-sm font-semibold text-violet-100 hover:bg-violet-300/15"
          >
            View {history.length} saved dataset{history.length === 1 ? "" : "s"}
          </a>
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
              Dataset name, file names, and field names are required.
            </p>
          </div>

          <label className="mb-4 block">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Dataset name
            </span>
            <input
              value={datasetName}
              onChange={(event) => setDatasetName(event.target.value)}
              maxLength={80}
              placeholder="Example: Production costs, May 2026"
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-[#080c12] px-3.5 text-sm text-slate-200 placeholder:text-slate-600"
            />
          </label>

          <button
            type="button"
            onClick={openFilePicker}
            className="grid min-h-36 w-full place-items-center rounded-2xl border border-dashed border-white/[0.14] bg-white/[0.018] p-6 text-center transition hover:border-sky-400/35 hover:bg-sky-400/[0.025]"
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
                loadingSource !== null ||
                validating ||
                validation?.valid !== true ||
                !datasetName.trim()
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
            {(files.length > 0 || datasetName) && (
              <button
                type="button"
                onClick={resetUpload}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs text-slate-500 hover:text-slate-300"
              >
                <RotateCcw className="size-3.5" /> Reset upload
              </button>
            )}
          </div>
        </section>

        <UploadValidationStatus report={validation} validating={validating} />
      </div>

      <div className="mt-4">
        <DatasetHistory onLoaded={() => router.push("/dashboard")} />
      </div>
    </>
  );
}
