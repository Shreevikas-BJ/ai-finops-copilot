import { PageHeader } from "@/components/ui";
import { UploadWorkbench } from "@/components/upload-workbench";

export default function UploadHomePage() {
  return (
    <>
      <PageHeader
        eyebrow="Start here"
        title="Start with a dataset"
        description="Use the built-in sample, upload and name five custom files, or load one of your latest three datasets. Analysis opens in one dashboard with an embedded Copilot."
      />
      <UploadWorkbench />
    </>
  );
}
