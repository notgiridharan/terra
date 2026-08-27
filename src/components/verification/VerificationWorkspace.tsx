"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDocuments } from "@/lib/documents-store";
import { DocumentPreview } from "@/components/classification/DocumentPreview";
import { RECORD_SECTIONS } from "@/lib/structured-record";
import { FieldRow } from "@/components/structured-record/FieldRow";
import { reconcileDocument } from "@/lib/reconciliation";
import { ReconBadge } from "@/components/reconciliation/ReconBadge";
import { listConflicts } from "@/lib/conflicts";
import {
  getAction,
  useConflictActions,
} from "@/lib/conflicts-store";
import {
  ConflictStatusBadge,
  SeverityBadge,
} from "@/components/conflicts/ConflictBadges";
import { mockOcrText } from "@/lib/ocr-mock";
import {
  REMARKS_REQUIRED,
  recommendDecision,
  type OfficerAction,
} from "@/lib/verification";
import { StatusBadge } from "@/components/documents/StatusBadge";
import {
  seedPipelineActivity,
  useVerification,
} from "@/lib/verification-store";

export function VerificationWorkspace() {
  const { documents, previewUrls, setDocumentStatus } = useDocuments();
  const { actions, resolveForDocument } = useConflictActions();
  const { decisions, activity, recordAction, prependActivity } =
    useVerification();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const selected =
    documents.find((doc) => doc.id === selectedId) ??
    documents.find((doc) => doc.id === "seed-deed") ??
    documents[0] ??
    null;

  useEffect(() => {
    setSelectedId((current) => {
      if (current && documents.some((doc) => doc.id === current)) return current;
      return (
        documents.find((doc) => doc.id === "seed-deed")?.id ??
        documents[0]?.id ??
        null
      );
    });
  }, [documents]);

  useEffect(() => {
    if (!selected) return;
    prependActivity(
      selected.id,
      seedPipelineActivity(selected.id, selected.name),
    );
    setEditing(false);
    setRemarks("");
    setMessage(null);
  }, [prependActivity, selected?.id]);

  const view = useMemo(
    () => (selected ? reconcileDocument(selected) : null),
    [selected],
  );
  const conflicts = useMemo(
    () =>
      selected
        ? listConflicts(documents).filter(
            (item) => item.documentId === selected.id,
          )
        : [],
    [documents, selected],
  );
  const recommendation = view
    ? recommendDecision(view, conflicts)
    : null;
  const ocr = selected ? mockOcrText(selected) : "";
  const decision = selected ? decisions[selected.id] : undefined;
  const log = selected ? (activity[selected.id] ?? []) : [];

  if (!selected || !view || !recommendation) {
    return (
      <div className="border border-tl-border bg-tl-panel px-5 py-10 text-sm text-tl-muted">
        No cases in the verification queue.
      </div>
    );
  }

  const rec = recommendation;
  const docId = selected.id;

  function act(action: OfficerAction) {
    if (REMARKS_REQUIRED.includes(action) && !remarks.trim()) {
      setMessage(`Remarks are required for ${action}.`);
      return;
    }
    if (action === "Edit") {
      setEditing(true);
      recordAction(
        docId,
        action,
        remarks || "Opened structured fields for edit.",
      );
      setMessage(
        "Edit mode on. Change values in the structured record, then decide.",
      );
      return;
    }
    if (action === "Approve") {
      setDocumentStatus(docId, "Approved");
    } else if (action === "Reject") {
      setDocumentStatus(docId, "Needs Verification");
    } else if (action === "Resolve Conflict") {
      resolveForDocument(conflicts.map((item) => item.id));
      setDocumentStatus(docId, "Validated");
    } else if (action === "Request Document") {
      setDocumentStatus(docId, "Processing");
    } else if (action === "Escalate") {
      setDocumentStatus(docId, "Needs Verification");
    }

    recordAction(docId, action, remarks);
    const againstAi = action !== rec.action;
    setMessage(
      againstAi
        ? `Officer decision “${action}” recorded. This differs from the AI recommendation (“${rec.action}”). Officer decision is final.`
        : `Officer decision “${action}” recorded. AI recommendation was “${rec.action}”.`,
    );
  }

  const against =
    decision && decision.action !== recommendation.action
      ? decision.action !== "Edit"
      : false;

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Pipeline · Officer verification
        </p>
        <h2 className="mt-1 text-lg font-semibold text-tl-text">
          Case workspace
        </h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-5 text-tl-muted">
          AI recommends; the authorised officer records the final decision.
        </p>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <aside className="w-full border border-tl-border bg-tl-panel xl:w-[240px] xl:shrink-0">
          <div className="border-b border-tl-border px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
              Queue
            </p>
            <h3 className="mt-1 text-[14px] font-semibold text-tl-text">
              Cases
            </h3>
          </div>
          <ul className="max-h-[240px] overflow-y-auto xl:max-h-[760px]">
            {documents.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(doc.id)}
                  className={`flex w-full flex-col gap-1 border-b border-tl-border px-4 py-3 text-left ${
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
          <section className="border border-tl-border bg-tl-panel px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
                  AI recommendation · not auto-applied
                </p>
                <p className="mt-1 text-[15px] font-semibold text-tl-text">
                  {recommendation.action}
                  <span className="ml-2 text-[12px] font-normal text-tl-muted">
                    {recommendation.confidence.toFixed(1)}% confidence
                  </span>
                </p>
                <p className="mt-1 max-w-3xl text-[12px] leading-5 text-tl-muted">
                  {recommendation.rationale}
                </p>
                {decision ? (
                  <p
                    className={`mt-2 text-[12px] ${
                      against ? "text-tl-gold" : "text-emerald-300"
                    }`}
                  >
                    Officer decision: {decision.action} at {decision.at}
                    {against ? " · overrides AI" : ""}
                  </p>
                ) : (
                  <p className="mt-2 text-[12px] text-tl-muted">
                    No officer decision yet.
                  </p>
                )}
              </div>
              <StatusBadge status={selected.status} />
            </div>
          </section>

          <section className="border border-tl-border bg-tl-panel px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
              Officer actions
            </p>
            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Officer remarks (required for Reject, Request Document, Escalate)"
              className="mt-2 w-full border border-tl-border bg-tl-bg px-3 py-2 text-[13px] text-tl-text outline-none focus:border-tl-gold/50"
              rows={2}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  "Approve",
                  "Edit",
                  "Reject",
                  "Resolve Conflict",
                  "Request Document",
                  "Escalate",
                ] as OfficerAction[]
              ).map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => act(action)}
                  className={`border px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] ${
                    recommendation.action === action
                      ? "border-tl-gold/50 bg-tl-gold/15 text-tl-gold"
                      : "border-tl-border text-tl-muted hover:text-tl-text"
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
            {message ? (
              <p className="mt-2 text-[12px] text-tl-gold">{message}</p>
            ) : null}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <DocumentPreview
              document={selected}
              previewUrl={previewUrls[selected.id]}
              compact
            />
            <section className="flex min-h-[220px] flex-col border border-tl-border bg-tl-panel">
              <div className="border-b border-tl-border px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
                  OCR text
                </p>
                <h3 className="mt-1 text-[14px] font-semibold text-tl-text">
                  Mock extract
                </h3>
              </div>
              <pre className="max-h-[280px] overflow-auto px-4 py-3 font-mono text-[11px] leading-5 text-tl-muted">
                {ocr}
              </pre>
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="border border-tl-border bg-tl-panel">
              <div className="flex items-center justify-between border-b border-tl-border px-4 py-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
                    Structured record
                  </p>
                  <h3 className="mt-1 text-[14px] font-semibold text-tl-text">
                    Extracted land record
                  </h3>
                </div>
                <Link
                  href="/structured-record"
                  className="text-[11px] text-tl-gold"
                >
                  Open full page
                </Link>
              </div>
              <div className={editing ? "" : "pointer-events-none opacity-90"}>
                {RECORD_SECTIONS.slice(0, 3).map((section) => (
                  <div key={section.id} className="border-b border-tl-border last:border-b-0">
                    <p className="px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-tl-muted">
                      {section.label}
                    </p>
                    <table className="w-full text-left">
                      <tbody>
                        {selected.structuredRecord.sections[section.id]
                          .slice(0, 4)
                          .map((field) => (
                            <FieldRow
                              key={field.key}
                              documentId={selected.id}
                              section={section.id}
                              field={field}
                            />
                          ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
              {!editing ? (
                <p className="px-4 py-2 text-[11px] text-tl-muted">
                  Click Edit to change fields. Transaction and History are on the
                  Structured Record page.
                </p>
              ) : null}
            </section>

            <section className="border border-tl-border bg-tl-panel">
              <div className="border-b border-tl-border px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
                  Existing government record
                </p>
                <h3 className="mt-1 text-[14px] font-semibold text-tl-text">
                  Mock LRMS holding
                </h3>
              </div>
              <dl>
                {[
                  ["Pattadar", view.governmentOwner],
                  ["LRMS extent", `${view.governmentAcres} acres`],
                  [
                    "1 acre sale posted",
                    view.saleInGovernment ? "Yes" : "No — missing",
                  ],
                  ...view.governmentHoldings.map((holding) => [
                    holding.instrument,
                    `${holding.owner} · ${holding.acres} ac`,
                  ]),
                ].map(([label, value], index) => (
                  <div
                    key={`${label}-${index}`}
                    className="flex justify-between gap-3 border-b border-tl-border/70 px-4 py-2.5 last:border-b-0"
                  >
                    <dt className="text-[12px] text-tl-muted">{label}</dt>
                    <dd className="text-right text-[12px] text-tl-text">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <section className="border border-tl-border bg-tl-panel">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-tl-border px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
                  Reconciliation result
                </p>
                <h3 className="mt-1 text-[14px] font-semibold text-tl-text">
                  5 acres → 1 acre sold → 4 acres remaining
                </h3>
              </div>
              <ReconBadge result={view.overall} />
            </div>
            <p className="px-4 py-3 text-[13px] leading-5 text-tl-muted">
              {view.rationale}
            </p>
            <ul className="space-y-2 border-t border-tl-border px-4 py-3">
              {view.findings.map((finding) => (
                <li
                  key={finding.id}
                  className="flex flex-wrap items-start justify-between gap-2 text-[13px]"
                >
                  <span className="text-tl-text">{finding.title}</span>
                  <ReconBadge result={finding.result} />
                  <span className="w-full text-[12px] text-tl-muted">
                    {finding.detail}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-tl-border px-4 py-2">
              <Link
                href={`/reconciliation?doc=${selected.id}`}
                className="text-[11px] text-tl-gold"
              >
                Open full reconciliation
              </Link>
            </div>
          </section>

          <section className="border border-tl-border bg-tl-panel">
            <div className="border-b border-tl-border px-4 py-3">
              <h3 className="text-[14px] font-semibold text-tl-text">
                Conflicts ({conflicts.length})
              </h3>
            </div>
            {conflicts.length === 0 ? (
              <p className="px-4 py-6 text-[13px] text-tl-muted">
                No open reconciliation conflicts for this case.
              </p>
            ) : (
              <ul>
                {conflicts.map((item) => (
                  <li
                    key={item.id}
                    className="border-b border-tl-border/80 px-4 py-3 last:border-b-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium text-tl-text">
                        {item.type}
                      </span>
                      <SeverityBadge severity={item.severity} />
                      <ConflictStatusBadge
                        status={getAction(actions, item.id).status}
                      />
                    </div>
                    <p className="mt-1 text-[12px] text-tl-muted">
                      Hist: {item.historicalValue} · Gov: {item.governmentValue}
                    </p>
                    <p className="mt-1 text-[12px] text-tl-muted">{item.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-tl-border bg-tl-panel">
            <div className="border-b border-tl-border px-4 py-3">
              <h3 className="text-[14px] font-semibold text-tl-text">
                Activity timeline
              </h3>
            </div>
            <ol className="relative px-4 py-4">
              <div
                className="absolute top-4 bottom-4 left-[21px] w-px bg-tl-border"
                aria-hidden
              />
              {log.map((entry) => (
                <li key={entry.id} className="relative mb-4 flex gap-3 last:mb-0">
                  <span
                    className={`relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      entry.actor === "Officer"
                        ? "bg-tl-gold"
                        : entry.actor === "AI"
                          ? "bg-sky-400"
                          : "bg-tl-muted"
                    }`}
                  />
                  <div>
                    <p className="text-[13px] font-medium text-tl-text">
                      {entry.title}
                    </p>
                    <p className="text-[11px] text-tl-muted">
                      {entry.actor} · {entry.at}
                    </p>
                    <p className="mt-0.5 text-[12px] text-tl-muted">
                      {entry.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
