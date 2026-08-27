import type { LandDocument } from "@/lib/documents";

export const RECON_RESULTS = [
  "MATCH",
  "PARTIAL MATCH",
  "CONFLICT",
  "MISSING RECORD",
  "DUPLICATE",
] as const;

export type ReconResultCode = (typeof RECON_RESULTS)[number];

export type TimelineEvent = {
  id: string;
  year: number;
  dateLabel: string;
  title: string;
  party: string;
  acres: number;
  inHistorical: boolean;
  inGovernment: boolean;
  note: string;
};

export type GovHolding = {
  surveyNo: string;
  village: string;
  owner: string;
  acres: number;
  instrument: string;
};

export type ReconFinding = {
  id: string;
  result: ReconResultCode;
  title: string;
  detail: string;
};

export type ReconciliationView = {
  overall: ReconResultCode;
  rationale: string;
  originalAcres: number;
  soldAcres: number;
  remainingAcres: number;
  seller: string;
  buyer: string;
  surveyNo: string;
  village: string;
  saleInGovernment: boolean;
  historicalOwner: string;
  governmentOwner: string;
  governmentAcres: number;
  governmentHoldings: GovHolding[];
  findings: ReconFinding[];
  timeline: TimelineEvent[];
};

type ScenarioId =
  | "sale-missing"
  | "sale-recorded"
  | "ror-stale"
  | "duplicate-patta"
  | "full-match"
  | "partial-area"
  | "owner-conflict";

