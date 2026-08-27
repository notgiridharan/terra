"use client";

import {
  DOCUMENT_STATUSES,
  formatFileSize,
  formatUploadedAt,
} from "@/lib/documents";
import { useDocuments } from "@/lib/documents-store";
import { StatusBadge } from "@/components/documents/StatusBadge";

export function DocumentsTable() {
  const { documents, deleteDocument } = useDocuments();

  const counts = DOCUMENT_STATUSES.map((status) => ({
    status,
    count: documents.filter((doc) => doc.status === status).length,
  }));

  return (
    <section className="border border-tl-border bg-tl-panel">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-tl-border px-5 py-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
            Queue
          </p>
          <h2 className="mt-1 text-[15px] font-semibold text-tl-text">
            Uploaded documents
          </h2>
        </div>
        <p className="text-[12px] text-tl-muted">
          {documents.length} record{documents.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-tl-border px-5 py-3">
        {counts.map(({ status, count }) => (
          <span
            key={status}
            className="border border-tl-border px-2 py-1 text-[11px] text-tl-muted"
          >
            <span className="text-tl-text">{count}</span> {status}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead className="border-b border-tl-border bg-tl-bg/80 text-[10px] uppercase tracking-[0.14em] text-tl-muted">
            <tr>
              <th className="px-5 py-2.5 font-medium">Document</th>
              <th className="px-5 py-2.5 font-medium">Format</th>
              <th className="px-5 py-2.5 font-medium">Size</th>
              <th className="px-5 py-2.5 font-medium">Uploaded</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
              <th className="px-5 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-tl-muted"
                >
                  No documents in the queue. Upload a PDF, image, or scan to
                  begin.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-tl-border/80 last:border-b-0"
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-tl-text">{doc.name}</p>
                    <p className="mt-0.5 text-[11px] text-tl-muted">
                      {doc.origin === "seed" ? "Sample record" : "Officer upload"}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-tl-muted">{doc.format}</td>
                  <td className="px-5 py-3 tabular-nums text-tl-muted">
                    {formatFileSize(doc.sizeBytes)}
                  </td>
                  <td className="px-5 py-3 text-tl-muted">
                    {formatUploadedAt(doc.uploadedAt)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => deleteDocument(doc.id)}
                      className="border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-300 transition-colors hover:border-red-500 hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
