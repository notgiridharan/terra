import type { MasterStatus } from "@/lib/master-records";

const STYLES: Record<MasterStatus, string> = {
  Current: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
  "Under dispute": "border-red-500/40 bg-red-500/10 text-red-300",
  Provisional: "border-tl-gold/40 bg-tl-gold/10 text-tl-gold",
  Superseded: "border-slate-500/40 bg-slate-500/10 text-slate-300",
};

export function MasterStatusBadge({ status }: { status: MasterStatus }) {
  return (
    <span
      className={`inline-flex rounded-sm border px-2 py-0.5 text-[11px] font-medium ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
