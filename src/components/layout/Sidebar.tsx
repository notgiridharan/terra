"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navigation";
import { NAV_ICONS } from "@/components/layout/NavIcons";
import { useAuth } from "@/lib/auth-store";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { session } = useAuth();

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
        <p className="text-[11px] text-tl-muted">{session?.role}</p>
        <p className="text-[11px] text-tl-muted">{session?.office}</p>
      </div>
    </aside>
  );
}
