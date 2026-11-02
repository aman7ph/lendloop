import { Compass, Package, Shield, LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export const NAV: NavItem[] = [
  { href: "/browse", label: "Browse tools", icon: Compass },
  { href: "/activity", label: "My activity", icon: Package },
  { href: "/admin", label: "Admin", icon: Shield, adminOnly: true },
];

export const visibleNav = (isAdmin: boolean) =>
  NAV.filter((n) => !n.adminOnly || isAdmin);
