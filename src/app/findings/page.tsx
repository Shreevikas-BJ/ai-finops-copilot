import type { Metadata } from "next";
import { FindingsExplorer } from "@/components/findings-explorer";
import { PageHeader } from "@/components/ui";
import { getAnalysis } from "@/lib/analysis";
import { currency } from "@/lib/format";

export const metadata: Metadata = { title: "Findings" };

export default async function FindingsPage() {
  const analysis = await getAnalysis();
  return (
    <>
      <PageHeader
        eyebrow="Deterministic analysis"
        title="Explainable savings findings"
        description={`Every item maps a cost signal to evidence, an accountable owner, operational risk, and a concrete action. ${currency.format(analysis.estimatedMonthlySavings)} in monthly savings is currently identified.`}
      />
      <FindingsExplorer findings={analysis.findings} />
    </>
  );
}
