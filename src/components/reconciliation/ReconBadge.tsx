import type { ReconResultCode } from "@/lib/reconciliation";

const STYLES: Record<ReconResultCode, string> = {
  MATCH: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
  "PARTIAL MATCH": "border-sky-500/35 bg-sky-500/10 text-sky-300",
  CONFLICT: "border-red-500/40 bg-red-500/10 text-red-300",
  "MISSING RECORD": "border-tl-gold/40 bg-tl-gold/10 text-tl-gold",
  DUPLICATE: "border-violet-500/35 bg-violet-500/10 text-violet-300",
};

export function ReconBadge({ result }: { result: ReconResultCode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium tracking-wide ${STYLES[result]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {result}
    </span>
  );
}
