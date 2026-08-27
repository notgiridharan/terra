"use client";

import { useEffect, useRef, useState } from "react";
import { useDocuments } from "@/lib/documents-store";
import { ClassificationQueue } from "@/components/classification/ClassificationQueue";
import { DocumentPreview } from "@/components/classification/DocumentPreview";
import { ClassificationPanel } from "@/components/classification/ClassificationPanel";

export function ClassificationWorkspace() {
  const { documents, lastUploadedId, previewUrls } = useDocuments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const handledUpload = useRef<string | null>(null);

  useEffect(() => {
    if (lastUploadedId && lastUploadedId !== handledUpload.current) {
      handledUpload.current = lastUploadedId;
      setSelectedId(lastUploadedId);
    }
  }, [lastUploadedId]);

  useEffect(() => {
    setSelectedId((current) => {
      if (current && documents.some((doc) => doc.id === current)) {
        return current;
      }
      const pending = documents.find(
        (doc) => doc.classification.decision === "pending",
      );
      return pending?.id ?? documents[0]?.id ?? null;
    });
  }, [documents]);

  const selected =
    documents.find((doc) => doc.id === selectedId) ?? documents[0] ?? null;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Pipeline · Classification
        </p>
        <h2 className="mt-1 text-lg font-semibold text-tl-text">
          Document classification
        </h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-5 text-tl-muted">
          Review the source page and the mock AI type. Accept the prediction or
          send the record for manual review. OCR is not connected.
        </p>
      </div>

      {selected ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <ClassificationQueue
            selectedId={selected.id}
            onSelect={setSelectedId}
          />
          <DocumentPreview
            document={selected}
            previewUrl={previewUrls[selected.id]}
          />
          <ClassificationPanel document={selected} />
        </div>
      ) : (
        <div className="border border-tl-border bg-tl-panel px-5 py-10 text-sm text-tl-muted">
          No documents in the queue. Upload a file from Documents or this page.
        </div>
      )}
    </div>
  );
}
