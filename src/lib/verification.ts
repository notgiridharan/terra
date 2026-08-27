import type { LandConflict } from "@/lib/conflicts";
import type { ReconciliationView } from "@/lib/reconciliation";

export const OFFICER_ACTIONS = [
  "Approve",
  "Edit",
  "Reject",
  "Resolve Conflict",
  "Request Document",
  "Escalate",
] as const;

export type OfficerAction = (typeof OFFICER_ACTIONS)[number];

export type AiRecommendation = {
  action: OfficerAction;
  confidence: number;
  rationale: string;
  allowAutoApply: false;
};

export function recommendDecision(
  view: ReconciliationView,
  conflicts: LandConflict[],
): AiRecommendation {
  const openCount = conflicts.length;

  if (view.overall === "MATCH" && openCount === 0) {
    return {
      action: "Approve",
      confidence: 91.4,
      rationale:
        "Historical document and LRMS agree on owner, 1 acre sale, and 4 acre remainder. AI recommends Approve. Officer confirmation is still required.",
      allowAutoApply: false,
    };
  }

  if (view.overall === "MISSING RECORD" || !view.saleInGovernment) {
    return {
      action: "Resolve Conflict",
      confidence: 86.2,
      rationale:
        "The 1 acre sale appears on the historical deed but not in the government database. AI recommends resolving the missing transaction/mutation. Do not auto-approve.",
      allowAutoApply: false,
    };
  }

  if (view.overall === "DUPLICATE") {
    return {
      action: "Escalate",
      confidence: 88.0,
      rationale:
        "Overlapping live pattas book more area than the original 5 acres. AI recommends Escalate to a supervising officer.",
      allowAutoApply: false,
    };
  }

  if (view.overall === "CONFLICT") {
    return {
      action: "Reject",
      confidence: 74.5,
      rationale:
        "Owner or extent contradicts LRMS. AI recommends Reject pending corrected government posting, or Resolve Conflict if the deed is authoritative.",
      allowAutoApply: false,
    };
  }

  return {
    action: "Edit",
    confidence: 68.8,
    rationale:
      "Partial match. AI recommends officer edit of structured fields, then a second reconciliation pass. Final decision remains with the officer.",
    allowAutoApply: false,
  };
}

export const REMARKS_REQUIRED: OfficerAction[] = [
  "Reject",
  "Request Document",
  "Escalate",
];
