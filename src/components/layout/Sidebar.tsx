"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navigation";
import { NAV_ICONS } from "@/components/layout/NavIcons";
import { useAuth } from "@/lib/auth-store";
import { canAccessRoute, jurisdictionLabel, ROLE_META } from "@/lib/auth";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { session } = useAuth();
  const role = session?.role ?? "VAO";
  const meta = ROLE_META[role];

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-tl-border bg-tl-sidebar">
      <div className="px-4 pb-2 pt-5">
        <p className="px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
          Operations
        </p>
      </div>


      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Primary">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = NAV_ICONS[item.href];
            const allowed = canAccessRoute(role, item.href);

            if (!allowed) {
              return (
                <li key={item.href}>
                  <div
                    title="Restricted — role upgrade required"
                    aria-disabled="true"
                    className="flex cursor-not-allowed items-center gap-3 rounded-sm border-l-2 border-transparent px-3 py-2 text-[13px] text-tl-muted/40"
                  >
                    {Icon ? (
                      <Icon className="h-4 w-4 shrink-0" />
                    ) : (
                      <span className="h-4 w-4 shrink-0" />
                    )}
                    <span className="flex-1 truncate">{item.label}</span>
                    <LockIcon className="h-3.5 w-3.5 shrink-0" />
                  </div>
                  <p className="px-3 pb-1 text-[10px] leading-tight text-tl-muted/50">
                    Restricted — role upgrade required
                  </p>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-sm border-l-2 px-3 py-2 text-[13px] transition-colors ${
                    active
                      ? "border-tl-gold bg-tl-gold/10 text-tl-text"
                      : "border-transparent text-tl-muted hover:bg-white/[0.04] hover:text-tl-text"
                  }`}
                >
                  {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-tl-border px-4 py-4">
        <p className="text-[10px] uppercase tracking-[0.16em] text-tl-muted">
          Authorized session
        </p>
        <p className="mt-1 text-[13px] text-tl-text">
          {session?.name ?? "—"}
        </p>
        <p className="text-[11px] text-tl-muted">
          {meta.title}{" "}
          <span className="text-tl-gold">· L{meta.level}</span>
        </p>
        <p className="text-[11px] text-tl-muted">
          {session ? jurisdictionLabel(session) : "—"}
        </p>
      </div>
    </aside>
  );
}
