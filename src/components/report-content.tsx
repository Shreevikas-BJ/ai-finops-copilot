"use client";

import { useActiveDataset } from "@/components/active-dataset-provider";
import { DatasetEmptyState, DatasetPageLoading } from "@/components/dataset-empty-state";
import { ReportViewer } from "@/components/report-viewer";
import { PageHeader } from "@/components/ui";

export function ReportContent() {
  const { activeDataset, ready } = useActiveDataset();
  if (!ready) return <DatasetPageLoading />;
  if (!activeDataset) {
    return (
      <DatasetEmptyState
        title="No report data yet"
        description="Load an active dataset before generating the executive FinOps report."
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={`Decision-ready output | ${activeDataset.label}`}
        title="Executive FinOps report"
        description="A polished summary of cost, savings, ownership, risk, and ticket-ready actions from the active dataset."
      />
      <ReportViewer
        analysis={activeDataset.analysis}
        dataSource={activeDataset.label}
        generatedAt={new Date().toISOString()}
      />
    </>
  );
}
