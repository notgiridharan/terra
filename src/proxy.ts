import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  canAccessRoute,
  isPublicPath,
  landingRouteFor,
  parseSession,
  SESSION_COOKIE,
} from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = parseSession(request.cookies.get(SESSION_COOKIE)?.value);
  const publicPath = isPublicPath(pathname);

  if (!session && !publicPath) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  if (session && publicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (session && !publicPath && !canAccessRoute(session.role, pathname)) {
    const redirectTo = request.nextUrl.clone();
    redirectTo.pathname = landingRouteFor(session.role);
    redirectTo.search = "";
    redirectTo.searchParams.set("access_denied", pathname);
    return NextResponse.redirect(redirectTo);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
