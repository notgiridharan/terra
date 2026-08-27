"use client";

import { useEffect, useState } from "react";
import type { StructuredField, RecordSectionId } from "@/lib/structured-record";
import { useDocuments } from "@/lib/documents-store";

export function FieldRow({
  documentId,
  section,
  field,
}: {
  documentId: string;
  section: RecordSectionId;
  field: StructuredField;
}) {
  const { updateStructuredField } = useDocuments();
  const [draft, setDraft] = useState(field.value);

  useEffect(() => {
    setDraft(field.value);
  }, [field.value, field.key]);

  const modified = field.origin === "officer";

  function commit() {
    if (draft !== field.value) {
      updateStructuredField(documentId, section, field.key, draft);
    }
  }

  return (
    <tr className={modified ? "bg-tl-gold/[0.06]" : undefined}>
      <td className="px-4 py-2.5 align-top text-[13px] text-tl-muted">
        {field.label}
      </td>
      <td className="px-4 py-2 align-top">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          className="w-full border border-transparent bg-transparent px-1.5 py-1 text-[13px] text-tl-text outline-none hover:border-tl-border focus:border-tl-gold/50 focus:bg-tl-bg"
        />
        {modified ? (
          <p className="mt-1 px-1.5 text-[11px] text-tl-muted">
            AI value: {field.aiValue}
          </p>
        ) : null}
      </td>
      <td className="px-4 py-2.5 align-top tabular-nums text-[12px] text-tl-muted">
        {field.confidence.toFixed(1)}%
        <div className="mt-1 h-1 w-16 bg-tl-bg">
          <div
            className="h-full bg-tl-gold"
            style={{ width: `${Math.min(field.confidence, 100)}%` }}
          />
        </div>
      </td>
      <td className="px-4 py-2.5 align-top text-[12px] text-tl-muted">
        p. {field.sourcePage}
      </td>
      <td className="px-4 py-2.5 align-top">
        {modified ? (
          <span className="rounded-sm border border-tl-gold/40 bg-tl-gold/10 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-tl-gold">
            Officer
          </span>
        ) : (
          <span className="rounded-sm border border-teal-500/30 bg-teal-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-teal-300">
            AI
          </span>
        )}
      </td>
    </tr>
  );
}
