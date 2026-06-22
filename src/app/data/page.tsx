import type { Metadata } from "next";
import { UploadWorkbench } from "@/components/upload-workbench";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Data workspace" };

export default function DataPage() {
  return (
    <>
      <PageHeader
        eyebrow="Input layer"
        title="Upload or use sample data"
        description="Run the same deterministic analyzers against the included dataset or your own files. Partial uploads override matching sample files for a safe MVP demo."
      />
      <UploadWorkbench />
    </>
  );
}
