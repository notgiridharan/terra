import type { Metadata } from "next";
import { PreprocessingWorkspace } from "@/components/preprocessing/PreprocessingWorkspace";

export const metadata: Metadata = {
  title: "Extraction",
};

export default function ExtractionPage() {
  return <PreprocessingWorkspace />;
}
