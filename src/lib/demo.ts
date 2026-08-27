export type DemoCard = {
  title: string;
  href: string;
  summary: string;
};

/** Walkthrough index for the PPT closing slide. Route: /demo */
export const DEMO_CARDS: DemoCard[] = [
  {
    title: "Dashboard",
    href: "/",
    summary: "Operational pipeline overview with mock district load.",
  },
  {
    title: "Document Upload",
    href: "/documents",
    summary: "Ingest PDF, image, and scan files into the queue.",
  },
  {
    title: "Classification",
    href: "/classification",
    summary: "Mock AI document type, confidence, and officer accept / review.",
  },
  {
    title: "Preprocessing",
    href: "/preprocessing",
    summary: "Mock OpenCV deskew, denoise, enhancement, and restoration.",
  },
  {
    title: "OCR / HTR",
    href: "/extraction",
    summary: "Extraction workspace (OpenCV now; mock OCR text on Verification).",
  },
  {
    title: "Structured Record",
    href: "/structured-record",
    summary: "Clean land record fields with AI vs officer origin.",
  },
  {
    title: "Validation",
    href: "/validation",
    summary: "Business-rule checks: passed, warning, or conflict.",
  },
  {
    title: "Reconciliation",
    href: "/reconciliation",
    summary: "Historical record vs mock LRMS, including the 5→1→4 acre chain.",
  },
  {
    title: "Conflict Detection",
    href: "/conflicts",
    summary: "Ownership, area, mutation, duplicate, survey, and GIS conflicts.",
  },
  {
    title: "Officer Verification",
    href: "/verification",
    summary: "Officer decides; AI recommendation is advisory only.",
  },
  {
    title: "Land Records",
    href: "/land-records",
    summary: "Searchable master file and parcel history.",
  },
  {
    title: "GIS",
    href: "/gis-map",
    summary: "Mock cadastral map; conflict parcels are hatched.",
  },
  {
    title: "Audit Logs",
    href: "/audit-logs",
    summary: "AI and officer activity, versions, and authorized revert.",
  },
];
