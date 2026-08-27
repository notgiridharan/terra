"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { ROLE_META, routeMinLevel } from "@/lib/auth";

/**
 * Surfaces the "access_denied" query param the proxy attaches when a direct
 * navigation to an unauthorized route gets redirected to the officer's
 * highest permitted landing page (see src/proxy.ts).
 */
export function AccessDeniedBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useAuth();
  const denied = searchParams.get("access_denied");

  if (!denied || !session) return null;

  const meta = ROLE_META[session.role];
  const requiredLevel = routeMinLevel(denied);

  function dismiss() {
    router.replace(pathname, { scroll: false });
  }

  return (
    <div
      role="alert"
      className="mb-4 flex items-start justify-between gap-3 border border-red-500/40 bg-red-500/10 px-4 py-3 text-[13px]"
    >
      <div>
        <p className="font-medium text-red-300">Access denied</p>
        <p className="mt-1 text-[12px] leading-5 text-red-200/90">
          <span className="font-mono">{denied}</span> requires clearance level
          L{requiredLevel} or above. Your session ({meta.title}, L{meta.level})
          does not have permission — you have been redirected to your highest
          permitted module.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 border border-red-500/40 px-2 py-1 text-[11px] uppercase tracking-[0.1em] text-red-200 hover:bg-red-500/20"
      >
        Dismiss
      </button>
    </div>
  );
}
