import { NextResponse } from "next/server";
import { getAnalysis } from "@/lib/analysis";
import { callGroq, compactAnalysis, FINOPS_SYSTEM_PROMPT } from "@/lib/groq";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: string };
    const question = body.question?.trim();
    if (!question) {
      return NextResponse.json({ error: "Enter a FinOps question." }, { status: 400 });
    }
    if (question.length > 1200) {
      return NextResponse.json(
        { error: "Keep the question under 1,200 characters." },
        { status: 400 },
      );
    }

    const analysis = await getAnalysis();
    const answer = await callGroq(
      FINOPS_SYSTEM_PROMPT,
      `Analysis data:\n${JSON.stringify(compactAnalysis(analysis))}\n\nUser question:\n${question}`,
    );
    return NextResponse.json({ answer, model: process.env.GROQ_MODEL || "configured default" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to contact Groq.";
    const status = message.includes("GROQ_API_KEY") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
