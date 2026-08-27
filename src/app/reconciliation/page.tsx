import { Suspense } from "react";
import type { Metadata } from "next";
import { ReconciliationWorkspace } from "@/components/reconciliation/ReconciliationWorkspace";

export const metadata: Metadata = {
  title: "Reconciliation",
};

export default function ReconciliationPage() {
  return (
    <Suspense
      fallback={
        <div className="text-sm text-tl-muted">Loading reconciliation…</div>
      }
    >
      <ReconciliationWorkspace />
    </Suspense>
  );
}
