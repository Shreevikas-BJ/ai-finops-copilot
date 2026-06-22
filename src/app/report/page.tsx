import type { Metadata } from "next";
import { ReportViewer } from "@/components/report-viewer";
import { PageHeader } from "@/components/ui";
import { generateExecutiveReport } from "@/lib/agents/report-generator";
import { getAnalysis } from "@/lib/analysis";

export const metadata: Metadata = { title: "Executive report" };

export default async function ReportPage() {
  const analysis = await getAnalysis();
  const report = generateExecutiveReport(analysis);
  return (
    <>
      <PageHeader
        eyebrow="Decision-ready output"
        title="Executive FinOps report"
        description="A shareable summary of costs, savings, priorities, ownership, risk controls, and Jira/GitHub-style action items."
      />
      <ReportViewer initialReport={report} />
    </>
  );
}
