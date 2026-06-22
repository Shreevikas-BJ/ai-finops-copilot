import type { Metadata } from "next";
import { CopilotWorkspace } from "@/components/copilot-workspace";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "AI Copilot" };

export default function CopilotPage() {
  return (
    <>
      <PageHeader
        eyebrow="Groq-powered reasoning"
        title="Ask your cloud cost data"
        description="Turn summarized findings into concise explanations, owner-specific action plans, and ticket-ready work—without exposing the API key or claiming changes were executed."
      />
      <CopilotWorkspace />
    </>
  );
}
