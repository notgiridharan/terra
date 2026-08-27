import type { ValidationOutcome } from "@/lib/validation";

const STYLES: Record<ValidationOutcome, string> = {
  Passed: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
  Warning: "border-tl-gold/40 bg-tl-gold/10 text-tl-gold",
  Conflict: "border-red-500/40 bg-red-500/10 text-red-300",
};

export function OutcomeBadge({ outcome }: { outcome: ValidationOutcome }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium tracking-wide ${STYLES[outcome]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {outcome}
    </span>
  );
}
