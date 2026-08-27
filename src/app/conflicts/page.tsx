import type { Metadata } from "next";
import { ConflictsWorkspace } from "@/components/conflicts/ConflictsWorkspace";

export const metadata: Metadata = {
  title: "Conflicts",
};

export default function ConflictsPage() {
  return <ConflictsWorkspace />;
}
