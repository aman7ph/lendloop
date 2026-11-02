import {
  Wrench,
  Leaf,
  UtensilsCrossed,
  Tent,
  Sparkles,
  Package,
  LucideIcon,
} from "lucide-react";

const TINTS = [
  "bg-tint-mint",
  "bg-tint-peach",
  "bg-tint-lilac",
  "bg-tint-butter",
  "bg-tint-sky",
];
const ICONS: Record<string, LucideIcon> = {
  "power tools": Wrench,
  garden: Leaf,
  kitchen: UtensilsCrossed,
  camping: Tent,
  cleaning: Sparkles,
};

export function categoryStyle(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { tint: TINTS[h % TINTS.length], Icon: ICONS[name] ?? Package };
}
