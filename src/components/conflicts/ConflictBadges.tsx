import type { ConflictSeverity, ConflictStatus } from "@/lib/conflicts";

const SEVERITY: Record<ConflictSeverity, string> = {
  Critical: "border-red-500/40 bg-red-500/10 text-red-300",
  High: "border-tl-gold/40 bg-tl-gold/10 text-tl-gold",
  Medium: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  Low: "border-slate-500/40 bg-slate-500/10 text-slate-300",
};

const STATUS: Record<ConflictStatus, string> = {
  Open: "border-tl-border text-tl-muted",
  "In review": "border-sky-500/35 text-sky-300",
  Assigned: "border-tl-gold/40 text-tl-gold",
  Resolved: "border-emerald-500/35 text-emerald-300",
  Escalated: "border-red-500/40 text-red-300",
};

export function SeverityBadge({ severity }: { severity: ConflictSeverity }) {
  return (
    <span
      className={`inline-flex rounded-sm border px-2 py-0.5 text-[11px] font-medium ${SEVERITY[severity]}`}
    >
      {severity}
    </span>
  );
}

export function ConflictStatusBadge({ status }: { status: ConflictStatus }) {
  return (
    <span
      className={`inline-flex rounded-sm border px-2 py-0.5 text-[11px] font-medium ${STATUS[status]}`}
    >
      {status}
    </span>
  );
}
