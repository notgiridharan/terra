import type { DocumentStatus } from "@/lib/documents";

const STATUS_STYLES: Record<DocumentStatus, string> = {
  Uploaded: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  Processing: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  Classified: "border-teal-500/35 bg-teal-500/10 text-teal-300",
  "Needs Verification": "border-tl-gold/40 bg-tl-gold/10 text-tl-gold",
  Validated: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
  "Conflict Detected": "border-red-500/40 bg-red-500/10 text-red-300",
  Approved: "border-emerald-400/45 bg-emerald-400/12 text-emerald-200",
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium tracking-wide ${STATUS_STYLES[status]}`}
    >
      {status === "Processing" ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {status}
    </span>
  );
}
