"use client";

import { useRef, useState, type DragEvent } from "react";
import { ACCEPT_ATTR } from "@/lib/documents";
import { useDocuments } from "@/lib/documents-store";

export function UploadArea() {
  const { addFiles, error, clearError } = useDocuments();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  return (
    <section className="border border-tl-border bg-tl-panel">
      <div className="flex items-center justify-between border-b border-tl-border px-5 py-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
            Ingest
          </p>
          <h2 className="mt-1 text-[15px] font-semibold text-tl-text">
            Document upload
          </h2>
        </div>
        <span className="rounded-sm border border-tl-border px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-tl-muted">
          Mock pipeline
        </span>
      </div>

      <div className="p-5">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center border border-dashed px-6 py-10 text-center transition-colors ${
            dragging
              ? "border-tl-gold/70 bg-tl-gold/5"
              : "border-tl-border bg-tl-bg/60"
          }`}
        >
          <p className="text-sm font-medium text-tl-text">
            Drop PDF, image, or scanned files here
          </p>
          <p className="mt-2 max-w-md text-[12px] leading-5 text-tl-muted">
            Officers may upload born-digital PDFs, photographs, and scanner
            output. TIFF/BMP are treated as scanned documents. Maximum 40 MB per
            file. Processing is simulated — OCR is not connected.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-5 rounded-sm border border-tl-gold/40 bg-tl-gold/10 px-3 py-1.5 text-[12px] font-medium uppercase tracking-[0.12em] text-tl-gold hover:bg-tl-gold/15"
          >
            Select files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-3 border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300"
          >
            {error}{" "}
            <button
              type="button"
              onClick={clearError}
              className="ml-2 underline underline-offset-2"
            >
              Dismiss
            </button>
          </p>
        ) : null}
      </div>
    </section>
  );
}
