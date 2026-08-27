"use client";

import { usePathname, useRouter } from "next/navigation";
import { getNavItem } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-store";

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const current = getNavItem(pathname);
  const { session, logout } = useAuth();

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
        {session ? (
          <span className="rounded-sm border border-tl-gold/30 bg-tl-gold/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-tl-gold">
            {session.role}
          </span>
        ) : null}
        {session ? (
          <div className="ml-1 hidden h-8 items-center border-l border-tl-border pl-4 md:flex">
            <div className="text-right">
              <p className="text-[12px] font-medium text-tl-text">
                {session.name}
              </p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-tl-muted">
                {session.employeeId}
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
