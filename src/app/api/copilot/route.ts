import { NextResponse } from "next/server";
import {
  isDatasetSummary,
  isRetrievedDatasetChunk,
  type CopilotRequestPayload,
} from "@/lib/copilot-types";
import { callGroq, FINOPS_SYSTEM_PROMPT } from "@/lib/groq";
import { buildCopilotPrompt } from "@/lib/retrieval";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CopilotRequestPayload>;
    const question = body.question?.trim();
    const activeDatasetName = body.activeDatasetName?.trim();
    if (!question) {
      return NextResponse.json({ error: "Enter a FinOps question." }, { status: 400 });
    }
    if (question.length > 600) {
      return NextResponse.json(
        { error: "Keep the question under 600 characters." },
        { status: 400 },
      );
    }
    if (!activeDatasetName || !isDatasetSummary(body.datasetSummary)) {
      return NextResponse.json(
        { error: "Load sample data or upload custom data before asking Copilot." },
        { status: 400 },
      );
    }
    if (
      !Array.isArray(body.retrievedContext) ||
      !body.retrievedContext.every(isRetrievedDatasetChunk)
    ) {
      return NextResponse.json(
        { error: "The retrieved dataset context is invalid. Try the question again." },
        { status: 400 },
      );
    }

    const retrievedContext = body.retrievedContext
      .slice(0, 12)
      .map((chunk) => ({ ...chunk, text: chunk.text.slice(0, 900) }));
    const sources = retrievedContext.map((chunk) => ({
      id: chunk.id,
      source: chunk.source,
      resourceId: chunk.resourceId,
    }));
    if (retrievedContext.length === 0) {
      return NextResponse.json({
        answer: "I could not find that in the active dataset.",
        sources,
      });
    }

    const answer = await callGroq(
      FINOPS_SYSTEM_PROMPT,
      buildCopilotPrompt({
        question,
        activeDatasetName,
        datasetSummary: body.datasetSummary,
        retrievedContext,
      }),
      { maxTokens: 650 },
    );
    return NextResponse.json({
      answer,
      sources,
      model: process.env.GROQ_MODEL || "configured default",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to contact Groq.";
    const status = message.includes("GROQ_API_KEY")
      ? 503
      : message.includes("token limit")
        ? 413
        : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
