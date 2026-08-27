import type { LandDocument } from "@/lib/documents";
import type {
  RecordSectionId,
  StructuredLandRecord,
} from "@/lib/structured-record";

export const VALIDATION_OUTCOMES = ["Passed", "Warning", "Conflict"] as const;
export type ValidationOutcome = (typeof VALIDATION_OUTCOMES)[number];

export type ValidationCheck = {
  id: string;
  label: string;
  outcome: ValidationOutcome;
  finding: string;
  fields: string[];
};

export type ValidationSummary = {
  passed: number;
  warning: number;
  conflict: number;
  overall: ValidationOutcome;
  checks: ValidationCheck[];
};

function hashName(name: string): number {
  return Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function surveyFromName(name: string): string {
  const hash = hashName(name);
  return `${120 + (hash % 80)}/${1 + (hash % 12)}`;
}

const MOCK_LRMS_INDEX = [
  { survey: "142/1", village: "Sirkazhi" },
  { survey: "88/2", village: "Sirkazhi" },
  { survey: "12/1", village: "Nallur" },
  {
    survey: surveyFromName("RoR_Block12_Sirkazhi.pdf"),
    village: "Sirkazhi",
  },
];

function fieldValue(
  record: StructuredLandRecord,
  section: RecordSectionId,
  key: string,
): string {
  return (
    record.sections[section].find((item) => item.key === key)?.value.trim() ??
    ""
  );
}

function parseExtentHectare(raw: string): number | null {
  const match = raw.replace(",", "").match(/([\d.]+)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function parseDate(raw: string): Date | null {
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1) return null;
  return date;
}

function parseShare(raw: string): number | null {
  const match = raw.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) return null;
  const num = Number(match[1]);
  const den = Number(match[2]);
  if (!den) return null;
  return num / den;
}

function surveyLooksValid(raw: string): boolean {
  return /^\d{1,6}\/\d{1,4}$/.test(raw);
}

function overallOf(checks: ValidationCheck[]): ValidationOutcome {
  if (checks.some((item) => item.outcome === "Conflict")) return "Conflict";
  if (checks.some((item) => item.outcome === "Warning")) return "Warning";
  return "Passed";
}

function checkArea(record: StructuredLandRecord): ValidationCheck {
  const extent = fieldValue(record, "property", "extent");
  const hectares = parseExtentHectare(extent);

  if (!extent || hectares === null) {
    return {
      id: "area",
      label: "Area validation",
      outcome: "Conflict",
      finding: `Extent could not be parsed from “${extent || "empty"}”.`,
      fields: ["Extent / area"],
    };
  }
  if (hectares <= 0) {
    return {
      id: "area",
      label: "Area validation",
      outcome: "Conflict",
      finding: `Recorded extent ${extent} is not a positive area.`,
      fields: ["Extent / area"],
    };
  }
  if (hectares > 20 || hectares < 0.05) {
    return {
      id: "area",
      label: "Area validation",
      outcome: "Warning",
      finding: `Extent ${extent} is outside the usual village parcel range (0.05–20 ha).`,
      fields: ["Extent / area"],
    };
  }
  return {
    id: "area",
    label: "Area validation",
    outcome: "Passed",
    finding: `Extent ${extent} is within expected range.`,
    fields: ["Extent / area"],
  };
}

function checkSurvey(record: StructuredLandRecord): ValidationCheck {
  const survey = fieldValue(record, "property", "survey_no");
  const subdivision = fieldValue(record, "property", "subdivision");

  if (!survey) {
    return {
      id: "survey",
      label: "Survey number validation",
      outcome: "Conflict",
      finding: "Survey number is missing.",
      fields: ["Survey number"],
    };
  }
  if (!surveyLooksValid(survey)) {
    return {
      id: "survey",
      label: "Survey number validation",
      outcome: "Conflict",
      finding: `“${survey}” does not match the expected survey/subdivision pattern (e.g. 142/3).`,
      fields: ["Survey number"],
    };
  }
  const subpart = survey.split("/")[1];
  if (subdivision && subpart !== subdivision) {
    return {
      id: "survey",
      label: "Survey number validation",
      outcome: "Warning",
      finding: `Survey ${survey} subdivision ${subpart} does not match the subdivision field (${subdivision}).`,
      fields: ["Survey number", "Subdivision"],
    };
  }
  return {
    id: "survey",
    label: "Survey number validation",
    outcome: "Passed",
    finding: `Survey number ${survey} matches the expected format.`,
    fields: ["Survey number", "Subdivision"],
  };
}

function checkRequired(record: StructuredLandRecord): ValidationCheck {
  const required: { section: RecordSectionId; key: string; label: string }[] = [
    { section: "property", key: "survey_no", label: "Survey number" },
    { section: "property", key: "extent", label: "Extent / area" },
    { section: "owner", key: "owner_name", label: "Owner name" },
    { section: "location", key: "district", label: "District" },
    { section: "location", key: "village", label: "Village" },
    { section: "transaction", key: "doc_type", label: "Instrument type" },
  ];
  const missing = required.filter(
    (item) => !fieldValue(record, item.section, item.key),
  );
  const patta = fieldValue(record, "property", "patta_no");
  const idRef = fieldValue(record, "owner", "id_ref");

  if (missing.length > 0) {
    return {
      id: "required",
      label: "Required fields",
      outcome: "Conflict",
      finding: `Missing required fields: ${missing.map((item) => item.label).join(", ")}.`,
      fields: missing.map((item) => item.label),
    };
  }
  if (!patta || /mask|illegible/i.test(idRef)) {
    return {
      id: "required",
      label: "Required fields",
      outcome: "Warning",
      finding: !patta
        ? "Core fields are present, but patta number is empty."
        : "Core fields are present. Identity reference is masked or incomplete.",
      fields: ["Patta number", "Identity reference"],
    };
  }
  return {
    id: "required",
    label: "Required fields",
    outcome: "Passed",
    finding: "Required property, owner, location, and instrument fields are present.",
    fields: required.map((item) => item.label),
  };
}

function checkDuplicate(
  doc: LandDocument,
  all: LandDocument[],
): ValidationCheck {
  const survey = fieldValue(doc.structuredRecord, "property", "survey_no");
  const village = fieldValue(doc.structuredRecord, "location", "village");

  const queueHit = all.find(
    (other) =>
      other.id !== doc.id &&
      fieldValue(other.structuredRecord, "property", "survey_no") === survey &&
      fieldValue(other.structuredRecord, "location", "village") === village &&
      Boolean(survey),
  );
  const masterHit = MOCK_LRMS_INDEX.find(
    (row) => row.survey === survey && row.village === village,
  );
  const sameSurvey = all.find(
    (other) =>
      other.id !== doc.id &&
      fieldValue(other.structuredRecord, "property", "survey_no") === survey &&
      fieldValue(other.structuredRecord, "location", "village") !== village &&
      Boolean(survey),
  );

  if (queueHit || masterHit) {
    const source = queueHit
      ? `ingest queue (${queueHit.name})`
      : "mock LRMS master index";
    return {
      id: "duplicate",
      label: "Duplicate check",
      outcome: "Conflict",
      finding: `Survey ${survey} in ${village} already exists in ${source}.`,
      fields: ["Survey number", "Village"],
    };
  }
  if (sameSurvey) {
    return {
      id: "duplicate",
      label: "Duplicate check",
      outcome: "Warning",
      finding: `Survey ${survey} also appears on ${sameSurvey.name} in a different village.`,
      fields: ["Survey number", "Village"],
    };
  }
  return {
    id: "duplicate",
    label: "Duplicate check",
    outcome: "Passed",
    finding: `No duplicate parcel found for ${survey || "this survey"} in ${village || "the stated village"}.`,
    fields: ["Survey number", "Village"],
  };
}

function checkTransactionArea(record: StructuredLandRecord): ValidationCheck {
  const extent = fieldValue(record, "property", "extent");
  const hectares = parseExtentHectare(extent);
  const shareRaw = fieldValue(record, "owner", "share");
  const share = parseShare(shareRaw);
  const consideration = fieldValue(record, "transaction", "consideration");

  if (/not stated|illegible|^$|₹\s*0\b/i.test(consideration)) {
    const conflict = /₹\s*0\b/.test(consideration);
    return {
      id: "txn-area",
      label: "Transaction area check",
      outcome: conflict ? "Conflict" : "Warning",
      finding: conflict
        ? "Consideration is recorded as zero against a positive land extent."
        : `Consideration is “${consideration || "empty"}”; area–value consistency cannot be confirmed.`,
      fields: ["Consideration", "Extent / area"],
    };
  }
  if (share !== null && share < 1 && hectares !== null) {
    return {
      id: "txn-area",
      label: "Transaction area check",
      outcome: "Warning",
      finding: `Owner share is ${shareRaw} of ${extent}. Confirm the transaction relates to the share, not the full parcel.`,
      fields: ["Share", "Extent / area", "Consideration"],
    };
  }
  return {
    id: "txn-area",
    label: "Transaction area check",
    outcome: "Passed",
    finding: `Consideration ${consideration} is consistent with recorded extent ${extent}.`,
    fields: ["Consideration", "Extent / area", "Share"],
  };
}

function checkDates(record: StructuredLandRecord): ValidationCheck {
  const regRaw = fieldValue(record, "transaction", "reg_date");
  const orderRaw = fieldValue(record, "history", "order_date");
  const registered = parseDate(regRaw);
  const ordered = parseDate(orderRaw);

  if (!registered || !ordered) {
    return {
      id: "dates",
      label: "Date consistency",
      outcome: "Conflict",
      finding: `Could not read registration date “${regRaw}” and/or mutation order date “${orderRaw}”.`,
      fields: ["Registration date", "Order date"],
    };
  }
  if (ordered.getTime() < registered.getTime()) {
    return {
      id: "dates",
      label: "Date consistency",
      outcome: "Conflict",
      finding: `Mutation order (${orderRaw}) is earlier than registration (${regRaw}).`,
      fields: ["Registration date", "Order date"],
    };
  }
  const years =
    (ordered.getTime() - registered.getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (years > 15) {
    return {
      id: "dates",
      label: "Date consistency",
      outcome: "Warning",
      finding: `Mutation order (${orderRaw}) is more than 15 years after registration (${regRaw}).`,
      fields: ["Registration date", "Order date"],
    };
  }
  return {
    id: "dates",
    label: "Date consistency",
    outcome: "Passed",
    finding: `Registration ${regRaw} precedes mutation order ${orderRaw}.`,
    fields: ["Registration date", "Order date"],
  };
}

export function validateDocument(
  doc: LandDocument,
  all: LandDocument[],
): ValidationSummary {
  const checks: ValidationCheck[] = [
    checkArea(doc.structuredRecord),
    checkSurvey(doc.structuredRecord),
    checkRequired(doc.structuredRecord),
    checkDuplicate(doc, all),
    checkTransactionArea(doc.structuredRecord),
    checkDates(doc.structuredRecord),
  ];

  return {
    passed: checks.filter((item) => item.outcome === "Passed").length,
    warning: checks.filter((item) => item.outcome === "Warning").length,
    conflict: checks.filter((item) => item.outcome === "Conflict").length,
    overall: overallOf(checks),
    checks,
  };
}
