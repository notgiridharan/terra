"use client";

import { useEffect, useRef, useState } from "react";
import { useDocuments } from "@/lib/documents-store";
import { StatusBadge } from "@/components/documents/StatusBadge";
import { PipelineStepper } from "@/components/preprocessing/PipelineStepper";
import { StagePreview } from "@/components/preprocessing/StagePreview";
import { StatusAndQuality } from "@/components/preprocessing/StatusAndQuality";
import type { PreprocessStageId } from "@/lib/preprocessing";

export function PreprocessingWorkspace() {
  const { documents, previewUrls, runPreprocessing } = useDocuments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewStage, setViewStage] = useState<PreprocessStageId>("original");

  const selected =
    documents.find((doc) => doc.id === selectedId) ?? documents[0] ?? null;
  const autoStarted = useRef(new Set<string>());

  useEffect(() => {
    setSelectedId((current) => {
      if (current && documents.some((doc) => doc.id === current)) return current;
      return documents[0]?.id ?? null;
    });
  }, [documents]);

  useEffect(() => {
    if (!selected) return;
    if (selected.preprocessing.status === "Complete") {
      setViewStage("restoration");
    } else if (selected.preprocessing.status === "Idle") {
      setViewStage("original");
    }
  }, [selected?.id]);

  useEffect(() => {
    if (!selected) return;
    if (
      selected.preprocessing.status === "Processing" ||
      selected.preprocessing.status === "Queued"
    ) {
      setViewStage(selected.preprocessing.activeStage);
    }
  }, [
    selected?.id,
    selected?.preprocessing.status,
    selected?.preprocessing.activeStage,
  ]);

  useEffect(() => {
    if (!selected) return;
    if (selected.preprocessing.status !== "Idle") return;
    if (autoStarted.current.has(selected.id)) return;
    autoStarted.current.add(selected.id);
    runPreprocessing(selected.id);
  }, [runPreprocessing, selected?.id, selected?.preprocessing.status]);

  if (!selected) {
    return (
      <div className="border border-tl-border bg-tl-panel px-5 py-10 text-sm text-tl-muted">
        No documents in the queue. Upload a file from Documents first.
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Pipeline · OpenCV
        </p>
        <h2 className="mt-1 text-lg font-semibold text-tl-text">
          Document preprocessing
        </h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-5 text-tl-muted">
          Real OpenCV deskew, denoising, CLAHE enhancement, and unsharp-mask
          text restoration, with objective before/after quality metrics. PDFs
          fall back to a simulated preview since the pipeline decodes raster
          images only.
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
          <ul className="max-h-[240px] overflow-y-auto lg:max-h-[520px]">
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
                  <span className="text-[11px] text-tl-muted">
                    {doc.preprocessing.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <PipelineStepper
            state={selected.preprocessing}
            viewStage={viewStage}
            onSelect={setViewStage}
          />
          <div className="flex flex-col gap-4 xl:flex-row">
            <StagePreview
              title="Before"
              caption="Original scan"
              document={selected}
              previewUrl={selected.imageUrl || previewUrls[selected.id]}
              stage="original"
            />
            <StagePreview
              title="After"
              caption={
                selected.preprocessing.engine === "mock"
                  ? "Simulated (PDF — OpenCV pipeline needs a raster image)"
                  : "Enhanced by OpenCV"
              }
              document={selected}
              previewUrl={
                selected.preprocessing.stageUrls?.[viewStage] ||
                selected.preprocessedUrl ||
                selected.imageUrl ||
                previewUrls[selected.id]
              }
              stage={viewStage}
            />
          </div>
          <StatusAndQuality
            state={selected.preprocessing}
            onRun={() => runPreprocessing(selected.id)}
          />
        </div>
      </div>
    </div>
  );
}
