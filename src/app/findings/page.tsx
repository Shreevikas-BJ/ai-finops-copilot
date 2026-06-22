import type { Metadata } from "next";
import { FindingsContent } from "@/components/findings-content";

export const metadata: Metadata = { title: "Findings" };

export default function FindingsPage() {
  return <FindingsContent />;
}
