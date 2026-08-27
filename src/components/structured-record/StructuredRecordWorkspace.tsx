"use client";

import { useEffect, useState } from "react";
import { useDocuments } from "@/lib/documents-store";
import { StatusBadge } from "@/components/documents/StatusBadge";
import { RecordSection } from "@/components/structured-record/RecordSection";
import {
  RECORD_SECTIONS,
  countOfficerEdits,
} from "@/lib/structured-record";

export function StructuredRecordWorkspace() {
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

  if (!selected) {
    return (
      <div className="border border-tl-border bg-tl-panel px-5 py-10 text-sm text-tl-muted">
        No documents in the queue. Upload a file from Documents first.
      </div>
    );
  }

  const officerEdits = countOfficerEdits(selected.structuredRecord);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Pipeline · NLP structuring
        </p>
        <h2 className="mt-1 text-lg font-semibold text-tl-text">
          Structured land record
        </h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-5 text-tl-muted">
          Mock extracted fields assembled into a clean record. Edit any value;
          officer changes are marked and the original AI value is retained.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-sm border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 uppercase tracking-[0.12em] text-teal-300">
          AI extracted
        </span>
        <span className="rounded-sm border border-tl-gold/40 bg-tl-gold/10 px-2 py-0.5 uppercase tracking-[0.12em] text-tl-gold">
          Officer modified
        </span>
        <span className="text-tl-muted">
          Click a value to edit. Blur or Enter saves.
        </span>
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
                  className={`flex w-full flex-col gap-1 border-b border-tl-border px-4 py-3 text-left ${
                    doc.id === selected.id
                      ? "bg-tl-gold/10"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  <span className="truncate text-[13px] font-medium text-tl-text">
                    {doc.name}
                  </span>
                  <span className="text-[11px] text-tl-muted">
                    {doc.classification.predictedType}
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
              Record
            </p>
            <h3 className="mt-1 text-[15px] font-semibold text-tl-text">
              {selected.name}
            </h3>
            <p className="mt-1 text-[12px] text-tl-muted">
              Type {selected.classification.predictedType} · Mock OCR ·{" "}
              {officerEdits} officer edit{officerEdits === 1 ? "" : "s"}
            </p>
          </div>

          {RECORD_SECTIONS.map((section) => (
            <RecordSection
              key={section.id}
              documentId={selected.id}
              sectionId={section.id}
              title={section.label}
              fields={selected.structuredRecord.sections[section.id]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
