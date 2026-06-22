import { NextResponse } from "next/server";
import { generateExecutiveReport } from "@/lib/agents/report-generator";
import { callGroq, compactAnalysis, FINOPS_SYSTEM_PROMPT, hasGroqConfiguration } from "@/lib/groq";
import type { AnalysisResult } from "@/lib/types";

export const runtime = "nodejs";

function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AnalysisResult>;
  return (
    typeof candidate.totalMonthlySpend === "number" &&
    Array.isArray(candidate.findings) &&
    Array.isArray(candidate.serviceSpend) &&
    Array.isArray(candidate.teamExposure)
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      enhance?: boolean;
      analysis?: AnalysisResult;
      dataSource?: string;
    };
    if (!isAnalysisResult(body.analysis)) {
      return NextResponse.json(
        { error: "Load an active dataset before generating a report." },
        { status: 400 },
      );
    }

    const report = generateExecutiveReport(body.analysis, {
      dataSource: body.dataSource || "Active dataset",
    });
    if (!body.enhance || !hasGroqConfiguration()) {
      return NextResponse.json({ report, source: "deterministic" });
    }

    const markdown = await callGroq(
      `${FINOPS_SYSTEM_PROMPT}\nCreate an executive report with cost summary, top findings, savings, priority actions, ownership, risk notes, and ticket-ready action items. Preserve every numeric fact.`,
      `Active analysis data:\n${JSON.stringify(compactAnalysis(body.analysis))}`,
    );
    return NextResponse.json({
      report: {
        ...report,
        markdown,
        summary: "AI-refined executive report grounded in the active deterministic findings.",
      },
      source: "groq",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate the report.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