function hashName(name: string): number {
  return Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function scenarioFor(doc: LandDocument): ScenarioId {
  const byId: Record<string, ScenarioId> = {
    "seed-deed": "sale-missing",
    "seed-mutation": "sale-recorded",
    "seed-ror-12": "ror-stale",
    "seed-patta-142": "duplicate-patta",
    "seed-chitta": "full-match",
    "seed-areg": "partial-area",
    "seed-fmb-map": "owner-conflict",
  };
  if (byId[doc.id]) return byId[doc.id];
  const options: ScenarioId[] = [
    "sale-missing",
    "sale-recorded",
    "ror-stale",
    "duplicate-patta",
    "full-match",
    "partial-area",
    "owner-conflict",
  ];
  return options[hashName(doc.name) % options.length];
}

function fieldValue(doc: LandDocument, section: string, key: string): string {
  const group =
    doc.structuredRecord.sections[
      section as keyof typeof doc.structuredRecord.sections
    ];
  return group?.find((item) => item.key === key)?.value ?? "";
}

export function reconcileDocument(doc: LandDocument): ReconciliationView {
  const village = fieldValue(doc, "location", "village") || "Sirkazhi";
  const surveyNo = fieldValue(doc, "property", "survey_no") || "142/3";
  const extractedOwner = fieldValue(doc, "owner", "owner_name") || "R. Venkatesan";
  const scenario = scenarioFor(doc);

  const originalAcres = 5;
  const soldAcres = 1;
  const remainingAcres = 4;
  const seller = "R. Venkatesan";
  const buyer = "K. Meenakshi";

  const baseTimeline: Omit<TimelineEvent, "inGovernment" | "inHistorical">[] = [
    {
      id: "settle",
      year: 1984,
      dateLabel: "1984",
      title: "Settlement / A-Register",
      party: seller,
      acres: originalAcres,
      note: "Original holding recorded as 5 acres.",
    },
    {
      id: "sale",
      year: 2009,
      dateLabel: "2009",
      title: "Sale of 1 acre",
      party: `${seller} → ${buyer}`,
      acres: soldAcres,
      note: "Historical deed: 1 acre conveyed; 4 acres should remain.",
    },
    {
      id: "remain",
      year: 2009,
      dateLabel: "2009",
      title: "Remainder holding",
      party: seller,
      acres: remainingAcres,
      note: "Expected residual after the 1 acre sale.",
    },
    {
      id: "now",
      year: 2026,
      dateLabel: "Present",
      title: "Current LRMS view",
      party: seller,
      acres: originalAcres,
      note: "What the government database currently holds.",
    },
  ];

  if (scenario === "sale-recorded") {
    return {
      overall: "MATCH",
      rationale:
        "Government LRMS contains both the 1 acre sale and the 4 acre remainder. Holdings sum to the original 5 acres.",
      originalAcres,
      soldAcres,
      remainingAcres,
      seller,
      buyer,
      surveyNo,
      village,
      saleInGovernment: true,
      historicalOwner: extractedOwner,
      governmentOwner: `${seller} (4 ac) · ${buyer} (1 ac)`,
      governmentAcres: remainingAcres,
      governmentHoldings: [
        {
          surveyNo: `${surveyNo}-A`,
          village,
          owner: seller,
          acres: remainingAcres,
          instrument: "Patta after mutation MUT/2009/118",
        },
        {
          surveyNo: `${surveyNo}-B`,
          village,
          owner: buyer,
          acres: soldAcres,
          instrument: "Sale deed DOC/2009/2144 + mutation",
        },
      ],
      findings: [
        {
          id: "sale",
          result: "MATCH",
          title: "1 acre transaction",
          detail: "The 2009 sale of 1 acre to K. Meenakshi is present in LRMS.",
        },
        {
          id: "remain",
          result: "MATCH",
          title: "Remaining 4 acres",
          detail: "R. Venkatesan is recorded with 4 acres after mutation.",
        },
        {
          id: "sum",
          result: "MATCH",
          title: "Area conservation",
          detail: "4 + 1 = 5 acres. Original settlement area is conserved.",
        },
      ],
      timeline: [
        { ...baseTimeline[0], inHistorical: true, inGovernment: true },
        { ...baseTimeline[1], inHistorical: true, inGovernment: true },
        { ...baseTimeline[2], inHistorical: true, inGovernment: true },
        {
          ...baseTimeline[3],
          party: `${seller} 4 ac · ${buyer} 1 ac`,
          acres: originalAcres,
          note: "LRMS split matches the historical chain.",
          inHistorical: true,
          inGovernment: true,
        },
      ],
    };
  }

  if (scenario === "sale-missing") {
    return {
      overall: "MISSING RECORD",
      rationale:
        "Historical deed shows 1 acre sold from a 5 acre holding. The government database still lists 5 acres with the original owner and does not contain the 1 acre transaction.",
      originalAcres,
      soldAcres,
      remainingAcres,
      seller,
      buyer,
      surveyNo,
      village,
      saleInGovernment: false,
      historicalOwner: extractedOwner,
      governmentOwner: seller,
      governmentAcres: originalAcres,
      governmentHoldings: [
        {
          surveyNo,
          village,
          owner: seller,
          acres: originalAcres,
          instrument: "A-Register 1984 (no later mutation)",
        },
      ],
      findings: [
        {
          id: "sale",
          result: "MISSING RECORD",
          title: "1 acre transaction",
          detail:
            "Sale of 1 acre to K. Meenakshi is on the historical deed but is not in the government database.",
        },
        {
          id: "remain",
          result: "CONFLICT",
          title: "Remaining area",
          detail:
            "Document implies 4 acres remaining. LRMS still shows 5 acres with the seller.",
        },
        {
          id: "owner",
          result: "PARTIAL MATCH",
          title: "Ownership",
          detail: `Seller ${seller} matches LRMS pattadar, but the buyer is absent.`,
        },
      ],
      timeline: [
        { ...baseTimeline[0], inHistorical: true, inGovernment: true },
        { ...baseTimeline[1], inHistorical: true, inGovernment: false },
        { ...baseTimeline[2], inHistorical: true, inGovernment: false },
        {
          ...baseTimeline[3],
          acres: originalAcres,
          party: seller,
          note: "LRMS still shows the undivided 5 acre holding.",
          inHistorical: false,
          inGovernment: true,
        },
      ],
    };
  }

  if (scenario === "ror-stale") {
    return {
      overall: "CONFLICT",
      rationale:
        "Historical RoR already reflects 4 acres after sale. Government RoR/LRMS still carries 5 acres and omits the conveyance.",
      originalAcres,
      soldAcres,
      remainingAcres,
      seller,
      buyer,
      surveyNo,
      village,
      saleInGovernment: false,
      historicalOwner: extractedOwner,
      governmentOwner: seller,
      governmentAcres: originalAcres,
      governmentHoldings: [
        {
          surveyNo,
          village,
          owner: seller,
          acres: originalAcres,
          instrument: "Digitised RoR extract",
        },
      ],
      findings: [
        {
          id: "area",
          result: "CONFLICT",
          title: "Extent mismatch",
          detail: "Historical RoR: 4 acres. Government record: 5 acres.",
        },
        {
          id: "sale",
          result: "MISSING RECORD",
          title: "1 acre transaction",
          detail: "The sale that reduced the holding is not posted in LRMS.",
        },
      ],
      timeline: [
        { ...baseTimeline[0], inHistorical: true, inGovernment: true },
        { ...baseTimeline[1], inHistorical: true, inGovernment: false },
        { ...baseTimeline[2], inHistorical: true, inGovernment: false },
        {
          ...baseTimeline[3],
          acres: originalAcres,
          note: "Government RoR not updated after sale.",
          inHistorical: false,
          inGovernment: true,
        },
      ],
    };
  }

  if (scenario === "duplicate-patta") {
    return {
      overall: "DUPLICATE",
      rationale:
        "Two live government pattas cover the same survey. One still shows 5 acres; another shows the 1 acre sold parcel without extinguishing the parent.",
      originalAcres,
      soldAcres,
      remainingAcres,
      seller,
      buyer,
      surveyNo,
      village,
      saleInGovernment: true,
      historicalOwner: extractedOwner,
      governmentOwner: `${seller} and ${buyer} (overlapping)`,
      governmentAcres: originalAcres + soldAcres,
      governmentHoldings: [
        {
          surveyNo,
          village,
          owner: seller,
          acres: originalAcres,
          instrument: "Patta (parent — not cancelled)",
        },
        {
          surveyNo,
          village,
          owner: buyer,
          acres: soldAcres,
          instrument: "Patta (sold portion — overlapping)",
        },
      ],
      findings: [
        {
          id: "dup",
          result: "DUPLICATE",
          title: "Overlapping pattas",
          detail:
            "Parent 5 acre patta remains live after a 1 acre patta was issued. Total booked area is 6 acres.",
        },
        {
          id: "sale",
          result: "PARTIAL MATCH",
          title: "1 acre transaction",
          detail: "The buyer’s 1 acre appears in LRMS, but the parent holding was not reduced.",
        },
      ],
      timeline: [
        { ...baseTimeline[0], inHistorical: true, inGovernment: true },
        { ...baseTimeline[1], inHistorical: true, inGovernment: true },
        { ...baseTimeline[2], inHistorical: true, inGovernment: false },
        {
          ...baseTimeline[3],
          party: "Overlapping pattas",
          acres: 6,
          note: "5 acre parent + 1 acre child both current.",
          inHistorical: false,
          inGovernment: true,
        },
      ],
    };
  }

  if (scenario === "partial-area") {
    return {
      overall: "PARTIAL MATCH",
      rationale:
        "Owner and village match. Government residual area is 4.2 acres against the historical remainder of 4.0 acres. The 1 acre sale is present.",
      originalAcres,
      soldAcres,
      remainingAcres,
      seller,
      buyer,
      surveyNo,
      village,
      saleInGovernment: true,
      historicalOwner: extractedOwner,
      governmentOwner: seller,
      governmentAcres: 4.2,
      governmentHoldings: [
        {
          surveyNo,
          village,
          owner: seller,
          acres: 4.2,
          instrument: "A-Register residual (rounding / conversion)",
        },
        {
          surveyNo: `${surveyNo}-B`,
          village,
          owner: buyer,
          acres: soldAcres,
          instrument: "Registered sale",
        },
      ],
      findings: [
        {
          id: "sale",
          result: "MATCH",
          title: "1 acre transaction",
          detail: "Government database contains the 1 acre sale.",
        },
        {
          id: "area",
          result: "PARTIAL MATCH",
          title: "Remaining extent",
          detail: "Historical remainder 4.00 acres vs LRMS 4.20 acres.",
        },
      ],
      timeline: [
        { ...baseTimeline[0], inHistorical: true, inGovernment: true },
        { ...baseTimeline[1], inHistorical: true, inGovernment: true },
        {
          ...baseTimeline[2],
          acres: 4.2,
          note: "LRMS remainder slightly higher than the deed.",
          inHistorical: true,
          inGovernment: true,
        },
        {
          ...baseTimeline[3],
          acres: 5.2,
          party: `${seller} 4.2 ac · ${buyer} 1 ac`,
          note: "Sum 5.2 acres vs original 5.0 acres.",
          inHistorical: false,
          inGovernment: true,
        },
      ],
    };
  }

  if (scenario === "owner-conflict") {
    return {
      overall: "CONFLICT",
      rationale:
        "Historical chain names R. Venkatesan as residual owner. LRMS names a different pattadar for the 4 acre remainder. The 1 acre sale is on file.",
      originalAcres,
      soldAcres,
      remainingAcres,
      seller,
      buyer,
      surveyNo,
      village,
      saleInGovernment: true,
      historicalOwner: extractedOwner,
      governmentOwner: "P. Selvam",
      governmentAcres: remainingAcres,
      governmentHoldings: [
        {
          surveyNo,
          village,
          owner: "P. Selvam",
          acres: remainingAcres,
          instrument: "Patta (unexplained change of pattadar)",
        },
        {
          surveyNo: `${surveyNo}-B`,
          village,
          owner: buyer,
          acres: soldAcres,
          instrument: "Sale mutation",
        },
      ],
      findings: [
        {
          id: "sale",
          result: "MATCH",
          title: "1 acre transaction",
          detail: "Buyer K. Meenakshi and 1 acre are in LRMS.",
        },
        {
          id: "owner",
          result: "CONFLICT",
          title: "Residual ownership",
          detail: `Historical remainder owner ${seller}; government pattadar P. Selvam.`,
        },
      ],
      timeline: [
        { ...baseTimeline[0], inHistorical: true, inGovernment: true },
        { ...baseTimeline[1], inHistorical: true, inGovernment: true },
        { ...baseTimeline[2], inHistorical: true, inGovernment: false },
        {
          ...baseTimeline[3],
          party: "P. Selvam (4 ac) · K. Meenakshi (1 ac)",
          acres: originalAcres,
          note: "Residual owner does not match the historical chain.",
          inHistorical: false,
          inGovernment: true,
        },
      ],
    };
  }

  return {
    overall: "MATCH",
    rationale:
      "Owner, village, 1 acre sale, and 4 acre remainder all agree between the historical document and LRMS.",
    originalAcres,
    soldAcres,
    remainingAcres,
    seller,
    buyer,
    surveyNo,
    village,
    saleInGovernment: true,
    historicalOwner: extractedOwner,
    governmentOwner: seller,
    governmentAcres: remainingAcres,
    governmentHoldings: [
      {
        surveyNo,
        village,
        owner: seller,
        acres: remainingAcres,
        instrument: "Current patta",
      },
      {
        surveyNo: `${surveyNo}-B`,
        village,
        owner: buyer,
        acres: soldAcres,
        instrument: "Sale deed on file",
      },
    ],
    findings: [
      {
        id: "sale",
        result: "MATCH",
        title: "1 acre transaction",
        detail: "Government database contains the 1 acre sale.",
      },
      {
        id: "remain",
        result: "MATCH",
        title: "Remaining 4 acres",
        detail: "Residual holding matches the historical remainder.",
      },
    ],
    timeline: [
      { ...baseTimeline[0], inHistorical: true, inGovernment: true },
      { ...baseTimeline[1], inHistorical: true, inGovernment: true },
      { ...baseTimeline[2], inHistorical: true, inGovernment: true },
      {
        ...baseTimeline[3],
        party: `${seller} 4 ac · ${buyer} 1 ac`,
        acres: originalAcres,
        note: "Current LRMS agrees with the historical chain.",
        inHistorical: true,
        inGovernment: true,
      },
    ],
  };
}
