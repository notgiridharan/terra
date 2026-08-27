"use client";

import type { LandDocument } from "@/lib/documents";
import {
  STAGE_FILTERS,
  stageLabel,
  type PreprocessStageId,
} from "@/lib/preprocessing";

export function StagePreview({
  title,
  caption,
  document: doc,
  previewUrl,
  stage,
}: {
  title: string;
  caption: string;
  document: LandDocument;
  previewUrl?: string;
  stage: PreprocessStageId;
}) {
  const isPdf =
    doc.mimeType === "application/pdf" ||
    doc.name.toLowerCase().endsWith(".pdf");
  // Show image if: we have a URL AND (mimeType is image OR URL looks like a real image endpoint)
  const isImage =
    Boolean(previewUrl) &&
    !isPdf &&
    (doc.mimeType.startsWith("image/") ||
      previewUrl?.includes("/uploads/") ||
      previewUrl?.startsWith("blob:"));
  // Never fake-distort the real original scan, and skip the CSS filter
  // whenever the backend's real OpenCV pipeline produced this stage's image.
  const isRealPreprocessed =
    stage === "original" ||
    (doc.preprocessing.engine === "opencv" && Boolean(doc.preprocessing.stageUrls?.[stage])) ||
    (previewUrl === doc.preprocessedUrl && Boolean(doc.preprocessedUrl));
  const filter = isRealPreprocessed ? "none" : STAGE_FILTERS[stage];

  return (
    <section className="flex min-h-[360px] min-w-0 flex-1 flex-col border border-tl-border bg-tl-panel">
      <div className="flex items-center justify-between border-b border-tl-border px-4 py-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
            {title}
          </p>
          <h3 className="mt-1 text-[14px] font-semibold text-tl-text">
            {stageLabel(stage)}
          </h3>
        </div>
        <span className="text-[11px] text-tl-muted">{caption}</span>
      </div>
      <div className="relative flex min-h-[320px] flex-1 items-center justify-center overflow-hidden bg-tl-bg p-4">
        {isImage && previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={`${title} ${doc.name}`}
            style={{ filter }}
            className="max-h-[420px] w-full origin-center object-contain"
          />
        ) : isPdf && previewUrl && stage === "original" ? (
          <iframe
            title={`Original ${doc.name}`}
            src={previewUrl}
            className="h-[320px] w-full bg-white"
          />
        ) : (
          <Facsimile name={doc.name} stage={stage} />
        )}
      </div>
    </section>
  );
}

function Facsimile({
  name,
  stage,
}: {
  name: string;
  stage: PreprocessStageId;
}) {
  const rotate =
    stage === "original" ? "-rotate-[3deg]" : "rotate-0";
  const line = stage === "restoration" ? "bg-tl-text/70" : "bg-tl-border";
  const density = stage === "original" || stage === "deskew";

  return (
    <div
      className={`w-full max-w-sm border border-tl-border bg-[#101826] px-5 py-6 ${rotate}`}
      style={{ filter: STAGE_FILTERS[stage] }}
    >
      <p className="text-[10px] uppercase tracking-[0.16em] text-tl-gold/80">
        Mock OpenCV frame
      </p>
      <p className="mt-2 truncate text-[12px] text-tl-text">{name}</p>
      <div className="mt-4 space-y-2">
        <div className={`h-px ${line}`} />
        <div className={`h-px w-5/6 ${line}`} />
        <div className={`h-px w-2/3 ${line}`} />
        <div className={`h-px w-4/5 ${line}`} />
        {density ? (
          <div className="mt-3 grid grid-cols-6 gap-1">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="h-1.5 bg-tl-muted/25"
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 h-16 border border-dashed border-tl-gold/30 bg-tl-gold/5" />
        )}
      </div>
    </div>
  );
}
