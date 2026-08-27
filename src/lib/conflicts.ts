import type { LandDocument } from "@/lib/documents";
import { reconcileDocument, type ReconciliationView } from "@/lib/reconciliation";

export const CONFLICT_TYPES = [
  "Ownership mismatch",
  "Area mismatch",
  "Missing transaction",
  "Missing mutation",
  "Duplicate record",
  "Survey number mismatch",
  "Invalid subdivision",
  "GIS mismatch",
] as const;

export type ConflictType = (typeof CONFLICT_TYPES)[number];

export const CONFLICT_SEVERITIES = ["Critical", "High", "Medium", "Low"] as const;
export type ConflictSeverity = (typeof CONFLICT_SEVERITIES)[number];

export const CONFLICT_STATUSES = [
  "Open",
  "In review",
  "Assigned",
  "Resolved",
  "Escalated",
] as const;
export type ConflictStatus = (typeof CONFLICT_STATUSES)[number];

export type LandConflict = {
  id: string;
  documentId: string;
  recordName: string;
  type: ConflictType;
  severity: ConflictSeverity;
  historicalValue: string;
  governmentValue: string;
  reason: string;
  evidence: string[];
};

function conflict(
  partial: LandConflict,
): LandConflict {
  return partial;
}

function fromView(doc: LandDocument, view: ReconciliationView): LandConflict[] {
  const rows: LandConflict[] = [];
  const rec = `${view.village} · S.No. ${view.surveyNo}`;

  if (doc.id === "seed-deed" || (!view.saleInGovernment && view.overall === "MISSING RECORD")) {
    rows.push(
      conflict({
        id: `${doc.id}-missing-txn`,
        documentId: doc.id,
        recordName: `${doc.name} · ${rec}`,
        type: "Missing transaction",
        severity: "Critical",
        historicalValue: `1 acre sold to ${view.buyer} (2009)`,
        governmentValue: "No sale posted in LRMS",
        reason:
          "Historical deed conveys 1 acre from a 5 acre holding; the government database still shows the undivided 5 acres.",
        evidence: [
          "Sale deed DOC/2009 (historical scan)",
          "LRMS patta still 5.00 acres in seller’s name",
          "Reconciliation result: MISSING RECORD",
        ],
      }),
      conflict({
        id: `${doc.id}-missing-mut`,
        documentId: doc.id,
        recordName: `${doc.name} · ${rec}`,
        type: "Missing mutation",
        severity: "High",
        historicalValue: "Mutation expected after 1 acre sale (4 acres remainder)",
        governmentValue: "No mutation order on file",
        reason:
          "Conveyance is not followed by a mutation in the government register, so the residual holding was never reduced.",
        evidence: [
          "No MUT/2009 entry in mock LRMS",
          "A-Register 1984 still current",
          "Timeline: sale node not in government DB",
        ],
      }),
      conflict({
        id: `${doc.id}-area`,
        documentId: doc.id,
        recordName: `${doc.name} · ${rec}`,
        type: "Area mismatch",
        severity: "High",
        historicalValue: `${view.remainingAcres} acres remaining`,
        governmentValue: `${view.governmentAcres} acres on LRMS`,
        reason:
          "After the 1 acre sale the historical remainder is 4 acres; government extent is still 5 acres.",
        evidence: [
          "Deed recital: original 5 acres",
          "Consideration clause: 1 acre conveyed",
          `LRMS extent: ${view.governmentAcres} acres`,
        ],
      }),
    );
  }

  if (doc.id === "seed-ror-12") {
    rows.push(
      conflict({
        id: `${doc.id}-area`,
        documentId: doc.id,
        recordName: `${doc.name} · ${rec}`,
        type: "Area mismatch",
        severity: "High",
        historicalValue: "RoR 4 acres after sale",
        governmentValue: "LRMS / RoR 5 acres",
        reason: "Digitised government RoR was not updated after the conveyance.",
        evidence: [
          "Historical RoR extract (4 acres)",
          "Government RoR extract (5 acres)",
          "Reconciliation result: CONFLICT",
        ],
      }),
      conflict({
        id: `${doc.id}-mut`,
        documentId: doc.id,
        recordName: `${doc.name} · ${rec}`,
        type: "Missing mutation",
        severity: "High",
        historicalValue: "Sale reducing holding to 4 acres",
        governmentValue: "Mutation not posted",
        reason: "The mutation that should have followed the sale is absent from LRMS.",
        evidence: ["RoR chain note", "Empty mutation index for 2009"],
      }),
    );
  }

  if (doc.id === "seed-patta-142") {
    rows.push(
      conflict({
        id: `${doc.id}-dup`,
        documentId: doc.id,
        recordName: `${doc.name} · ${rec}`,
        type: "Duplicate record",
        severity: "Critical",
        historicalValue: "Single parent holding after 1 acre sale",
        governmentValue: "Live parent 5 ac patta + child 1 ac patta (6 ac booked)",
        reason:
          "Two current pattas cover the same survey. The parent was not cancelled when the 1 acre patta was issued.",
        evidence: [
          "Parent patta still active",
          "Child patta for 1 acre in buyer’s name",
          "Reconciliation result: DUPLICATE",
        ],
      }),
      conflict({
        id: `${doc.id}-subdiv`,
        documentId: doc.id,
        recordName: `${doc.name} · ${rec}`,
        type: "Invalid subdivision",
        severity: "Medium",
        historicalValue: `${view.surveyNo} remainder (no new subdivision number)`,
        governmentValue: `${view.surveyNo} used on both parent and sold portion`,
        reason:
          "Sold portion was not allotted a distinct subdivision number; both pattas cite the same survey.",
        evidence: [
          "Both holdings keyed to the same survey number",
          "FMB subdivision sketch not updated (mock)",
        ],
      }),
    );
  }

  if (doc.id === "seed-fmb-map") {
    rows.push(
      conflict({
        id: `${doc.id}-own`,
        documentId: doc.id,
        recordName: `${doc.name} · ${rec}`,
        type: "Ownership mismatch",
        severity: "Critical",
        historicalValue: `${view.seller} (4 acre remainder)`,
        governmentValue: "P. Selvam (4 acre remainder)",
        reason:
          "Residual pattadar on LRMS does not match the historical chain after the 1 acre sale.",
        evidence: [
          "Historical remainder owner: R. Venkatesan",
          "LRMS pattadar: P. Selvam",
          "Buyer K. Meenakshi 1 acre matches",
        ],
      }),
      conflict({
        id: `${doc.id}-gis`,
        documentId: doc.id,
        recordName: `${doc.name} · ${rec}`,
        type: "GIS mismatch",
        severity: "High",
        historicalValue: "FMB plot 5 acres with 1 acre excised (mock geometry)",
        governmentValue: "Cadastral polygon still undivided 5 acres",
        reason:
          "GIS parcel geometry was not split after the sale; map extent contradicts the deed chain.",
        evidence: [
          "Historical FMB scan (mock)",
          "LRMS/GIS polygon area 5.00 acres",
          "No split-parcel layer for 2009 sale",
        ],
      }),
    );
  }

  if (doc.id === "seed-areg") {
    rows.push(
      conflict({
        id: `${doc.id}-survey`,
        documentId: doc.id,
        recordName: `${doc.name} · ${rec}`,
        type: "Survey number mismatch",
        severity: "Medium",
        historicalValue: view.surveyNo,
        governmentValue: `${view.surveyNo.replace(/\/.*/, "")}/old`,
        reason:
          "A-Register still cites a legacy survey notation that does not match the current survey/subdivision.",
        evidence: [
          "Historical A-Register survey column",
          "Current LRMS survey key",
          "Reconciliation result: PARTIAL MATCH",
        ],
      }),
      conflict({
        id: `${doc.id}-area-partial`,
        documentId: doc.id,
        recordName: `${doc.name} · ${rec}`,
        type: "Area mismatch",
        severity: "Low",
        historicalValue: "4.00 acres remainder",
        governmentValue: "4.20 acres remainder",
        reason:
          "1 acre sale is in LRMS, but residual area differs by 0.20 acre (conversion / rounding).",
        evidence: [
          "Deed remainder 4.00 acres",
          "LRMS residual 4.20 acres",
        ],
      }),
    );
  }

  if (
    rows.length === 0 &&
    view.overall !== "MATCH" &&
    doc.origin === "upload"
  ) {
    rows.push(
      conflict({
        id: `${doc.id}-generic`,
        documentId: doc.id,
        recordName: `${doc.name} · ${rec}`,
        type:
          view.overall === "DUPLICATE"
            ? "Duplicate record"
            : view.overall === "MISSING RECORD"
              ? "Missing transaction"
              : "Area mismatch",
        severity: view.overall === "DUPLICATE" ? "Critical" : "High",
        historicalValue: `${view.remainingAcres} acres · ${view.historicalOwner}`,
        governmentValue: `${view.governmentAcres} acres · ${view.governmentOwner}`,
        reason: view.rationale,
        evidence: view.findings.map((item) => `${item.result}: ${item.detail}`),
      }),
    );
  }

  return rows;
}

export function listConflicts(documents: LandDocument[]): LandConflict[] {
  return documents.flatMap((doc) => fromView(doc, reconcileDocument(doc)));
}

export const ASSIGNABLE_OFFICERS = [
  "R. Venkatesh (RO-4821)",
  "S. Priya (RO-1104)",
  "M. Karthik (RO-2290)",
];
