// ---------------------------------------------------------------------------
// Officer role hierarchy — Indian Revenue Administration
// ---------------------------------------------------------------------------

export const OFFICER_ROLES = [
  "VAO",
  "RI",
  "DEPUTY_TAHSILDAR",
  "TAHSILDAR",
  "RDO",
  "DISTRICT_COLLECTOR",
] as const;

export type OfficerRole = (typeof OFFICER_ROLES)[number];

export type RoleMeta = {
  code: OfficerRole;
  /** 1 (lowest — Village Administrative Officer) to 6 (highest — District Collector / full admin). */
  level: number;
  title: string;
  shortTitle: string;
  description: string;
};

export const ROLE_META: Record<OfficerRole, RoleMeta> = {
  VAO: {
    code: "VAO",
    level: 1,
    title: "Village Administrative Officer",
    shortTitle: "VAO",
    description: "Uploads, scans, and document ingestion.",
  },
  RI: {
    code: "RI",
    level: 2,
    title: "Revenue Inspector",
    shortTitle: "RI",
    description: "Field verification, OCR extraction, basic validation.",
  },
  DEPUTY_TAHSILDAR: {
    code: "DEPUTY_TAHSILDAR",
    level: 3,
    title: "Deputy Tahsildar",
    shortTitle: "Dy. Tahsildar",
    description: "Reconciliation and conflict resolution.",
  },
  TAHSILDAR: {
    code: "TAHSILDAR",
    level: 4,
    title: "Tahsildar",
    shortTitle: "Tahsildar",
    description: "Final verification sign-off, master land record updates.",
  },
  RDO: {
    code: "RDO",
    level: 5,
    title: "Revenue Divisional Officer",
    shortTitle: "RDO",
    description: "Appeals, high-severity conflicts, GIS locking.",
  },
  DISTRICT_COLLECTOR: {
    code: "DISTRICT_COLLECTOR",
    level: 6,
    title: "District Collector",
    shortTitle: "Collector",
    description: "Full admin — system settings, audit logs, executive dashboard.",
  },
};

export function roleLevel(role: OfficerRole): number {
  return ROLE_META[role].level;
}

// ---------------------------------------------------------------------------
// Session model
// ---------------------------------------------------------------------------

export type OfficerSession = {
  employeeId: string;
  name: string;
  role: OfficerRole;
  district: string;
  taluk?: string;
  village?: string;
};

export function jurisdictionLabel(session: OfficerSession): string {
  return [session.district, session.taluk, session.village]
    .filter(Boolean)
    .join(" / ");
}

export const SESSION_COOKIE = "terralens_session";

export const PUBLIC_PATHS = ["/login", "/forgot-password"] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

// ---------------------------------------------------------------------------
// Demo officer directory — one account per hierarchy level, for testing
// role gates end-to-end. All demo accounts share one mock password.
// ---------------------------------------------------------------------------

/** Mock credential only. Not a real identity provider. */
export const DEMO_PASSWORD = "TerraLens@2026";

export const DEMO_OFFICERS: OfficerSession[] = [
  {
    employeeId: "VAO-101",
    name: "M. Karthik",
    role: "VAO",
    district: "Mayiladuthurai",
    taluk: "Sirkazhi",
    village: "Sirkazhi",
  },
  {
    employeeId: "RI-204",
    name: "S. Lakshmi",
    role: "RI",
    district: "Mayiladuthurai",
    taluk: "Sirkazhi",
  },
  {
    employeeId: "DT-301",
    name: "P. Elango",
    role: "DEPUTY_TAHSILDAR",
    district: "Mayiladuthurai",
    taluk: "Sirkazhi",
  },
  {
    employeeId: "TAHSILDAR-401",
    name: "R. Venkatesh",
    role: "TAHSILDAR",
    district: "Mayiladuthurai",
    taluk: "Sirkazhi",
  },
  {
    employeeId: "RDO-501",
    name: "A. Bhuvaneswari",
    role: "RDO",
    district: "Mayiladuthurai",
  },
  {
    employeeId: "COLLECTOR-001",
    name: "N. Subramaniam",
    role: "DISTRICT_COLLECTOR",
    district: "Mayiladuthurai",
  },
];

/** Default demo officer for anything that still wants a single session to seed with. */
export const DEMO_OFFICER: OfficerSession = DEMO_OFFICERS[3];

