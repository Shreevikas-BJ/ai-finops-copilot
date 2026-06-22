import {
  CheckCircle2,
  Circle,
  FileCheck2,
  FileX2,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import type { UploadValidationReport } from "@/lib/upload-validation";
import { REQUIRED_UPLOAD_FILE_NAMES } from "@/lib/upload-schema";

export function UploadValidationStatus({
  report,
  validating,
}: {
  report: UploadValidationReport | null;
  validating: boolean;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.075] bg-[#0d1219] p-5 sm:p-6" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Upload validation</p>
          <p className="mt-1 text-xs text-slate-500">Checks run in your browser before analysis</p>
        </div>
        {validating ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/15 bg-sky-400/[0.05] px-2.5 py-1 text-[10px] font-semibold text-sky-300">
            <LoaderCircle className="size-3 animate-spin" /> Checking
          </span>
        ) : report?.valid ? (
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
            Passed
          </span>
        ) : report ? (
          <span className="rounded-full border border-rose-400/20 bg-rose-400/[0.07] px-2.5 py-1 text-[10px] font-semibold text-rose-300">
            Needs attention
          </span>
        ) : (
          <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[10px] font-semibold text-slate-500">
            Waiting
          </span>
        )}
      </div>

      {validating ? (
        <div className="mt-5 grid min-h-48 place-items-center rounded-xl border border-dashed border-white/[0.08] text-center">
          <div>
            <LoaderCircle className="mx-auto size-5 animate-spin text-sky-300" />
            <p className="mt-3 text-xs text-slate-400">Checking file names, schemas, values, and resource IDs…</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 space-y-2">
            {(report?.files ?? REQUIRED_UPLOAD_FILE_NAMES.map((name) => ({ name, status: "missing" as const, issueCount: 0 }))).map(
              (file) => {
                const Icon = file.status === "valid" ? FileCheck2 : file.status === "invalid" ? FileX2 : Circle;
                return (
                  <div key={file.name} className="flex items-center gap-3 rounded-lg border border-white/[0.055] bg-white/[0.018] px-3 py-2.5">
                    <Icon className={`size-4 shrink-0 ${file.status === "valid" ? "text-emerald-400" : file.status === "invalid" ? "text-rose-300" : "text-slate-700"}`} />
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-300">{file.name}</span>
                    <span className={`text-[10px] font-medium ${file.status === "valid" ? "text-emerald-400" : file.status === "invalid" ? "text-rose-300" : "text-slate-600"}`}>
                      {file.status === "valid" ? "Valid" : file.status === "invalid" ? `${file.issueCount} issue${file.issueCount === 1 ? "" : "s"}` : "Required"}
                    </span>
                  </div>
                );
              },
            )}
          </div>

          {!report && (
            <div className="mt-4 rounded-xl border border-sky-400/15 bg-sky-400/[0.04] p-3 text-xs leading-5 text-sky-100/65">
              Select all five required files in one step. We will show exactly what to fix before anything is uploaded.
            </div>
          )}

          {report?.valid && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.055] p-3.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" />
              <div>
                <p className="text-xs font-semibold text-emerald-100">All files passed validation</p>
                <p className="mt-1 text-[11px] leading-5 text-emerald-100/55">
                  Required schemas and cross-file resource IDs are valid. Your upload is ready to analyze.
                </p>
              </div>
            </div>
          )}

          {report && !report.valid && (
            <div className="mt-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-rose-200">
                <TriangleAlert className="size-4" />
                {report.issues.length} validation issue{report.issues.length === 1 ? "" : "s"} to resolve
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {report.issues.map((issue) => (
                  <div key={`${issue.code}-${issue.fileName}-${issue.message}`} className="rounded-lg border border-rose-400/12 bg-rose-400/[0.035] p-3">
                    <p className="font-mono text-[10px] font-semibold text-rose-200">{issue.fileName}</p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-300">{issue.message}</p>
                    <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
                      <span className="font-semibold text-slate-400">How to fix:</span> {issue.resolution}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
