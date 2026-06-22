import { PageHeader } from "@/components/ui";
import { UploadWorkbench } from "@/components/upload-workbench";

export default function UploadHomePage() {
  return (
    <>
      <PageHeader
        eyebrow="Start here"
        title="Start with a dataset"
        description="Choose Sample Data or Upload Custom Data. Valid analysis opens immediately in one dashboard with an embedded, dataset-aware Copilot."
      />
      <UploadWorkbench />
    </>
  );
}
