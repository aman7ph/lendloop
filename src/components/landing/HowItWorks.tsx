import { PackagePlus, CalendarCheck, Star } from "lucide-react";

const STEPS = [
  {
    icon: PackagePlus,
    title: "List a tool",
    text: "Add what you're happy to lend, with photos and how long it can go out for.",
  },
  {
    icon: CalendarCheck,
    title: "Request and approve",
    text: "Neighbors ask for dates. You approve or decline, and overlapping dates are handled for you.",
  },
  {
    icon: Star,
    title: "Return and review",
    text: "Mark it returned, then leave a rating so the community knows who to trust.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h2 className="mb-6 text-2xl font-semibold">How it works</h2>
      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="rounded-3xl bg-surface p-6 shadow-sm">
            <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <Icon size={22} />
            </span>
            <p className="font-semibold">
              {i + 1}. {title}
            </p>
            <p className="mt-1 text-sm text-muted">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
