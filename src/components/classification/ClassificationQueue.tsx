"use client";

import { useDocuments } from "@/lib/documents-store";
import { StatusBadge } from "@/components/documents/StatusBadge";
import type { LandDocument } from "@/lib/documents";

export function ClassificationQueue({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { documents, addFiles } = useDocuments();

  const ordered = [...documents].sort((a, b) => {
    const pendingA = a.classification.decision === "pending" ? 0 : 1;
    const pendingB = b.classification.decision === "pending" ? 0 : 1;
    if (pendingA !== pendingB) return pendingA - pendingB;
    return (
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  });

  return (
    <aside className="flex w-full flex-col border border-tl-border bg-tl-panel lg:w-[280px] lg:shrink-0">
      <div className="border-b border-tl-border px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Queue
        </p>
        <h2 className="mt-1 text-[14px] font-semibold text-tl-text">
          Documents
        </h2>
        <label className="mt-3 inline-flex cursor-pointer rounded-sm border border-tl-gold/40 bg-tl-gold/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-tl-gold hover:bg-tl-gold/15">
          Upload
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,image/gif,image/tiff,image/bmp,.pdf,.jpg,.jpeg,.png,.webp,.gif,.tif,.tiff,.bmp"
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      </div>
      <ul className="max-h-[280px] overflow-y-auto lg:max-h-none lg:flex-1">
        {ordered.map((doc) => (
          <QueueRow
            key={doc.id}
            doc={doc}
            active={doc.id === selectedId}
            onSelect={() => onSelect(doc.id)}
          />
        ))}
      </ul>
    </aside>
  );
}

function QueueRow({
  doc,
  active,
  onSelect,
}: {
  doc: LandDocument;
  active: boolean;
  onSelect: () => void;
}) {
  const decision = doc.classification.decision;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full flex-col gap-1.5 border-b border-tl-border px-4 py-3 text-left ${
          active ? "bg-tl-gold/10" : "hover:bg-white/[0.03]"
        }`}
      >
        <span className="truncate text-[13px] font-medium text-tl-text">
          {doc.name}
        </span>
        <span className="text-[11px] text-tl-muted">
          {doc.classification.predictedType}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={doc.status} />
          {decision === "accepted" ? (
            <span className="text-[10px] uppercase tracking-[0.12em] text-emerald-300">
              Accepted
            </span>
          ) : null}
          {decision === "manual_review" ? (
            <span className="text-[10px] uppercase tracking-[0.12em] text-tl-gold">
              Review
            </span>
          ) : null}
        </div>
      </button>
    </li>
  );
}
