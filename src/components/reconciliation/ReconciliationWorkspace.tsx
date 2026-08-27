"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDocuments } from "@/lib/documents-store";
import { StatusBadge } from "@/components/documents/StatusBadge";
import { reconcileDocument } from "@/lib/reconciliation";
import { ReconBadge } from "@/components/reconciliation/ReconBadge";
import { AreaSplit } from "@/components/reconciliation/AreaSplit";
import { OwnershipTimeline } from "@/components/reconciliation/OwnershipTimeline";

export function ReconciliationWorkspace() {
  const { documents } = useDocuments();
  const searchParams = useSearchParams();
  const docFromQuery = searchParams.get("doc");
  const [selectedId, setSelectedId] = useState<string | null>(docFromQuery);

  const selected =
    documents.find((doc) => doc.id === selectedId) ??
    documents.find((doc) => doc.id === docFromQuery) ??
    documents.find((doc) => doc.id === "seed-deed") ??
    documents[0] ??
    null;

  useEffect(() => {
    if (docFromQuery && documents.some((doc) => doc.id === docFromQuery)) {
      setSelectedId(docFromQuery);
      return;
    }
    setSelectedId((current) => {
      if (current && documents.some((doc) => doc.id === current)) return current;
      return (
        documents.find((doc) => doc.id === "seed-deed")?.id ??
        documents[0]?.id ??
        null
      );
    });
  }, [documents, docFromQuery]);

  const view = useMemo(
    () => (selected ? reconcileDocument(selected) : null),
    [selected],
  );

  if (!selected || !view) {
    return (
      <div className="border border-tl-border bg-tl-panel px-5 py-10 text-sm text-tl-muted">
        No documents to reconcile. Upload a historical record first.
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Pipeline · Reconciliation
        </p>
        <h2 className="mt-1 text-lg font-semibold text-tl-text">
          Historical document vs government records
        </h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-5 text-tl-muted">
          Mock LRMS compare. Example chain: original holding 5 acres, 1 acre
          sold, 4 acres remaining — then whether that 1 acre transaction exists
          in the government database.
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
          <ul className="max-h-[240px] overflow-y-auto lg:max-h-[720px]">
            {documents.map((doc) => {
              const result = reconcileDocument(doc);
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
                    <ReconBadge result={result.overall} />
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <section className="border border-tl-border bg-tl-panel px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
                  Overall result
                </p>
                <h3 className="mt-1 text-[15px] font-semibold text-tl-text">
                  {selected.name}
                </h3>
                <p className="mt-1 max-w-2xl text-[12px] leading-5 text-tl-muted">
                  {view.rationale}
                </p>
              </div>
              <ReconBadge result={view.overall} />
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <CompareCard
              title="New historical document"
              rows={[
                ["Survey", view.surveyNo],
                ["Village", view.village],
                ["Extracted owner", view.historicalOwner],
                ["Original holding", `${view.originalAcres} acres`],
                ["Sold", `${view.soldAcres} acre to ${view.buyer}`],
                ["Remaining", `${view.remainingAcres} acres (${view.seller})`],
              ]}
            />
            <CompareCard
              title="Existing government records"
              rows={[
                ["Pattadar on file", view.governmentOwner],
                ["LRMS extent", `${view.governmentAcres} acres`],
                [
                  "1 acre sale posted",
                  view.saleInGovernment ? "Yes" : "No — missing",
                ],
                ...view.governmentHoldings.map((holding) => [
                  holding.instrument,
                  `${holding.owner} · ${holding.acres} ac · ${holding.surveyNo}`,
                ]),
              ]}
            />
          </div>

          <AreaSplit view={view} />

          <section className="border border-tl-border bg-tl-panel">
            <div className="border-b border-tl-border px-4 py-3">
              <h3 className="text-[14px] font-semibold text-tl-text">
                Reconciliation findings
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead className="border-b border-tl-border bg-tl-bg/80 text-[10px] uppercase tracking-[0.14em] text-tl-muted">
                  <tr>
                    <th className="px-4 py-2 font-medium">Check</th>
                    <th className="px-4 py-2 font-medium">Result</th>
                    <th className="px-4 py-2 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {view.findings.map((finding) => (
                    <tr
                      key={finding.id}
                      className="border-b border-tl-border/80 last:border-b-0"
                    >
                      <td className="px-4 py-3 font-medium text-tl-text">
                        {finding.title}
                      </td>
                      <td className="px-4 py-3">
                        <ReconBadge result={finding.result} />
                      </td>
                      <td className="px-4 py-3 text-tl-muted">
                        {finding.detail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <OwnershipTimeline events={view.timeline} />
        </div>
      </div>
    </div>
  );
}

function CompareCard({
  title,
  rows,
}: {
  title: string;
  rows: string[][];
}) {
  return (
    <section className="border border-tl-border bg-tl-panel">
      <div className="border-b border-tl-border px-4 py-3">
        <h3 className="text-[14px] font-semibold text-tl-text">{title}</h3>
      </div>
      <dl>
        {rows.map(([label, value], index) => (
          <div
            key={`${label}-${index}`}
            className="flex justify-between gap-3 border-b border-tl-border/70 px-4 py-2.5 last:border-b-0"
          >
            <dt className="text-[12px] text-tl-muted">{label}</dt>
            <dd className="text-right text-[12px] text-tl-text">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
