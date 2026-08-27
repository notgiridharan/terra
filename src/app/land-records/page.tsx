import type { Metadata } from "next";
import { LandRecordsWorkspace } from "@/components/land-records/LandRecordsWorkspace";

export const metadata: Metadata = {
  title: "Land Records",
};

export default function LandRecordsPage() {
  return <LandRecordsWorkspace />;
}
