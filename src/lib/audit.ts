export const AUDIT_ACTORS = ["AI", "Officer", "System"] as const;
export type AuditActor = (typeof AUDIT_ACTORS)[number];

export type RecordSnapshot = {
  owner: string;
  surveyNumber: string;
  area: string;
  village: string;
  status: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  user: string;
  actor: AuditActor;
  action: string;
  record: string;
  recordId: string;
  oldValue: string;
  newValue: string;
};

export type RecordVersion = {
  id: string;
  recordId: string;
  recordLabel: string;
  version: number;
  at: string;
  user: string;
  summary: string;
  snapshot: RecordSnapshot;
};

export type AuditState = {
  events: AuditEvent[];
  versions: RecordVersion[];
  currentVersionId: Record<string, string>;
};

/** Current sidebar session may revert versions. */
export const SESSION_USER = "R. Venkatesh (RO-4821)";
export const SESSION_CAN_REVERT = true;

const dash = "—";

export const AUDIT_RECORDS = [
  {
    id: "mlr-142-3-remain",
    label: "Survey 142/3 · Sirkazhi · R. Venkatesan",
  },
  {
    id: "mlr-142-3b",
    label: "Survey 142/3B · Sirkazhi · K. Meenakshi",
  },
  {
    id: "mlr-142-3-parent",
    label: "Survey 142/3 (parent 5 ac) · Sirkazhi",
  },
  {
    id: "seed-deed",
    label: "SaleDeed_Registration_2009.pdf",
  },
] as const;

const snapRemainV1: RecordSnapshot = {
  owner: "R. Venkatesan",
  surveyNumber: "142/3",
  area: "5.00 acres",
  village: "Sirkazhi",
  status: "Provisional",
};

const snapRemainV2: RecordSnapshot = {
  owner: "R. Venkatesan",
  surveyNumber: "142/3",
  area: "4.00 acres",
  village: "Sirkazhi",
  status: "Provisional",
};

const snapRemainV3: RecordSnapshot = {
  owner: "R. Venkatesan",
  surveyNumber: "142/3",
  area: "4.00 acres",
  village: "Sirkazhi",
  status: "Current",
};

const snapMeenaV1: RecordSnapshot = {
  owner: "K. Meenakshi",
  surveyNumber: "142/3B",
  area: "1.00 acre",
  village: "Sirkazhi",
  status: "Provisional",
};

const snapMeenaV2: RecordSnapshot = {
  owner: "K. Meenakshi",
  surveyNumber: "142/3B",
  area: "1.00 acre",
  village: "Sirkazhi",
  status: "Current",
};

export const SEED_VERSIONS: RecordVersion[] = [
  {
    id: "ver-remain-1",
    recordId: "mlr-142-3-remain",
    recordLabel: AUDIT_RECORDS[0].label,
    version: 1,
    at: "2026-08-24T15:10:00.000Z",
    user: "AI Engine",
    summary: "Extracted from A-Register / sale deed. Full 5.00 acres still shown.",
    snapshot: snapRemainV1,
  },
  {
    id: "ver-remain-2",
    recordId: "mlr-142-3-remain",
    recordLabel: AUDIT_RECORDS[0].label,
    version: 2,
    at: "2026-08-24T16:02:00.000Z",
    user: SESSION_USER,
    summary: "Officer reduced holding after 1 acre sale to K. Meenakshi.",
    snapshot: snapRemainV2,
  },
  {
    id: "ver-remain-3",
    recordId: "mlr-142-3-remain",
    recordLabel: AUDIT_RECORDS[0].label,
    version: 3,
    at: "2026-08-25T09:40:00.000Z",
    user: SESSION_USER,
    summary: "Approved remainder written to master land database.",
    snapshot: snapRemainV3,
  },
  {
    id: "ver-meena-1",
    recordId: "mlr-142-3b",
    recordLabel: AUDIT_RECORDS[1].label,
    version: 1,
    at: "2026-08-24T15:12:00.000Z",
    user: "AI Engine",
    summary: "Purchaser holding carved from parent survey 142/3.",
    snapshot: snapMeenaV1,
  },
  {
    id: "ver-meena-2",
    recordId: "mlr-142-3b",
    recordLabel: AUDIT_RECORDS[1].label,
    version: 2,
    at: "2026-08-25T09:41:00.000Z",
    user: SESSION_USER,
    summary: "Approved 1.00 acre holding written to master file.",
    snapshot: snapMeenaV2,
  },
  {
    id: "ver-parent-1",
    recordId: "mlr-142-3-parent",
    recordLabel: AUDIT_RECORDS[2].label,
    version: 1,
    at: "2026-08-24T15:08:00.000Z",
    user: "AI Engine",
    summary: "Parent 5.00 acre holding retained as superseded duplicate.",
    snapshot: {
      owner: "R. Venkatesan",
      surveyNumber: "142/3",
      area: "5.00 acres",
      village: "Sirkazhi",
      status: "Superseded",
    },
  },
];

