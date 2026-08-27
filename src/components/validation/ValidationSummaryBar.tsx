"use client";

import { VERDICT_META, type ValidationSummary } from "@/lib/validation";

export function ValidationSummaryBar({ summary }: { summary: ValidationSummary }) {
  const meta = VERDICT_META[summary.verdict];

  return (
    <section className="border border-tl-border bg-tl-panel">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 border-b border-tl-border px-4 py-4 ${meta.badgeClass}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none" aria-hidden>
            {meta.emoji}
          </span>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-80">
              Validation result
            </p>
            <h3 className="mt-0.5 text-[17px] font-semibold tracking-wide">
              {meta.label}
            </h3>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-80">
            Confidence
          </p>
          <p className="mt-0.5 text-[22px] font-semibold tabular-nums">
            {summary.confidence}%
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 divide-x divide-y divide-tl-border sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Records checked" value={summary.recordsChecked} />
        <Metric label="Records matched" value={summary.recordsMatched} />
        <Metric label="Conflicts found" value={summary.conflict} />
        <Metric label="Warnings" value={summary.warning} />
        <Metric label="Historical chain" value={summary.historicalChain} />
        <Metric label="Land DNA" value={summary.landDna} />
      </dl>

      <p className="border-t border-tl-border px-4 py-2 text-[12px] text-tl-muted">
        Checks run against the live TerraLens validation engine, cross-referenced
        against the land_records database for chain-of-title and duplicate checks.
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="px-4 py-4">
      <dt className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
        {label}
      </dt>
      <dd className="mt-1 text-[16px] font-semibold tabular-nums text-tl-text">
        {value}
      </dd>
    </div>
  );
}
