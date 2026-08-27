"use client";

import { usePathname, useRouter } from "next/navigation";
import { getNavItem } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-store";
import { jurisdictionLabel, ROLE_META } from "@/lib/auth";

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const current = getNavItem(pathname);
  const { session, logout } = useAuth();
  const meta = session ? ROLE_META[session.role] : null;

  function onLogout() {
    logout();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-tl-border bg-tl-panel px-6">
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Module
        </p>
        <h1 className="truncate text-[15px] font-semibold text-tl-text">
          {current.label}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden rounded-sm border border-tl-border bg-tl-sidebar px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-tl-muted sm:inline">
          Restricted system
        </span>

        {session && meta ? (
          <div className="hidden items-center gap-2 md:flex">
            <span
              title={meta.description}
              className="rounded-sm border border-tl-gold/30 bg-tl-gold/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-tl-gold"
            >
              {meta.title}
            </span>
            <span className="rounded-sm border border-tl-border bg-tl-sidebar px-2 py-1 text-[10px] font-semibold tabular-nums text-tl-text">
              L{meta.level}
            </span>
          </div>
        ) : null}

        {session ? (
          <div className="ml-1 hidden h-8 items-center border-l border-tl-border pl-4 lg:flex">
            <div className="text-right">
              <p className="text-[12px] font-medium text-tl-text">
                {session.name}
              </p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-tl-muted">
                {session.employeeId} · {jurisdictionLabel(session)}
              </p>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onLogout}
          className="border border-tl-border px-2.5 py-1 text-[11px] text-tl-muted hover:border-tl-gold/40 hover:text-tl-text"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
