import type { RecordType } from "@/lib/classification";

export const RECORD_SECTIONS = [
  { id: "property", label: "Property" },
  { id: "owner", label: "Owner" },
  { id: "location", label: "Location" },
  { id: "transaction", label: "Transaction" },
  { id: "history", label: "History" },
] as const;

export type RecordSectionId = (typeof RECORD_SECTIONS)[number]["id"];

export type FieldOrigin = "ai" | "officer";

export type StructuredField = {
  key: string;
  label: string;
  value: string;
  confidence: number;
  sourcePage: number;
  origin: FieldOrigin;
  aiValue: string;
};

export type StructuredLandRecord = {
  sections: Record<RecordSectionId, StructuredField[]>;
};

function hashName(name: string): number {
  return Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function field(
  key: string,
  label: string,
  value: string,
  confidence: number,
  sourcePage: number,
): StructuredField {
  return {
    key,
    label,
    value,
    confidence,
    sourcePage,
    origin: "ai",
    aiValue: value,
  };
}

export function mockStructuredRecord(
  name: string,
  recordType: RecordType,
): StructuredLandRecord {
  const hash = hashName(name);
  const survey = `${120 + (hash % 80)}/${1 + (hash % 12)}`;
  const extent = `${(1.2 + (hash % 35) / 10).toFixed(2)} hectare`;
  const patta = `${18000 + (hash % 9000)}`;
  const owners = [
    "R. Venkatesan",
    "K. Meenakshi",
    "S. Rajendran",
    "M. Lakshmi",
    "P. Selvam",
  ];
  const owner = owners[hash % owners.length];
  const fathers = [
    "Late Ramasamy",
    "Govindan",
    "Murugan",
    "Subramanian",
    "Arumugam",
  ];
  const villages = [
    "Sirkazhi",
    "Thirumullaivasal",
    "Nallur",
    "Puthur",
    "Agaram",
  ];
  const village = /sirkazhi/i.test(name)
    ? "Sirkazhi"
    : villages[hash % villages.length];
  const regYear = 1984 + (hash % 30);
  const mutation = `MUT/${regYear}/${100 + (hash % 80)}`;

  return {
    sections: {
      property: [
        field("survey_no", "Survey number", survey, 91.4 - (hash % 8), 1),
        field("subdivision", "Subdivision", `${1 + (hash % 6)}`, 88.2, 1),
        field("extent", "Extent / area", extent, 84.6, 1),
        field(
          "land_type",
          "Land classification",
          hash % 2 === 0 ? "Wet (Nanjai)" : "Dry (Punjai)",
          86.1,
          1,
        ),
        field("patta_no", "Patta number", patta, 89.7, 2),
        field("khata_no", "Khata number", `KH-${3200 + (hash % 400)}`, 82.3, 2),
      ],
      owner: [
        field("owner_name", "Owner name", owner, 87.5, 1),
        field(
          "relation",
          "Father / husband",
          fathers[hash % fathers.length],
          79.4,
          1,
        ),
        field(
          "share",
          "Share",
          hash % 3 === 0 ? "1/1" : hash % 3 === 1 ? "1/2" : "2/3",
          81.0,
          2,
        ),
        field(
          "occupancy",
          "Occupancy",
          hash % 2 === 0 ? "In possession" : "Joint holding",
          76.8,
          2,
        ),
        field(
          "id_ref",
          "Identity reference",
          `AADHAAR-MASKED-${1000 + (hash % 800)}`,
          71.2,
          3,
        ),
      ],
      location: [
        field("state", "State", "Tamil Nadu", 96.8, 1),
        field("district", "District", "Mayiladuthurai", 93.1, 1),
        field("taluk", "Taluk", "Sirkazhi", 90.4, 1),
        field("village", "Village", village, 88.9, 1),
        field("block", "Block / ward", `Block ${1 + (hash % 9)}`, 74.6, 2),
        field(
          "revenue_village",
          "Revenue village code",
          `RV-${33000 + (hash % 200)}`,
          80.2,
          2,
        ),
      ],
      transaction: [
        field("doc_type", "Instrument type", recordType, 94.2, 1),
        field(
          "reg_no",
          "Registration number",
          `DOC/${regYear}/${2000 + (hash % 500)}`,
          85.7,
          3,
        ),
        field(
          "reg_date",
          "Registration date",
          `${12 + (hash % 16)}/${((hash % 9) + 1).toString().padStart(2, "0")}/${regYear}`,
          83.3,
          3,
        ),
        field(
          "consideration",
          "Consideration",
          hash % 4 === 0 ? "Not stated" : `₹ ${(2 + (hash % 18)).toFixed(1)} lakh`,
          69.5,
          3,
        ),
        field(
          "stamp",
          "Stamp / duty",
          hash % 5 === 0 ? "Illegible" : `₹ ${1200 + (hash % 40) * 50}`,
          64.8,
          3,
        ),
      ],
      history: [
        field("mutation_no", "Mutation number", mutation, 82.9, 4),
        field(
          "prev_owner",
          "Previous owner",
          fathers[(hash + 2) % fathers.length],
          77.1,
          4,
        ),
        field(
          "order_date",
          "Order date",
          `${4 + (hash % 20)}/0${1 + (hash % 8)}/${regYear + 1}`,
          75.4,
          4,
        ),
        field(
          "chain",
          "Title chain note",
          hash % 2 === 0
            ? "Single mutation from settlement register"
            : "Two prior transfers on record",
          72.0,
          4,
        ),
        field(
          "remarks",
          "Remarks",
          "Mock extraction — OCR not connected",
          99.0,
          1,
        ),
      ],
    },
  };
}

export function countOfficerEdits(record: StructuredLandRecord): number {
  return RECORD_SECTIONS.reduce((total, section) => {
    return (
      total +
      record.sections[section.id].filter((item) => item.origin === "officer")
        .length
    );
  }, 0);
}

export function applyFieldEdit(
  record: StructuredLandRecord,
  section: RecordSectionId,
  key: string,
  value: string,
): StructuredLandRecord {
  return {
    sections: {
      ...record.sections,
      [section]: record.sections[section].map((item) => {
        if (item.key !== key) return item;
        const trimmed = value;
        const origin: FieldOrigin =
          trimmed === item.aiValue ? "ai" : "officer";
        return { ...item, value: trimmed, origin };
      }),
    },
  };
}
