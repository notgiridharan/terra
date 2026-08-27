"use client";

import { useEffect, useMemo, useState } from "react";
import { useDocuments } from "@/lib/documents-store";
import { StatusBadge } from "@/components/documents/StatusBadge";
import { validateDocument } from "@/lib/validation";
import { OutcomeBadge } from "@/components/validation/OutcomeBadge";
import { ValidationSummaryBar } from "@/components/validation/ValidationSummaryBar";

export function ValidationWorkspace() {
  const { documents } = useDocuments();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected =
    documents.find((doc) => doc.id === selectedId) ?? documents[0] ?? null;

  useEffect(() => {
    setSelectedId((current) => {
      if (current && documents.some((doc) => doc.id === current)) return current;
      return documents[0]?.id ?? null;
    });
  }, [documents]);

  const summary = useMemo(
    () => (selected ? validateDocument(selected, documents) : null),
    [documents, selected],
  );

  if (!selected || !summary) {
    return (
      <div className="border border-tl-border bg-tl-panel px-5 py-10 text-sm text-tl-muted">
        No structured records to validate. Upload a document first.
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Pipeline · Business rules
        </p>
        <h2 className="mt-1 text-lg font-semibold text-tl-text">Validation</h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-5 text-tl-muted">
          Mock rule engine over the structured land record. Each check returns
          Passed, Warning, or Conflict.
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <aside className="w-full border border-tl-border bg-tl-panel lg:w-[260px] lg:shrink-0">
          <div className="border-b border-tl-border px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
              Queue
            </p>
            <h3 className="mt-1 text-[14px] font-semibold text-tl-text">
              Documents
            </h3>
          </div>
          <ul className="max-h-[240px] overflow-y-auto lg:max-h-[640px]">
            {documents.map((doc) => {
              const result = validateDocument(doc, documents);
              return (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(doc.id)}
                    className={`flex w-full flex-col gap-1.5 border-b border-tl-border px-4 py-3 text-left ${
                      doc.id === selected.id
                        ? "bg-tl-gold/10"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className="truncate text-[13px] font-medium text-tl-text">
                      {doc.name}
                    </span>
                    <StatusBadge status={doc.status} />
                    <OutcomeBadge outcome={result.overall} />
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="border border-tl-border bg-tl-panel px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
              Subject
            </p>
            <h3 className="mt-1 text-[15px] font-semibold text-tl-text">
              {selected.name}
            </h3>
            <p className="mt-1 text-[12px] text-tl-muted">
              {selected.classification.predictedType} · Structured record rules
            </p>
          </div>

          <ValidationSummaryBar summary={summary} />

          <section className="border border-tl-border bg-tl-panel">
            <div className="border-b border-tl-border px-4 py-3">
              <h3 className="text-[14px] font-semibold text-tl-text">
                Rule checks
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead className="border-b border-tl-border bg-tl-bg/80 text-[10px] uppercase tracking-[0.14em] text-tl-muted">
                  <tr>
                    <th className="px-4 py-2 font-medium">Check</th>
                    <th className="px-4 py-2 font-medium">Result</th>
                    <th className="px-4 py-2 font-medium">Finding</th>
                    <th className="px-4 py-2 font-medium">Fields</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.checks.map((check) => (
                    <tr
                      key={check.id}
                      className="border-b border-tl-border/80 last:border-b-0"
                    >
                      <td className="px-4 py-3 font-medium text-tl-text">
                        {check.label}
                      </td>
                      <td className="px-4 py-3">
                        <OutcomeBadge outcome={check.outcome} />
                      </td>
                      <td className="px-4 py-3 text-tl-muted">
                        {check.finding}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-tl-muted">
                        {check.fields.join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
