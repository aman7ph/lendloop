"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { visibleNav } from "./nav";

export function MobileTabBar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      {visibleNav(isAdmin).map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
              active ? "text-brand" : "text-muted"
            }`}
          >
            <Icon size={20} />
            {label.replace(" tools", "")}
          </Link>
        );
      })}
    </nav>
  );
}
