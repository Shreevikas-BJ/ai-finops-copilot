import type { Metadata } from "next";
import { CopilotWorkspace } from "@/components/copilot-workspace";

export const metadata: Metadata = { title: "AI Copilot" };

export default function CopilotPage() {
  return <CopilotWorkspace />;
}
