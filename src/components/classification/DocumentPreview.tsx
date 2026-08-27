"use client";

import type { LandDocument } from "@/lib/documents";

export function DocumentPreview({
  document: doc,
  previewUrl,
  compact = false,
}: {
  document: LandDocument;
  previewUrl?: string;
  compact?: boolean;
}) {
  const isPdf =
    doc.mimeType === "application/pdf" || doc.name.toLowerCase().endsWith(".pdf");
  const isImage =
    Boolean(previewUrl) && doc.mimeType.startsWith("image/") && !isPdf;
  const frame = compact ? "min-h-[220px]" : "min-h-[420px]";

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col border border-tl-border bg-tl-panel">
      <div className="flex items-center justify-between border-b border-tl-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
            Original document
          </p>
          <h2 className="mt-1 truncate text-[14px] font-semibold text-tl-text">
            {doc.name}
          </h2>
        </div>
        <span className="shrink-0 text-[11px] text-tl-muted">{doc.format}</span>
      </div>
      <div className={`relative min-h-0 flex-1 bg-tl-bg ${frame}`}>
        {previewUrl && isPdf ? (
          <iframe
            title={`Preview of ${doc.name}`}
            src={previewUrl}
            className={`h-full w-full bg-white ${frame}`}
          />
        ) : previewUrl && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={`Scan of ${doc.name}`}
            className={`h-full w-full object-contain object-top ${frame}`}
          />
        ) : (
          <FacsimilePlaceholder name={doc.name} format={doc.format} compact={compact} />
        )}
      </div>
    </section>
  );
}

function FacsimilePlaceholder({
  name,
  format,
  compact = false,
}: {
  name: string;
  format: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center p-6 ${
        compact ? "min-h-[220px]" : "min-h-[420px]"
      }`}
    >
      <div className="w-full max-w-sm border border-tl-border bg-[#101826] px-5 py-6 shadow-[inset_0_0_0_1px_rgba(196,163,90,0.08)]">
        <p className="text-[10px] uppercase tracking-[0.18em] text-tl-gold/80">
          Land record facsimile
        </p>
        <p className="mt-3 text-[13px] font-medium text-tl-text">{name}</p>
        <p className="mt-1 text-[11px] text-tl-muted">{format} · preview unavailable</p>
        <div className="mt-5 space-y-2">
          <div className="h-px bg-tl-border" />
          <div className="h-px w-5/6 bg-tl-border" />
          <div className="h-px w-2/3 bg-tl-border" />
          <div className="h-px w-4/5 bg-tl-border" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="h-10 border border-dashed border-tl-border" />
            <div className="h-10 border border-dashed border-tl-border" />
            <div className="h-10 border border-dashed border-tl-border" />
          </div>
        </div>
        <p className="mt-5 text-[11px] leading-4 text-tl-muted">
          Sample records and TIFF/BMP scans cannot be rendered here. Upload a
          PDF, JPG, or PNG to see the original page.
        </p>
      </div>
    </div>
  );
}
