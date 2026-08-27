"use client";

import type { ValidationSummary } from "@/lib/validation";
import { OutcomeBadge } from "@/components/validation/OutcomeBadge";

export function ValidationSummaryBar({ summary }: { summary: ValidationSummary }) {
  return (
    <section className="border border-tl-border bg-tl-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tl-border px-4 py-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
            Validation summary
          </p>
          <h3 className="mt-1 text-[15px] font-semibold text-tl-text">
            Business-rule result
          </h3>
        </div>
        <OutcomeBadge outcome={summary.overall} />
      </div>
      <div className="grid grid-cols-3 divide-x divide-tl-border">
        <Stat label="Passed" value={summary.passed} />
        <Stat label="Warning" value={summary.warning} />
        <Stat label="Conflict" value={summary.conflict} />
      </div>
      <p className="border-t border-tl-border px-4 py-2 text-[12px] text-tl-muted">
        Checks run against the current Structured Record (mock rules — not a live
        LRMS query). Officer edits on that page update these results.
      </p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
        {label}
      </p>
      <p className="mt-1 text-[22px] font-semibold tabular-nums text-tl-text">
        {value}
      </p>
    </div>
  );
}
