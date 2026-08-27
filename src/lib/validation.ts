import type { LandDocument } from "@/lib/documents";
import type {
  RecordSectionId,
  StructuredLandRecord,
} from "@/lib/structured-record";
import {
  validateRecord as apiValidateRecord,
  type LandRecordResponse,
  type RuleOutcome,
  type RuleSeverity,
  type RuleStatus,
  type ValidateRecordPayload,
  type ValidationResult,
  type ValidationVerdict,
} from "@/lib/api";

export type { ValidationVerdict } from "@/lib/api";

export const VALIDATION_OUTCOMES = ["Passed", "Warning", "Conflict"] as const;
export type ValidationOutcome = (typeof VALIDATION_OUTCOMES)[number];

export type ValidationCheck = {
  id: string;
  label: string;
  outcome: ValidationOutcome;
  severity: RuleSeverity;
  finding: string;
  evidence: string;
  fields: string[];
};

export type ValidationSummary = {
  passed: number;
  warning: number;
  conflict: number;
  overall: ValidationOutcome;
  checks: ValidationCheck[];
  verdict: ValidationVerdict;
  confidence: number;
  recordsChecked: number;
  recordsMatched: number;
  historicalChain: string;
  landDna: string;
};

// ---------------------------------------------------------------------------
// Backend status/severity -> UI vocabulary
// ---------------------------------------------------------------------------

const STATUS_TO_OUTCOME: Record<RuleStatus, ValidationOutcome> = {
  PASSED: "Passed",
  WARNING: "Warning",
  CONFLICT: "Conflict",
};

const RULE_LABELS: Record<string, string> = {
  RULE_AREA_ARITHMETIC: "Area & division arithmetic",
  RULE_SURVEY_FORMAT: "Survey number format",
  RULE_OWNER_CHAIN: "Ownership & chain of title",
  RULE_DATE_CHRONOLOGY: "Date & chronology consistency",
  RULE_DUPLICATE_RECORD: "Duplicate document check",
};

export const VERDICT_META: Record<
  ValidationVerdict,
  { emoji: string; label: string; badgeClass: string }
> = {
  VERIFIED: {
    emoji: "🟢",
    label: "VERIFIED",
    badgeClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  },
  VERIFIED_WITH_EXCEPTIONS: {
    emoji: "🟡",
    label: "VERIFIED WITH EXCEPTIONS",
    badgeClass: "border-tl-gold/40 bg-tl-gold/10 text-tl-gold",
  },
  REQUIRES_MANUAL_VERIFICATION: {
    emoji: "🔴",
    label: "REQUIRES MANUAL VERIFICATION",
    badgeClass: "border-red-500/40 bg-red-500/10 text-red-300",
  },
  REJECTED_INVALID: {
    emoji: "⚫",
    label: "REJECTED / INVALID",
    badgeClass: "border-white/30 bg-white/10 text-white",
  },
};

function toCheck(rule: RuleOutcome): ValidationCheck {
  return {
    id: rule.rule_id,
    label: RULE_LABELS[rule.rule_id] ?? rule.rule_id,
    outcome: STATUS_TO_OUTCOME[rule.status] ?? "Warning",
    severity: rule.severity,
    finding: rule.description,
    evidence: rule.evidence,
    fields: rule.fields,
  };
}

export function toValidationSummary(result: ValidationResult): ValidationSummary {
  return {
    passed: result.passed,
    warning: result.warning,
    conflict: result.conflict,
    overall: STATUS_TO_OUTCOME[result.overall] ?? "Warning",
    checks: result.results.map(toCheck),
    verdict: result.verdict,
    confidence: result.confidence,
    recordsChecked: result.records_checked,
    recordsMatched: result.records_matched,
    historicalChain: result.historical_chain,
    landDna: result.land_dna,
  };
}

// ---------------------------------------------------------------------------
// Build the engine payload from a document's structured record (+ the
// authoritative DB row, when one has been fetched, for typed area/owner
// fields the mock structured record doesn't carry precisely).
// ---------------------------------------------------------------------------

function fieldValue(
  record: StructuredLandRecord,
  section: RecordSectionId,
  key: string,
): string | undefined {
  const value = record.sections[section]?.find((item) => item.key === key)?.value?.trim();
  return value ? value : undefined;
}

export function buildValidationPayload(
  doc: LandDocument,
  dbRecord?: LandRecordResponse | null,
): ValidateRecordPayload {
  const sr = doc.structuredRecord;
  const info = dbRecord?.output_information;

  // The mock/demo structured record stores the extent as "1.23 hectare";
  // real DB-backed records store the acres figure under the same "extent"
  // key (see lib/documents.ts mapRecordToDocument). Disambiguate by unit
  // text when we don't have the authoritative DB row to fall back on.
  const extentRaw = fieldValue(sr, "property", "extent");
  const extentIsHectare = extentRaw ? /hect|ha\b/i.test(extentRaw) : false;

  return {
    record_id: doc.dbId,
    document_type: info?.document_type ?? fieldValue(sr, "transaction", "doc_type"),
    survey_no: info?.survey_no ?? fieldValue(sr, "property", "survey_no"),
    khata_no: fieldValue(sr, "property", "khata_no"),
    patta_no: info?.patta_no ?? fieldValue(sr, "property", "patta_no"),
    owner_name: info?.owner_name ?? fieldValue(sr, "owner", "owner_name"),
    owner_father_or_son_name:
      info?.owner_father_or_son_name ?? fieldValue(sr, "owner", "relation"),
    district: info?.district ?? fieldValue(sr, "location", "district"),
    taluk: info?.taluk ?? fieldValue(sr, "location", "taluk"),
    village: info?.village ?? fieldValue(sr, "location", "village"),
    land_area_hectare:
      info?.land_area_hectare ?? (extentIsHectare ? extentRaw : undefined),
    land_area_acres:
      info?.land_area_acres ?? (!extentIsHectare ? extentRaw : undefined),
    land_amount_or_value:
      info?.land_amount_or_value ?? fieldValue(sr, "transaction", "consideration"),
    parent_area_hectare: undefined,
    sub_divisions: undefined,
    prev_owner: fieldValue(sr, "history", "prev_owner"),
    seller_name: fieldValue(sr, "history", "prev_owner"),
    reg_date: fieldValue(sr, "transaction", "reg_date"),
    mutation_date: fieldValue(sr, "history", "order_date"),
    order_date: fieldValue(sr, "history", "order_date"),
    issue_date: fieldValue(sr, "transaction", "reg_date"),
  };
}

export async function validateDocument(
  doc: LandDocument,
  dbRecord?: LandRecordResponse | null,
): Promise<ValidationSummary> {
  const payload = buildValidationPayload(doc, dbRecord);
  const result = await apiValidateRecord(payload);
  return toValidationSummary(result);
}
