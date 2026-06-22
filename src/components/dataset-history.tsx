"use client";

import { useState } from "react";
import { Check, DatabaseBackup, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { useActiveDataset } from "@/components/active-dataset-provider";
import { currency } from "@/lib/format";

export function DatasetHistory({
  compact = false,
  onLoaded,
}: {
  compact?: boolean;
  onLoaded?: () => void;
}) {
  const {
    activeDataset,
    history,
    loadDataset,
    renameDataset,
    deleteDataset,
  } = useActiveDataset();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");

  function startRename(id: string, currentName: string) {
    setEditingId(id);
    setName(currentName);
  }

  function saveRename() {
    if (!editingId || !name.trim()) return;
    renameDataset(editingId, name);
    setEditingId(null);
    setName("");
  }

  return (
    <section
      id="history"
      className={`rounded-2xl border border-white/[0.075] bg-[#0d1219] ${compact ? "p-4" : "p-5 sm:p-6"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Dataset history</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            The latest three analyzed datasets stay in this browser.
          </p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-2.5 py-1 font-mono text-[10px] text-slate-500">
          {history.length}/3
        </span>
      </div>

      {history.length === 0 ? (
        <div className="mt-5 grid min-h-36 place-items-center rounded-xl border border-dashed border-white/[0.08] p-5 text-center">
          <div>
            <DatabaseBackup className="mx-auto size-5 text-slate-600" />
            <p className="mt-3 text-xs text-slate-400">No saved datasets yet.</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-600">
              Load sample data or analyze a custom upload to start history.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-2.5">
          {history.map((dataset) => {
            const active = dataset.id === activeDataset?.id;
            return (
              <article
                key={dataset.id}
                className={`rounded-xl border p-3.5 ${
                  active
                    ? "border-emerald-400/20 bg-emerald-400/[0.04]"
                    : "border-white/[0.065] bg-white/[0.018]"
                }`}
              >
                {editingId === dataset.id ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="min-w-0 flex-1">
                      <span className="sr-only">Dataset name</span>
                      <input
                        value={name}
                        maxLength={80}
                        onChange={(event) => setName(event.target.value)}
                        className="h-9 w-full rounded-lg border border-white/[0.1] bg-[#080c12] px-3 text-xs text-slate-200"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={saveRename}
                      disabled={!name.trim()}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-400 px-3 text-xs font-semibold text-[#06110c] disabled:opacity-40"
                    >
                      <Check className="size-3.5" /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs text-slate-400 hover:bg-white/[0.04]"
                    >
                      <X className="size-3.5" /> Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-xs font-semibold text-slate-200">
                            {dataset.name}
                          </h3>
                          {active && (
                            <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {dataset.sourceLabel} | {new Date(dataset.loadedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          disabled={active}
                          onClick={() => {
                            loadDataset(dataset.id);
                            onLoaded?.();
                          }}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-[10px] font-semibold text-slate-300 hover:bg-white/[0.04] disabled:cursor-default disabled:opacity-35"
                        >
                          <RotateCcw className="size-3" /> Load
                        </button>
                        <button
                          type="button"
                          onClick={() => startRename(dataset.id, dataset.name)}
                          className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
                          aria-label={`Rename ${dataset.name}`}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDataset(dataset.id)}
                          className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-rose-400/[0.07] hover:text-rose-300"
                          aria-label={`Delete ${dataset.name}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.055] pt-3 text-[10px] text-slate-500">
                      <span>
                        <strong className="block font-mono text-xs text-slate-200">
                          {currency.format(dataset.summary.totalMonthlySpend)}
                        </strong>
                        Monthly spend
                      </span>
                      <span>
                        <strong className="block font-mono text-xs text-emerald-300">
                          {currency.format(dataset.summary.estimatedMonthlySavings)}
                        </strong>
                        Savings
                      </span>
                      <span>
                        <strong className="block font-mono text-xs text-slate-200">
                          {dataset.summary.findingCount}
                        </strong>
                        Findings
                      </span>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
