"use client";

import { type FormEvent, useState } from "react";
import { Bot, CheckCircle2, CornerDownLeft, LoaderCircle, ShieldCheck, Sparkles, User } from "lucide-react";
import { useActiveDataset } from "@/components/active-dataset-provider";
import { DatasetEmptyState, DatasetPageLoading } from "@/components/dataset-empty-state";
import { MarkdownContent } from "@/components/markdown-content";
import { PageHeader } from "@/components/ui";
import { buildCopilotDataset } from "@/lib/copilot-types";

const prompts = [
  "Why did my cloud bill increase?",
  "What should I fix first?",
  "Create an action plan for DataTeam.",
  "Which resources are safe to shut down?",
  "Generate Jira tickets for high-priority savings.",
];

export function CopilotWorkspace() {
  const { activeDataset, ready } = useActiveDataset();
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!ready) return <DatasetPageLoading />;
  if (!activeDataset) {
    return (
      <DatasetEmptyState
        title="Copilot needs an active dataset"
        description="Load sample data or a custom upload first so every answer can be grounded in real costs, teams, findings, and resources."
      />
    );
  }

  async function ask(event?: FormEvent) {
    event?.preventDefault();
    const value = question.trim();
    if (!value || loading || !activeDataset) return;
    setLoading(true);
    setError("");
    setSubmittedQuestion(value);
    setAnswer("");
    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: value,
          dataset: buildCopilotDataset(activeDataset),
        }),
      });
      const payload = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Copilot request failed.");
      setAnswer(payload.answer ?? "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Copilot request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={`Groq-powered reasoning | ${activeDataset.label}`}
        title="Ask your cloud cost data"
        description="Turn active dataset findings into concise explanations, owner-specific action plans, and ticket-ready work without exposing the API key or claiming changes were executed."
      />
      <div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
      <aside className="rounded-2xl border border-white/[0.075] bg-[#0d1219] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Sample questions</p>
            <p className="mt-0.5 text-xs text-slate-500">Grounded in {activeDataset.label}</p>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setQuestion(prompt)}
              className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-left text-xs leading-5 text-slate-300 transition hover:border-emerald-400/20 hover:bg-emerald-400/[0.03]"
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-3 text-[11px] leading-5 text-amber-100/65">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-300" />
          Copilot can explain and draft actions. It cannot access AWS, create real tickets, or execute changes.
        </div>
      </aside>

      <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-white/[0.075] bg-[#0d1219]">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Bot className="size-4 text-emerald-400" /> FinOps Copilot
          </div>
          <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
            Groq | server-side
          </span>
        </div>

        <div aria-live="polite" className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          {!submittedQuestion && !loading && (
            <div className="grid h-full min-h-80 place-items-center text-center">
              <div className="max-w-md">
                <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-white/[0.035] text-slate-400">
                  <Bot className="size-5" />
                </span>
                <p className="text-sm font-medium text-slate-200">
                  Ask about cost changes, priorities, teams, safe shutdowns, or tickets.
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  The browser sends the active dataset summary to the API. Your Groq key stays on the server.
                </p>
              </div>
            </div>
          )}
          {submittedQuestion && (
            <div className="flex justify-end gap-3">
              <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-white/[0.06] px-4 py-3 text-sm leading-6 text-slate-200">
                {submittedQuestion}
              </div>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-700 text-slate-200">
                <User className="size-4" />
              </span>
            </div>
          )}
          {loading && (
            <div className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">
                <Bot className="size-4" />
              </span>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-white/[0.06] bg-[#0a0f15] px-4 py-3 text-xs text-slate-500">
                <LoaderCircle className="size-4 animate-spin text-emerald-400" /> Analyzing active dataset...
              </div>
            </div>
          )}
          {answer && (
            <div className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">
                <Bot className="size-4" />
              </span>
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-white/[0.06] bg-[#0a0f15] px-4 py-4">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  <CheckCircle2 className="size-3.5" /> Answer grounded in {activeDataset.label}
                </div>
                <MarkdownContent content={answer} />
              </div>
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-xs leading-5 text-rose-200"
            >
              {error}
            </div>
          )}
        </div>

        <form onSubmit={ask} className="border-t border-white/[0.07] p-4">
          <div className="relative">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a FinOps question..."
              rows={3}
              maxLength={1200}
              className="w-full resize-none rounded-2xl border border-white/[0.1] bg-[#090d13] px-4 py-3 pr-14 text-sm leading-6 text-slate-200 placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              aria-label="Ask Copilot"
              className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-xl bg-emerald-400 text-[#06110c] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : <CornerDownLeft className="size-4" />}
            </button>
          </div>
        </form>
      </section>
      </div>
    </>
  );
}
