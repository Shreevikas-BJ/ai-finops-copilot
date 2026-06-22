import { PageHeader } from "@/components/ui";
import { UploadWorkbench } from "@/components/upload-workbench";

export default function UploadHomePage() {
  return (
    <>
      <PageHeader
        eyebrow="Start here"
        title="Choose your cloud cost data"
        description="Load the built-in sample or validate and analyze your own five-file dataset. The active dataset will power every workspace in the app."
      />
      <UploadWorkbench />
    </>
  );
}
