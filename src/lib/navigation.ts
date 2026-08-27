export type NavItem = {
  label: string;
  href: string;
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    description: "Operational overview of the land record digitization pipeline.",
  },
  {
    label: "Documents",
    href: "/documents",
    description: "Ingest historical land documents into the processing queue.",
  },
  {
    label: "Classification",
    href: "/classification",
    description: "Identify document type such as RoR, Patta, Chitta, FMB, and mutation records.",
  },
  {
    label: "Preprocessing",
    href: "/preprocessing",
    description: "OpenCV deskew, noise removal, enhancement, and text restoration.",
  },
  {
    label: "OCR",
    href: "/ocr",
    description: "Upload land documents (image, PDF, DOCX) and extract structured fields with PaddleOCR.",
  },
  {
    label: "Structured Record",
    href: "/structured-record",
    description: "Clean land record assembled from extracted fields for officer review.",
  },
  {
    label: "Validation",
    href: "/validation",
    description: "Confidence scoring and business-rule checks on extracted data.",
  },
  {
    label: "Conflicts",
    href: "/conflicts",
    description: "Ownership, area, mutation, duplicate, survey, and GIS conflicts from reconciliation.",
  },
  {
    label: "Verification",
    href: "/verification",
    description: "Officer review and decisioning for uncertain or conflicting records.",
  },
  {
    label: "Land Records",
    href: "/land-records",
    description: "Master land database of verified and versioned records.",
  },
  {
    label: "GIS Map",
    href: "/gis-map",
    description: "Spatial view of cadastral parcels and LRMS/GIS integration.",
  },
  {
    label: "Audit Logs",
    href: "/audit-logs",
    description: "Immutable processing history, officer actions, and version trail.",
  },
  {
    label: "Settings",
    href: "/settings",
    description: "System configuration, roles, and integration endpoints.",
  },
];

export const DEMO_NAV_ITEM: NavItem = {
  label: "Live Demo",
  href: "/demo",
  description: "Walkthrough index of every working TerraLens module.",
};

export function getNavItem(pathname: string): NavItem {
  if (pathname === "/demo" || pathname.startsWith("/demo/")) {
    return DEMO_NAV_ITEM;
  }

  if (pathname === "/") {
    return (
      NAV_ITEMS.find((item) => item.href === "/") ?? NAV_ITEMS[0]
    );
  }

  return (
    NAV_ITEMS.find(
      (item) => item.href !== "/" && pathname.startsWith(item.href),
    ) ?? NAV_ITEMS[0]
  );
}
