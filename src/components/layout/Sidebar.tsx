"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { visibleNav } from "./nav";

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-56 shrink-0 md:block">
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-muted">
        Your neighborhood
      </p>
      <nav className="flex flex-col gap-1">
        {visibleNav(isAdmin).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-brand-soft text-brand"
                  : "text-muted hover:bg-brand-soft/60"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
