import { NextResponse } from "next/server";
import { getAnalysis } from "@/lib/analysis";
import { generateExecutiveReport } from "@/lib/agents/report-generator";
import { callGroq, compactAnalysis, FINOPS_SYSTEM_PROMPT, hasGroqConfiguration } from "@/lib/groq";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { enhance?: boolean };
    const analysis = await getAnalysis();
    const report = generateExecutiveReport(analysis);

    if (!body.enhance || !hasGroqConfiguration()) {
      return NextResponse.json({ report, source: "deterministic" });
    }

    const markdown = await callGroq(
      `${FINOPS_SYSTEM_PROMPT}\nCreate an executive report with cost summary, top findings, savings, priority actions, ownership, risk notes, and ticket-ready action items. Preserve exact numeric facts.`,
      `Analysis data:\n${JSON.stringify(compactAnalysis(analysis))}`,
    );
    return NextResponse.json({
      report: { ...report, markdown, summary: "AI-refined executive report grounded in deterministic findings." },
      source: "groq",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate the report.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