export const SEED_CURRENT_VERSION: Record<string, string> = {
  "mlr-142-3-remain": "ver-remain-3",
  "mlr-142-3b": "ver-meena-2",
  "mlr-142-3-parent": "ver-parent-1",
};

export const SEED_EVENTS: AuditEvent[] = [
  {
    id: "evt-01",
    at: "2026-08-24T14:55:00.000Z",
    user: SESSION_USER,
    actor: "Officer",
    action: "Document uploaded",
    record: "SaleDeed_Registration_2009.pdf",
    recordId: "seed-deed",
    oldValue: dash,
    newValue: "Queued",
  },
  {
    id: "evt-02",
    at: "2026-08-24T14:56:00.000Z",
    user: "System",
    actor: "System",
    action: "Preprocessing completed",
    record: "SaleDeed_Registration_2009.pdf",
    recordId: "seed-deed",
    oldValue: "Raw scan",
    newValue: "Deskew + enhance",
  },
  {
    id: "evt-03",
    at: "2026-08-24T14:58:00.000Z",
    user: "AI Engine",
    actor: "AI",
    action: "Classification completed",
    record: "SaleDeed_Registration_2009.pdf",
    recordId: "seed-deed",
    oldValue: dash,
    newValue: "Sale deed / registration (92%)",
  },
  {
    id: "evt-04",
    at: "2026-08-24T15:02:00.000Z",
    user: "AI Engine",
    actor: "AI",
    action: "OCR completed",
    record: "SaleDeed_Registration_2009.pdf",
    recordId: "seed-deed",
    oldValue: dash,
    newValue: "Structured fields extracted",
  },
  {
    id: "evt-05",
    at: "2026-08-24T15:10:00.000Z",
    user: "AI Engine",
    actor: "AI",
    action: "Record created",
    record: AUDIT_RECORDS[0].label,
    recordId: "mlr-142-3-remain",
    oldValue: dash,
    newValue: formatSnapshot(snapRemainV1),
  },
  {
    id: "evt-06",
    at: "2026-08-24T15:12:00.000Z",
    user: "AI Engine",
    actor: "AI",
    action: "Record created",
    record: AUDIT_RECORDS[1].label,
    recordId: "mlr-142-3b",
    oldValue: dash,
    newValue: formatSnapshot(snapMeenaV1),
  },
  {
    id: "evt-07",
    at: "2026-08-24T15:18:00.000Z",
    user: "AI Engine",
    actor: "AI",
    action: "Conflict detected",
    record: AUDIT_RECORDS[0].label,
    recordId: "mlr-142-3-remain",
    oldValue: "Historical 5.00 acres minus 1.00 acre sale",
    newValue: "LRMS still shows undivided 5.00 acres",
  },
  {
    id: "evt-08",
    at: "2026-08-24T16:02:00.000Z",
    user: SESSION_USER,
    actor: "Officer",
    action: "Record modified",
    record: AUDIT_RECORDS[0].label,
    recordId: "mlr-142-3-remain",
    oldValue: "Area 5.00 acres",
    newValue: "Area 4.00 acres",
  },
  {
    id: "evt-09",
    at: "2026-08-24T16:04:00.000Z",
    user: SESSION_USER,
    actor: "Officer",
    action: "Record modified",
    record: "SaleDeed_Registration_2009.pdf",
    recordId: "seed-deed",
    oldValue: "Purchaser blank",
    newValue: "K. Meenakshi",
  },
  {
    id: "evt-10",
    at: "2026-08-25T09:22:00.000Z",
    user: "S. Priya (RO-1104)",
    actor: "Officer",
    action: "Conflict assigned",
    record: AUDIT_RECORDS[2].label,
    recordId: "mlr-142-3-parent",
    oldValue: "Unassigned",
    newValue: "S. Priya (RO-1104)",
  },
  {
    id: "evt-11",
    at: "2026-08-25T09:38:00.000Z",
    user: SESSION_USER,
    actor: "Officer",
    action: "Officer approved",
    record: AUDIT_RECORDS[0].label,
    recordId: "mlr-142-3-remain",
    oldValue: "Needs Verification",
    newValue: "Approved",
  },
  {
    id: "evt-12",
    at: "2026-08-25T09:39:00.000Z",
    user: SESSION_USER,
    actor: "Officer",
    action: "Officer approved",
    record: AUDIT_RECORDS[1].label,
    recordId: "mlr-142-3b",
    oldValue: "Provisional",
    newValue: "Approved",
  },
  {
    id: "evt-13",
    at: "2026-08-25T09:40:00.000Z",
    user: "System",
    actor: "System",
    action: "Database updated",
    record: AUDIT_RECORDS[0].label,
    recordId: "mlr-142-3-remain",
    oldValue: formatSnapshot(snapRemainV2),
    newValue: formatSnapshot(snapRemainV3),
  },
  {
    id: "evt-14",
    at: "2026-08-25T09:41:00.000Z",
    user: "System",
    actor: "System",
    action: "Database updated",
    record: AUDIT_RECORDS[1].label,
    recordId: "mlr-142-3b",
    oldValue: formatSnapshot(snapMeenaV1),
    newValue: formatSnapshot(snapMeenaV2),
  },
  {
    id: "evt-15",
    at: "2026-08-22T09:14:00.000Z",
    user: SESSION_USER,
    actor: "Officer",
    action: "Document uploaded",
    record: "RoR_Block12_Sirkazhi.pdf",
    recordId: "seed-ror-12",
    oldValue: dash,
    newValue: "Queued",
  },
  {
    id: "evt-16",
    at: "2026-08-22T09:16:00.000Z",
    user: "AI Engine",
    actor: "AI",
    action: "Classification completed",
    record: "RoR_Block12_Sirkazhi.pdf",
    recordId: "seed-ror-12",
    oldValue: dash,
    newValue: "Record of Rights (88%)",
  },
  {
    id: "evt-17",
    at: "2026-08-22T09:18:00.000Z",
    user: "AI Engine",
    actor: "AI",
    action: "OCR completed",
    record: "RoR_Block12_Sirkazhi.pdf",
    recordId: "seed-ror-12",
    oldValue: dash,
    newValue: "Owner and survey fields extracted",
  },
];

