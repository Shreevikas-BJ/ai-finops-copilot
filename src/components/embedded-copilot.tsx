"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  CornerDownLeft,
  LoaderCircle,
  SearchCheck,
  ShieldCheck,
  User,
} from "lucide-react";
import { useActiveDataset } from "@/components/active-dataset-provider";
import { MarkdownContent } from "@/components/markdown-content";
import type { CopilotResponsePayload } from "@/lib/copilot-types";
import { buildDatasetChunks, retrieveRelevantContext } from "@/lib/retrieval";

const SAMPLE_QUESTIONS = [
  "What is the major difference in two months?",
  "Why did my cloud bill increase?",
  "What should I fix first?",
  "Show me the high severity findings.",
  "Create an action plan for DataTeam.",
  "Which resources are safe to shut down?",
  "Generate Jira tickets for high-priority savings.",
];

export function EmbeddedCopilot() {
  const { activeDataset } = useActiveDataset();
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<CopilotResponsePayload["sources"]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const chunks = useMemo(
    () => (activeDataset ? buildDatasetChunks(activeDataset) : []),
    [activeDataset],
  );

  if (!activeDataset) return null;

  async function ask(event?: FormEvent) {
    event?.preventDefault();
    const value = question.trim();
    if (!value || loading || !activeDataset) return;
    const retrievedContext = retrieveRelevantContext(value, chunks, 12);
    setLoading(true);
    setError("");
    setAnswer("");
    setSources([]);
    setSubmittedQuestion(value);
    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: value,
          datasetSummary: activeDataset.summary,
          retrievedContext,
          activeDatasetName: activeDataset.name,
        }),
      });
      const payload = (await response.json()) as Partial<CopilotResponsePayload> & {
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Copilot request failed.");
      setAnswer(payload.answer || "I could not find that in the active dataset.");
      setSources(payload.sources ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Copilot request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="copilot"
      className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-emerald-400/15 bg-[#0d1219] shadow-[0_24px_80px_rgba(0,0,0,0.24)] xl:h-[calc(100vh-6.5rem)] xl:min-h-[680px]"
    >
      <header className="border-b border-white/[0.07] bg-emerald-400/[0.025] px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300">
              <Bot className="size-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white">FinOps Copilot</h2>
              <p className="mt-1 truncate text-[10px] text-emerald-200/65">
                Answering from active dataset: {activeDataset.name}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-white/[0.08] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            RAG | Groq
          </span>
        </div>
      </header>

      <details className="group border-b border-white/[0.07] px-4 py-3 sm:px-5">
        <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-slate-300 [&::-webkit-details-marker]:hidden">
          Sample questions
          <ChevronDown className="size-3.5 text-slate-600 transition group-open:rotate-180" />
        </summary>
        <div className="mt-3 grid gap-2">
          {SAMPLE_QUESTIONS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setQuestion(prompt)}
              className="rounded-lg border border-white/[0.06] bg-white/[0.018] px-3 py-2 text-left text-[11px] leading-4 text-slate-400 hover:border-emerald-400/15 hover:text-slate-200"
            >
              {prompt}
            </button>
          ))}
        </div>
      </details>

      <div aria-live="polite" className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {!submittedQuestion && !loading && (
          <div className="grid min-h-72 place-items-center text-center">
            <div className="max-w-sm">
              <SearchCheck className="mx-auto size-7 text-emerald-400/70" />
              <p className="mt-4 text-sm font-medium text-slate-200">
                Ask about this dashboard while you review it.
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Lexical retrieval selects only the most relevant rows, findings, and summaries before Groq receives the question.
              </p>
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/12 bg-amber-400/[0.035] p-3 text-left text-[10px] leading-4 text-amber-100/60">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-amber-300" />
                Copilot cannot access AWS, create real tickets, or execute changes.
              </div>
            </div>
          </div>
        )}

        {submittedQuestion && (
          <div className="flex justify-end gap-2">
            <div className="max-w-[88%] rounded-2xl rounded-tr-md bg-white/[0.06] px-3.5 py-2.5 text-xs leading-5 text-slate-200">
              {submittedQuestion}
            </div>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-700 text-slate-200">
              <User className="size-3.5" />
            </span>
          </div>
        )}

        {loading && (
          <div className="flex items-start gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">
              <Bot className="size-3.5" />
            </span>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-white/[0.06] bg-[#090d13] px-3.5 py-2.5 text-[11px] text-slate-500">
              <LoaderCircle className="size-3.5 animate-spin text-emerald-400" /> Retrieving relevant dataset context
            </div>
          </div>
        )}

        {answer && (
          <div className="flex items-start gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">
              <Bot className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-white/[0.06] bg-[#090d13] px-3.5 py-3.5">
              <div className="mb-3 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
                <CheckCircle2 className="size-3" /> Dataset-grounded answer
              </div>
              <MarkdownContent content={answer} />
              <div className="mt-4 border-t border-white/[0.06] pt-3">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                  Sources used
                </p>
                {sources.length === 0 ? (
                  <p className="mt-2 text-[10px] text-slate-600">No matching dataset chunks.</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {sources.map((source) => (
                      <span
                        key={source.id}
                        title={source.id}
                        className="max-w-full truncate rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 font-mono text-[9px] text-slate-500"
                      >
                        {source.resourceId || source.id}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-[11px] leading-5 text-rose-200"
          >
            {error}
          </div>
        )}
      </div>

      <form onSubmit={ask} className="border-t border-white/[0.07] p-3.5 sm:p-4">
        <div className="relative">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about the active dataset"
            rows={3}
            maxLength={600}
            className="w-full resize-none rounded-xl border border-white/[0.1] bg-[#080c12] px-3.5 py-3 pr-12 text-xs leading-5 text-slate-200 placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            aria-label="Ask Copilot"
            className="absolute bottom-3 right-3 grid size-8 place-items-center rounded-lg bg-emerald-400 text-[#06110c] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {loading ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <CornerDownLeft className="size-3.5" />
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
