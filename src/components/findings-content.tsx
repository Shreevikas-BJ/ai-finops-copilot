"use client";

import { useActiveDataset } from "@/components/active-dataset-provider";
import { DatasetEmptyState, DatasetPageLoading } from "@/components/dataset-empty-state";
import { FindingsExplorer } from "@/components/findings-explorer";
import { PageHeader } from "@/components/ui";
import { currency } from "@/lib/format";

export function FindingsContent() {
  const { activeDataset, ready } = useActiveDataset();
  if (!ready) return <DatasetPageLoading />;
  if (!activeDataset) {
    return (
      <DatasetEmptyState
        title="No findings to review"
        description="Load sample data or a custom upload before opening the deterministic findings workspace."
      />
    );
  }

  const { analysis } = activeDataset;
  return (
    <>
      <PageHeader
        eyebrow={`Deterministic analysis | ${activeDataset.name}`}
        title="Explainable savings findings"
        description={`Every item maps ${activeDataset.sourceLabel} evidence to an owner, risk note, and recommended action. ${currency.format(analysis.estimatedMonthlySavings)} in monthly savings is currently identified.`}
      />
      <FindingsExplorer findings={analysis.findings} />
    </>
  );
}
