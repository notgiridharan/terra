export const OFFICER_ROLES = [
  "Officer",
  "Senior Officer",
  "Administrator",
] as const;

export type OfficerRole = (typeof OFFICER_ROLES)[number];

export type OfficerSession = {
  employeeId: string;
  name: string;
  role: OfficerRole;
  office: string;
};

export const SESSION_COOKIE = "terralens_session";

export const PUBLIC_PATHS = ["/login", "/forgot-password"] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export const DEMO_OFFICER: OfficerSession = {
  employeeId: "RO-4821",
  name: "R. Venkatesh",
  role: "Officer",
  office: "District Survey Office, Sirkazhi",
};

/** Mock credential only. Not a real identity provider. */
export const DEMO_PASSWORD = "TerraLens@2026";

export function authenticateOfficer(
  employeeId: string,
  password: string,
): OfficerSession | null {
  const id = employeeId.trim().toUpperCase();
  if (id === DEMO_OFFICER.employeeId && password === DEMO_PASSWORD) {
    return { ...DEMO_OFFICER };
  }
  return null;
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
      typeof parsed.office !== "string" ||
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
