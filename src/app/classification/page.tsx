import type { Metadata } from "next";
import { ClassificationWorkspace } from "@/components/classification/ClassificationWorkspace";

export const metadata: Metadata = {
  title: "Classification",
};

export default function ClassificationPage() {
  return <ClassificationWorkspace />;
}
