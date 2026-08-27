import { mockClassify, type ClassificationResult } from "@/lib/classification";
import { API_BASE } from "@/lib/api";
import {
  idlePreprocessing,
  type PreprocessingState,
} from "@/lib/preprocessing";
import {
  mockStructuredRecord,
  type StructuredLandRecord,
} from "@/lib/structured-record";

export const DOCUMENT_STATUSES = [
  "Uploaded",
  "Processing",
  "Classified",
  "Needs Verification",
  "Validated",
  "Conflict Detected",
  "Approved",
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export type DocumentFormat = "PDF" | "Image" | "Scanned document";

export type LandDocument = {
  id: string;
  dbId?: number;
  name: string;
  format: DocumentFormat;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  status: DocumentStatus;
  origin: "seed" | "upload";
  imageUrl?: string;
  preprocessedUrl?: string;
  classification: ClassificationResult;
  preprocessing: PreprocessingState;
  structuredRecord: StructuredLandRecord;
};

export const ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".tif",
  ".tiff",
  ".bmp",
] as const;

export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/tiff",
  "image/bmp",
] as const;

export const ACCEPT_ATTR = [...ACCEPTED_EXTENSIONS, ...ACCEPTED_MIME_TYPES].join(
  ",",
);

export const MAX_FILE_BYTES = 40 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatUploadedAt(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function inferFormat(file: File | string): DocumentFormat | null {
  const isString = typeof file === "string";
  const name = (isString ? file : (file.name || "")).toLowerCase();
  const type = (isString ? "" : (file.type || "")).toLowerCase();

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    return "PDF";
  }

  if (
    type === "image/tiff" ||
    type === "image/bmp" ||
    name.endsWith(".tif") ||
    name.endsWith(".tiff") ||
    name.endsWith(".bmp")
  ) {
    return "Scanned document";
  }

  if (
    type.startsWith("image/") ||
    [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((ext) => name.endsWith(ext))
  ) {
    return "Image";
  }

  return null;
}

export function isAcceptedFile(file: File): boolean {
  return inferFormat(file) !== null;
}

export const TERMINAL_STATUSES: DocumentStatus[] = [
  "Needs Verification",
  "Conflict Detected",
  "Approved",
];

export function isTerminalStatus(status: DocumentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function pickMockOutcome(name: string): DocumentStatus {
  const sum = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const bucket = sum % 3;
  if (bucket === 0) return "Validated";
  if (bucket === 1) return "Needs Verification";
  return "Conflict Detected";
}

const SEED_BASE: Omit<
  LandDocument,
  "classification" | "preprocessing" | "structuredRecord"
>[] = [
  {
    id: "seed-ror-12",
    name: "RoR_Block12_Sirkazhi.pdf",
    format: "PDF",
    mimeType: "application/pdf",
    sizeBytes: 2_451_200,
    uploadedAt: "2026-08-22T09:14:00.000Z",
    status: "Uploaded",
    origin: "seed",
  },
  {
    id: "seed-patta-142",
    name: "Patta_Survey_142.jpg",
    format: "Image",
    mimeType: "image/jpeg",
    sizeBytes: 3_870_412,
    uploadedAt: "2026-08-22T10:02:00.000Z",
    status: "Processing",
    origin: "seed",
  },
  {
    id: "seed-fmb-map",
    name: "FMB_Village_Map_Ward3.tif",
    format: "Scanned document",
    mimeType: "image/tiff",
    sizeBytes: 18_204_160,
    uploadedAt: "2026-08-23T06:41:00.000Z",
    status: "Classified",
    origin: "seed",
  },
  {
    id: "seed-chitta",
    name: "Chitta_Extract_2011.png",
    format: "Image",
    mimeType: "image/png",
    sizeBytes: 1_102_448,
    uploadedAt: "2026-08-23T11:18:00.000Z",
    status: "Validated",
    origin: "seed",
  },
  {
    id: "seed-mutation",
    name: "Mutation_Khata_88.pdf",
    format: "PDF",
    mimeType: "application/pdf",
    sizeBytes: 890_112,
    uploadedAt: "2026-08-24T08:33:00.000Z",
    status: "Needs Verification",
    origin: "seed",
  },
  {
    id: "seed-deed",
    name: "SaleDeed_Registration_2009.pdf",
    format: "PDF",
    mimeType: "application/pdf",
    sizeBytes: 4_612_096,
    uploadedAt: "2026-08-24T14:55:00.000Z",
    status: "Conflict Detected",
    origin: "seed",
  },
  {
    id: "seed-areg",
    name: "A-Register_Sirkazhi_1984.pdf",
    format: "PDF",
    mimeType: "application/pdf",
    sizeBytes: 6_230_016,
    uploadedAt: "2026-08-21T07:05:00.000Z",
    status: "Approved",
    origin: "seed",
  },
];

export function hydrateDocument(
  doc: Omit<
    LandDocument,
    "classification" | "preprocessing" | "structuredRecord"
  > & {
    classification?: ClassificationResult;
    preprocessing?: PreprocessingState;
    structuredRecord?: StructuredLandRecord;
  },
): LandDocument {
  const classification = doc.classification ?? mockClassify(doc.name);
  return {
    ...doc,
    classification,
    preprocessing: doc.preprocessing ?? idlePreprocessing(doc.name),
    structuredRecord:
      doc.structuredRecord ??
      mockStructuredRecord(doc.name, classification.predictedType),
  };
}

export const SEED_DOCUMENTS: LandDocument[] = SEED_BASE.map(hydrateDocument);

export function mapRecordToDocument(r: any): LandDocument {
  const meta = (r.ocr_metadata && r.ocr_metadata.extra) || {};
  // preprocessed_url can be at top-level ocr_metadata (set by OCR endpoint)
  // OR inside extra (set by pipeline sync). Check both.
  const rawPreprocessedUrl: string | null =
    r.ocr_metadata?.preprocessed_url ||
    meta?.preprocessed_url ||
    null;
  let structuredRecord = meta.structuredRecord;
  if (!structuredRecord) {
    const pfData = r.output_information.parsed_fields || {};
    structuredRecord = {
      sections: {
        property: [
          { key: "survey_no", label: "Survey number", value: r.output_information.survey_no || "", confidence: 95.0, sourcePage: 1, origin: "ai", aiValue: r.output_information.survey_no || "" },
          { key: "subdivision", label: "Subdivision", value: pfData.subdivision || "", confidence: 90.0, sourcePage: 1, origin: "ai", aiValue: pfData.subdivision || "" },
          { key: "extent", label: "Extent / area", value: r.output_information.land_area_acres || "", confidence: 93.0, sourcePage: 1, origin: "ai", aiValue: r.output_information.land_area_acres || "" },
          { key: "land_type", label: "Land classification", value: r.output_information.land_type || "Patta", confidence: 91.0, sourcePage: 1, origin: "ai", aiValue: r.output_information.land_type || "Patta" },
          { key: "patta_no", label: "Patta number", value: r.output_information.patta_no || "", confidence: 94.0, sourcePage: 2, origin: "ai", aiValue: r.output_information.patta_no || "" },
          { key: "khata_no", label: "Khata number", value: pfData.khata_no || "", confidence: 85.0, sourcePage: 2, origin: "ai", aiValue: pfData.khata_no || "" }
        ],
        owner: [
          { key: "owner_name", label: "Owner name", value: r.output_information.owner_name || "", confidence: 89.0, sourcePage: 1, origin: "ai", aiValue: r.output_information.owner_name || "" },
          { key: "relation", label: "Father / husband", value: r.output_information.owner_father_or_son_name || "", confidence: 88.0, sourcePage: 1, origin: "ai", aiValue: r.output_information.owner_father_or_son_name || "" },
          { key: "share", label: "Share", value: pfData.share || "1/1", confidence: 86.0, sourcePage: 2, origin: "ai", aiValue: pfData.share || "1/1" },
          { key: "occupancy", label: "Occupancy", value: pfData.occupancy || "In possession", confidence: 82.0, sourcePage: 2, origin: "ai", aiValue: pfData.occupancy || "In possession" },
          { key: "id_ref", label: "Identity reference", value: pfData.id_ref || "AADHAAR-MASKED-XXXX", confidence: 72.0, sourcePage: 3, origin: "ai", aiValue: pfData.id_ref || "AADHAAR-MASKED-XXXX" }
        ],
        location: [
          { key: "state", label: "State", value: "Tamil Nadu", confidence: 98.0, sourcePage: 1, origin: "ai", aiValue: "Tamil Nadu" },
          { key: "district", label: "District", value: r.output_information.district || "Mayiladuthurai", confidence: 95.0, sourcePage: 1, origin: "ai", aiValue: r.output_information.district || "Mayiladuthurai" },
          { key: "taluk", label: "Taluk", value: r.output_information.taluk || "Sirkazhi", confidence: 94.0, sourcePage: 1, origin: "ai", aiValue: r.output_information.taluk || "Sirkazhi" },
          { key: "village", label: "Village", value: r.output_information.village || "Sirkazhi", confidence: 92.0, sourcePage: 1, origin: "ai", aiValue: r.output_information.village || "Sirkazhi" },
          { key: "block", label: "Block / ward", value: pfData.block || "Block 12", confidence: 78.0, sourcePage: 2, origin: "ai", aiValue: pfData.block || "Block 12" },
          { key: "revenue_village", label: "Revenue village code", value: pfData.revenue_village || "RV-33012", confidence: 82.0, sourcePage: 2, origin: "ai", aiValue: pfData.revenue_village || "RV-33012" }
        ],
        transaction: [
          { key: "doc_type", label: "Instrument type", value: r.output_information.document_type || "Patta", confidence: 94.0, sourcePage: 1, origin: "ai", aiValue: r.output_information.document_type || "Patta" },
          { key: "reg_no", label: "Registration number", value: pfData.reg_no || "", confidence: 85.0, sourcePage: 3, origin: "ai", aiValue: pfData.reg_no || "" },
          { key: "reg_date", label: "Registration date", value: pfData.reg_date || "", confidence: 84.0, sourcePage: 3, origin: "ai", aiValue: pfData.reg_date || "" },
          { key: "consideration", label: "Consideration", value: r.output_information.land_amount_or_value ? ("₹ " + r.output_information.land_amount_or_value) : "", confidence: 70.0, sourcePage: 3, origin: "ai", aiValue: r.output_information.land_amount_or_value ? ("₹ " + r.output_information.land_amount_or_value) : "" },
          { key: "stamp", label: "Stamp / duty", value: pfData.stamp || "", confidence: 65.0, sourcePage: 3, origin: "ai", aiValue: pfData.stamp || "" }
        ],
        history: [
          { key: "mutation_no", label: "Mutation number", value: pfData.mutation_no || "", confidence: 82.0, sourcePage: 4, origin: "ai", aiValue: pfData.mutation_no || "" },
          { key: "prev_owner", label: "Previous owner", value: pfData.prev_owner || "", confidence: 76.0, sourcePage: 4, origin: "ai", aiValue: pfData.prev_owner || "" },
          { key: "order_date", label: "Order date", value: pfData.order_date || "", confidence: 75.0, sourcePage: 4, origin: "ai", aiValue: pfData.order_date || "" },
          { key: "chain", label: "Title chain note", value: pfData.chain || "", confidence: 72.0, sourcePage: 4, origin: "ai", aiValue: pfData.chain || "" },
          { key: "remarks", label: "Remarks", value: "Verified record in DB", confidence: 99.0, sourcePage: 1, origin: "ai", aiValue: "Verified record in DB" }
        ]
      }
    };
  }

  // Preserve the forensics if present
  const forensics = r.ocr_metadata && r.ocr_metadata.forensics;

  const isSeedRecord = r.government_integration.external_gov_id?.startsWith("seed-") || r.government_integration.external_gov_id?.startsWith("mlr-");
  const docId = isSeedRecord ? r.government_integration.external_gov_id : r.id.toString();

  return {
    id: docId,
    dbId: r.id,
    name: r.input_image.source_filename || "unknown",
    format: inferFormat(r.input_image.source_filename) || "PDF",
    mimeType: meta.mimeType || (() => {
      const lower = r.input_image.source_filename?.toLowerCase() || "";
      if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
      if (lower.endsWith(".png")) return "image/png";
      if (lower.endsWith(".webp")) return "image/webp";
      if (lower.endsWith(".gif")) return "image/gif";
      if (lower.endsWith(".bmp")) return "image/bmp";
      if (lower.endsWith(".tif") || lower.endsWith(".tiff")) return "image/tiff";
      return "application/pdf";
    })(),
    sizeBytes: meta.sizeBytes || 1024 * 1024,
    uploadedAt: r.created_at || new Date().toISOString(),
    status: r.government_integration.sync_status as any,
    origin: r.government_integration.external_gov_id?.startsWith("seed-") ? "seed" : "upload",
    imageUrl: r.input_image.image_url ? `${API_BASE}${r.input_image.image_url}` : undefined,
    preprocessedUrl: rawPreprocessedUrl ? `${API_BASE}${rawPreprocessedUrl}` : undefined,
    classification: meta.classification || {
      predictedType: r.output_information.document_type || "Patta",
      confidence: 0.95,
      decision: "accepted",
    },
    preprocessing: meta.preprocessing || hydrateDocument({ id: docId, name: r.input_image.source_filename || "", format: "PDF", mimeType: "application/pdf", sizeBytes: 1024, uploadedAt: "", status: "Uploaded", origin: "seed" }).preprocessing,
    structuredRecord,
    ...(forensics ? { forensics } : {})
  };
}
