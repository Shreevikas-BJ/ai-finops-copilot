import type { Metadata } from "next";
import { UploadWorkbench } from "@/components/upload-workbench";
import { UploadRequirements } from "@/components/upload-requirements";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Data workspace" };

export default function DataPage() {
  return (
    <>
      <PageHeader
        eyebrow="Input layer"
        title="Upload or use sample data"
        description="Run the deterministic analyzers with the built-in sample or upload a validated five-file dataset using the documented schemas."
      />
      <UploadRequirements />
      <UploadWorkbench />
    </>
  );
}
