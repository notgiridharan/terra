import type { Metadata } from "next";
import { PreprocessingWorkspace } from "@/components/preprocessing/PreprocessingWorkspace";

export const metadata: Metadata = {
  title: "Preprocessing",
};

export default function PreprocessingPage() {
  return <PreprocessingWorkspace />;
}
