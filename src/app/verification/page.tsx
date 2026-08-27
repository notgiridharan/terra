import type { Metadata } from "next";
import { VerificationWorkspace } from "@/components/verification/VerificationWorkspace";

export const metadata: Metadata = {
  title: "Verification",
};

export default function VerificationPage() {
  return <VerificationWorkspace />;
}
