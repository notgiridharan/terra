"use client";

import type { RecordSectionId, StructuredField } from "@/lib/structured-record";
import { FieldRow } from "@/components/structured-record/FieldRow";

export function RecordSection({
  documentId,
  sectionId,
  title,
  fields,
}: {
  documentId: string;
  sectionId: RecordSectionId;
  title: string;
  fields: StructuredField[];
}) {
  const officerCount = fields.filter((item) => item.origin === "officer").length;

  return (
    <section className="border border-tl-border bg-tl-panel">
      <div className="flex items-center justify-between border-b border-tl-border px-4 py-3">
        <h3 className="text-[14px] font-semibold text-tl-text">{title}</h3>
        <span className="text-[11px] text-tl-muted">
          {officerCount > 0
            ? `${officerCount} officer edit${officerCount === 1 ? "" : "s"}`
            : "AI extracted"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead className="border-b border-tl-border bg-tl-bg/80 text-[10px] uppercase tracking-[0.14em] text-tl-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Field</th>
              <th className="px-4 py-2 font-medium">Value</th>
              <th className="px-4 py-2 font-medium">Confidence</th>
              <th className="px-4 py-2 font-medium">Source page</th>
              <th className="px-4 py-2 font-medium">Origin</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((item) => (
              <FieldRow
                key={item.key}
                documentId={documentId}
                section={sectionId}
                field={item}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