export function authenticateOfficer(
  employeeId: string,
  password: string,
): OfficerSession | null {
  if (password !== DEMO_PASSWORD) return null;
  const id = employeeId.trim().toUpperCase();
  const officer = DEMO_OFFICERS.find((item) => item.employeeId === id);
  return officer ? { ...officer } : null;
}

export function serializeSession(session: OfficerSession): string {
  return encodeURIComponent(JSON.stringify(session));
}

export function parseSession(raw: string | undefined | null): OfficerSession | null {
  if (!raw) return null;
  try {
    let text = raw;
    try {
      JSON.parse(text);
    } catch {
      text = decodeURIComponent(raw);
    }
    const parsed = JSON.parse(text) as OfficerSession;
    if (
      typeof parsed.employeeId !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.district !== "string" ||
      !OFFICER_ROLES.includes(parsed.role)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readSessionCookie(): OfficerSession | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${SESSION_COOKIE}=`));
  return parseSession(match?.slice(SESSION_COOKIE.length + 1));
}

export function writeSessionCookie(session: OfficerSession, remember: boolean) {
  const parts = [
    `${SESSION_COOKIE}=${serializeSession(session)}`,
    "Path=/",
    "SameSite=Lax",
  ];
  if (remember) {
    parts.push(`Max-Age=${60 * 60 * 24 * 14}`);
  }
  document.cookie = parts.join("; ");
}

export function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

// ---------------------------------------------------------------------------
// Role-based module access — cumulative by hierarchy level
// ---------------------------------------------------------------------------

/**
 * Minimum officer level required to open each route. Access is cumulative:
 * an officer may open any route whose minLevel is <= their own level, so
 * senior roles (Tahsildar, RDO, District Collector) retain visibility into
 * everything their subordinates handle, matching "hide/disable modules that
 * exceed the logged-in officer's permission level." `/audit-logs` and
 * `/settings` are pinned to level 6 (District Collector) exactly — since
 * nobody outranks level 6, this is equivalent to "District Collector only"
 * without needing a special case.
 */
export const ROUTE_ACCESS: { path: string; minLevel: number }[] = [
  { path: "/", minLevel: 1 },
  { path: "/documents", minLevel: 1 },
  { path: "/classification", minLevel: 1 },
  { path: "/preprocessing", minLevel: 2 },
  { path: "/ocr", minLevel: 2 },
  { path: "/validation", minLevel: 2 },
  { path: "/structured-record", minLevel: 2 },
  { path: "/conflicts", minLevel: 3 },
  { path: "/verification", minLevel: 4 },
  { path: "/land-records", minLevel: 4 },
  { path: "/gis-map", minLevel: 5 },
  { path: "/audit-logs", minLevel: 6 },
  { path: "/settings", minLevel: 6 },
  { path: "/demo", minLevel: 1 },
];

/** Unknown / future routes are locked to District Collector by default. */
const DEFAULT_MIN_LEVEL = 6;

export function routeMinLevel(pathname: string): number {
  const match = ROUTE_ACCESS.find(
    (entry) =>
      pathname === entry.path ||
      (entry.path !== "/" && pathname.startsWith(`${entry.path}/`)),
  );
  return match ? match.minLevel : DEFAULT_MIN_LEVEL;
}

export function canAccessRoute(role: OfficerRole, pathname: string): boolean {
  if (isPublicPath(pathname)) return true;
  return roleLevel(role) >= routeMinLevel(pathname);
}

/** Highest-priority route an officer can land on — used to redirect away from a forbidden URL. */
export function landingRouteFor(role: OfficerRole): string {
  const level = roleLevel(role);
  const accessible = ROUTE_ACCESS.filter((entry) => entry.minLevel <= level);
  const own = accessible.find(
    (entry) => entry.minLevel === level && entry.path !== "/",
  );
  return own?.path ?? "/";
}

// ---------------------------------------------------------------------------
// Action-level gates (buttons, not just whole routes)
// ---------------------------------------------------------------------------

/** Approve / Commit to Master DB on the Verification workspace — Tahsildar and above. */
export function canApproveMasterRecord(role: OfficerRole): boolean {
  return roleLevel(role) >= ROLE_META.TAHSILDAR.level;
}

/** Revert Version (Audit Logs) and system configuration changes (Settings) — District Collector only. */
export function canRevertOrConfigure(role: OfficerRole): boolean {
  return role === "DISTRICT_COLLECTOR";
}
