import type { Metadata } from "next";
import { ReportContent } from "@/components/report-content";

export const metadata: Metadata = { title: "Executive report" };

export default function ReportPage() {
  return <ReportContent />;
}
