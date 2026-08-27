import type { Metadata } from "next";
import { DocumentsWorkspace } from "@/components/documents/DocumentsWorkspace";

export const metadata: Metadata = {
  title: "Documents",
};

export default function DocumentsPage() {
  return <DocumentsWorkspace />;
}
