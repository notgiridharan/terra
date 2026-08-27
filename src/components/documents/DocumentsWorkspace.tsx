"use client";

import { UploadArea } from "@/components/documents/UploadArea";
import { DocumentsTable } from "@/components/documents/DocumentsTable";

export function DocumentsWorkspace() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Ingest · Officer workspace
        </p>
        <h2 className="mt-1 text-lg font-semibold text-tl-text">Documents</h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-5 text-tl-muted">
          Receive historical land records into the processing queue. Uploads run
          through real OCR and are persisted to the TerraLens database — the
          queue survives a page refresh or server restart. Downstream
          classification/status transitions are simulated pending those modules.
        </p>
      </div>
      <UploadArea />
      <DocumentsTable />
    </div>
  );
}
