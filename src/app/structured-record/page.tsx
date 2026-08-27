import type { Metadata } from "next";
import { StructuredRecordWorkspace } from "@/components/structured-record/StructuredRecordWorkspace";

export const metadata: Metadata = {
  title: "Structured Record",
};

export default function StructuredRecordPage() {
  return <StructuredRecordWorkspace />;
}