export function formatSnapshot(snapshot: RecordSnapshot): string {
  return `${snapshot.owner} · ${snapshot.surveyNumber} · ${snapshot.area} · ${snapshot.status}`;
}

export function formatAuditTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function searchEvents(
  events: AuditEvent[],
  query: string,
  actor: AuditActor | "all",
): AuditEvent[] {
  const q = query.trim().toLowerCase();
  return events
    .filter((event) => (actor === "all" ? true : event.actor === actor))
    .filter((event) => {
      if (!q) return true;
      return [
        event.user,
        event.action,
        event.record,
        event.oldValue,
        event.newValue,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    })
    .slice()
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function versionsForRecord(
  versions: RecordVersion[],
  recordId: string,
): RecordVersion[] {
  return versions
    .filter((item) => item.recordId === recordId)
    .slice()
    .sort((a, b) => b.version - a.version);
}

export function seedAuditState(): AuditState {
  return {
    events: SEED_EVENTS,
    versions: SEED_VERSIONS,
    currentVersionId: { ...SEED_CURRENT_VERSION },
  };
}

// ---------------------------------------------------------------------------
// Compliance export — CSV + print-to-PDF
// ---------------------------------------------------------------------------

const CONFIDENCE_RE = /\((\d{1,3})\s*%\)/;

/** Pulls an AI confidence score (e.g. "92" from "Sale deed (92%)") out of an event, when present. */
export function extractConfidence(event: AuditEvent): number | null {
  const match = `${event.newValue} ${event.oldValue}`.match(CONFIDENCE_RE);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(csvCell).join(",");
}

/**
 * Builds a single compliance-report CSV combining the officer/AI/system
 * event log (with AI confidence scores extracted into their own column)
 * and the full record edit/version history — suitable for regulator or
 * internal audit export.
 */
export function buildComplianceCSV(
  events: AuditEvent[],
  versions: RecordVersion[],
): string {
  const eventHeader = [
    "Timestamp",
    "User",
    "Actor",
    "Action",
    "Record",
    "Record ID",
    "Old Value",
    "New Value",
    "AI Confidence",
  ];
  const eventRows = events.map((event) => {
    const confidence = extractConfidence(event);
    return csvRow([
      event.at,
      event.user,
      event.actor,
      event.action,
      event.record,
      event.recordId,
      event.oldValue,
      event.newValue,
      confidence !== null ? `${confidence}%` : "",
    ]);
  });

  const versionHeader = [
    "Record",
    "Record ID",
    "Version",
    "Timestamp",
    "User",
    "Owner",
    "Survey Number",
    "Area",
    "Village",
    "Status",
    "Summary",
  ];
  const versionRows = versions
    .slice()
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .map((v) =>
      csvRow([
        v.recordLabel,
        v.recordId,
        v.version,
        v.at,
        v.user,
        v.snapshot.owner,
        v.snapshot.surveyNumber,
        v.snapshot.area,
        v.snapshot.village,
        v.snapshot.status,
        v.summary,
      ]),
    );

  return [
    "EVENT LOG (officer decisions, AI actions, system updates)",
    csvRow(eventHeader),
    ...eventRows,
    "",
    "RECORD EDIT HISTORY (versioned snapshots)",
    csvRow(versionHeader),
    ...versionRows,
  ].join("\r\n");
}

/** Triggers a browser download of `content` as a file named `filename`. */
export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadComplianceCSV(
  events: AuditEvent[],
  versions: RecordVersion[],
): void {
  // UTF-8 BOM so Excel opens the export with correct encoding.
  const csv = "﻿" + buildComplianceCSV(events, versions);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  downloadTextFile(`terralens-audit-compliance-${stamp}.csv`, csv, "text/csv;charset=utf-8");
}
