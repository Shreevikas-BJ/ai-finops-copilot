import { NextResponse } from "next/server";
import { isCopilotDatasetPayload, type CopilotDatasetPayload } from "@/lib/copilot-types";
import { callGroq, FINOPS_SYSTEM_PROMPT } from "@/lib/groq";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      question?: string;
      dataset?: CopilotDatasetPayload;
    };
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
    if (!isCopilotDatasetPayload(body.dataset)) {
      return NextResponse.json(
        { error: "Load sample data or upload custom data before asking Copilot." },
        { status: 400 },
      );
    }

    const answer = await callGroq(
      FINOPS_SYSTEM_PROMPT,
      `Active dataset context:\n${JSON.stringify(body.dataset)}\n\nUser question:\n${question}`,
    );
    return NextResponse.json({
      answer,
      model: process.env.GROQ_MODEL || "configured default",
      datasetSource: body.dataset.label,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to contact Groq.";
    const status = message.includes("GROQ_API_KEY") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
