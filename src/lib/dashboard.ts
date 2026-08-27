export const DASHBOARD_KPIS = [
  { label: "In queue", value: "18", hint: "Awaiting ingest / classify" },
  { label: "Processing", value: "7", hint: "OpenCV / OCR pipeline" },
  { label: "Needs verification", value: "11", hint: "Officer queue" },
  { label: "Open conflicts", value: "9", hint: "Reconciliation exceptions" },
  { label: "Approved today", value: "4", hint: "Written to master file" },
] as const;

export const PIPELINE_STAGES = [
  { stage: "Uploaded", count: 18, share: "22%" },
  { stage: "Classification", count: 12, share: "15%" },
  { stage: "Preprocessing", count: 7, share: "9%" },
  { stage: "Extraction", count: 6, share: "7%" },
  { stage: "Validation", count: 9, share: "11%" },
  { stage: "Reconciliation", count: 8, share: "10%" },
  { stage: "Verification", count: 11, share: "14%" },
  { stage: "Approved", count: 10, share: "12%" },
] as const;

export const CONFLICT_BREAKDOWN = [
  { type: "Ownership mismatch", count: 2, severity: "Critical" },
  { type: "Area mismatch", count: 2, severity: "High" },
  { type: "Missing transaction", count: 1, severity: "Critical" },
  { type: "Missing mutation", count: 1, severity: "High" },
  { type: "Duplicate record", count: 1, severity: "Critical" },
  { type: "GIS mismatch", count: 2, severity: "Medium" },
] as const;

export const OFFICER_WORKLOAD = [
  {
    name: "R. Venkatesh",
    id: "RO-4821",
    pending: 5,
    conflicts: 3,
    office: "Sirkazhi",
  },
  {
    name: "S. Priya",
    id: "RO-1104",
    pending: 4,
    conflicts: 2,
    office: "Sirkazhi",
  },
  {
    name: "M. Karthik",
    id: "RO-2290",
    pending: 2,
    conflicts: 4,
    office: "Mayiladuthurai",
  },
] as const;

export const RECENT_ACTIVITY = [
  {
    time: "21:40",
    item: "SaleDeed_Registration_2009.pdf",
    event: "Conflict detected — LRMS missing 1 acre sale",
    href: "/conflicts",
  },
  {
    time: "21:12",
    item: "Mutation_Khata_88.pdf",
    event: "Sent for officer verification",
    href: "/verification",
  },
  {
    time: "20:55",
    item: "RoR_Block12_Sirkazhi.pdf",
    event: "Area mismatch vs government RoR (4 vs 5 acres)",
    href: "/reconciliation",
  },
  {
    time: "19:18",
    item: "Survey 142/3 remainder",
    event: "Master record approved — 4.00 acres current",
    href: "/land-records",
  },
  {
    time: "18:02",
    item: "FMB_Village_Map_Ward3.tif",
    event: "GIS mismatch flagged on parcel 88/2",
    href: "/gis-map",
  },
] as const;

export const THROUGHPUT = {
  district: "Mayiladuthurai",
  meanConfidence: "86%",
  recordsToday: 31,
  avgVerifyMinutes: 14,
  watch: "5.00 acre parent still live after 1.00 acre sale (Sirkazhi 142/3)",
} as const;
