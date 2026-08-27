import type { RuleSeverity } from "@/lib/api";

const STYLES: Record<RuleSeverity, string> = {
  LOW: "border-tl-border text-tl-muted",
  MEDIUM: "border-tl-gold/40 bg-tl-gold/10 text-tl-gold",
  HIGH: "border-red-500/40 bg-red-500/10 text-red-300",
};

export function SeverityBadge({ severity }: { severity: RuleSeverity }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ${STYLES[severity]}`}
    >
      {severity}
    </span>
  );
}
