import type { Metadata } from "next";
import { ValidationWorkspace } from "@/components/validation/ValidationWorkspace";

export const metadata: Metadata = {
  title: "Validation",
};

export default function ValidationPage() {
  return <ValidationWorkspace />;
}
