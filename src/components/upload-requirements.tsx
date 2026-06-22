import {
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileJson,
  FileSpreadsheet,
  XCircle,
} from "lucide-react";
import { UPLOAD_FILE_REQUIREMENTS } from "@/lib/upload-schema";
import type { UploadValidationReport } from "@/lib/upload-validation";

export function UploadRequirements({
  validation,
}: {
  validation: UploadValidationReport | null;
}) {
  return (
    <section className="mb-4 rounded-2xl border border-white/[0.075] bg-[#0d1219] p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-semibold text-white">Required upload files and schemas</p>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
            Custom analysis requires all five files. Expand any file to see its exact fields, purpose,
            and a short example.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          5 required files
        </span>
      </div>

      <div className="mt-5 space-y-2">
        {UPLOAD_FILE_REQUIREMENTS.map((requirement) => {
          const FileIcon = requirement.format === "CSV" ? FileSpreadsheet : FileJson;
          const fileValidation = validation?.files.find((file) => file.name === requirement.name);
          const status = fileValidation?.status ?? "missing";
          const StatusIcon =
            status === "valid" ? CheckCircle2 : status === "invalid" ? XCircle : Circle;
          return (
            <details
              key={requirement.name}
              className="group rounded-xl border border-white/[0.065] bg-white/[0.018] open:bg-white/[0.028]"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.045] text-slate-400">
                  <FileIcon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-xs font-semibold text-slate-200">
                    {requirement.name}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">
                    {requirement.purpose[0]}
                  </span>
                </span>
                <span className="inline-flex rounded-full border border-white/[0.07] px-2 py-1 text-[10px] font-medium text-slate-500">
                  {requirement.format}
                </span>
                <span
                  className={`hidden items-center gap-1 text-[10px] font-medium sm:inline-flex ${
                    status === "valid"
                      ? "text-emerald-400"
                      : status === "invalid"
                        ? "text-rose-300"
                        : "text-slate-600"
                  }`}
                >
                  <StatusIcon className="size-3" />
                  {status === "valid"
                    ? "Valid"
                    : status === "invalid"
                      ? "Fix required"
                      : validation
                        ? "Missing"
                        : "Waiting"}
                </span>
                <ChevronDown className="size-4 shrink-0 text-slate-600 transition-transform group-open:rotate-180" />
              </summary>

              <div className="border-t border-white/[0.06] px-4 py-4 sm:px-5">
                <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Used for
                    </p>
                    <ul className="mt-2.5 space-y-2">
                      {requirement.purpose.map((purpose) => (
                        <li key={purpose} className="flex gap-2 text-xs leading-5 text-slate-400">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                          {purpose}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-[11px] leading-5 text-slate-500">
                      {requirement.guidance}
                    </p>
                    <div className="mt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Example preview
                      </p>
                      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg border border-white/[0.06] bg-[#080c12] p-3 font-mono text-[10px] leading-5 text-slate-400">
                        {requirement.preview}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Required columns or fields
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {requirement.requiredFields.map((field) => (
                        <code
                          key={field}
                          className="rounded-md border border-white/[0.065] bg-[#090d13] px-2 py-1 font-mono text-[10px] text-slate-300"
                        >
                          {field}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
