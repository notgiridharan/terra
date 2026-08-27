"use client";

import { useEffect, useState } from "react";
import { useDocuments } from "@/lib/documents-store";
import { StatusBadge } from "@/components/documents/StatusBadge";
import { validateDocument, type ValidationSummary } from "@/lib/validation";
import { fetchRecord } from "@/lib/api";
import { OutcomeBadge } from "@/components/validation/OutcomeBadge";
import { ValidationSummaryBar } from "@/components/validation/ValidationSummaryBar";
import { SeverityBadge } from "@/components/validation/SeverityBadge";

export function ValidationWorkspace() {
  const { documents } = useDocuments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected =
    documents.find((doc) => doc.id === selectedId) ?? documents[0] ?? null;

  useEffect(() => {
    setSelectedId((current) => {
      if (current && documents.some((doc) => doc.id === current)) return current;
      return documents[0]?.id ?? null;
    });
  }, [documents]);

  useEffect(() => {
    if (!selected) {
      setSummary(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const dbRecord = selected.dbId ? await fetchRecord(selected.dbId) : null;
        if (!active) return;
        const result = await validateDocument(selected, dbRecord);
        if (!active) return;
        setSummary(result);
      } catch (err) {
        if (!active) return;
        setError(
          `Validation engine unreachable: ${err instanceof Error ? err.message : String(err)}`,
        );
        setSummary(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [selected]);

  if (!selected) {
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
          Automatic Indian land-record validation engine — area/division
          arithmetic, survey-number format, ownership chain of title, date
          chronology, and duplicate-record checks against the live database.
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
            {documents.map((doc) => (
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
                </button>
              </li>
            ))}
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
              {selected.classification.predictedType} · Validation engine ·{" "}
              {selected.dbId ? `Record #${selected.dbId}` : "Not yet persisted"}
            </p>
          </div>

          {error ? (
            <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
              {error}
            </div>
          ) : null}

          {loading || !summary ? (
            <div className="border border-tl-border bg-tl-panel px-4 py-10 text-center text-[13px] text-tl-muted">
              {loading ? "Running validation engine…" : "No validation results yet."}
            </div>
          ) : (
            <>
              <ValidationSummaryBar summary={summary} />

              <section className="border border-tl-border bg-tl-panel">
                <div className="border-b border-tl-border px-4 py-3">
                  <h3 className="text-[14px] font-semibold text-tl-text">
                    Rule checks
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-[13px]">
                    <thead className="border-b border-tl-border bg-tl-bg/80 text-[10px] uppercase tracking-[0.14em] text-tl-muted">
                      <tr>
                        <th className="px-4 py-2 font-medium">Rule</th>
                        <th className="px-4 py-2 font-medium">Result</th>
                        <th className="px-4 py-2 font-medium">Severity</th>
                        <th className="px-4 py-2 font-medium">Finding</th>
                        <th className="px-4 py-2 font-medium">Fields</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.checks.map((check) => (
                        <tr
                          key={check.id}
                          className="border-b border-tl-border/80 last:border-b-0 align-top"
                        >
                          <td className="px-4 py-3 font-medium text-tl-text">
                            {check.label}
                            <p className="mt-0.5 text-[10px] font-normal uppercase tracking-[0.1em] text-tl-muted">
                              {check.id}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <OutcomeBadge outcome={check.outcome} />
                          </td>
                          <td className="px-4 py-3">
                            <SeverityBadge severity={check.severity} />
                          </td>
                          <td className="px-4 py-3 text-tl-muted">
                            <p>{check.finding}</p>
                            <p className="mt-1 text-[12px] text-tl-muted/70">
                              {check.evidence}
                            </p>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
