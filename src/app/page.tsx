import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PublicToolStrip } from "@/components/landing/PublicToolStrip";
import { RedirectIfSignedIn } from "@/components/landing/RedirectIfSignedIn";

export default function Home() {
  return (
    <main className="pb-16">
      <RedirectIfSignedIn />
      <Hero />
      <PublicToolStrip />
      <HowItWorks />
      <footer className="px-4 pt-8 text-center text-sm text-muted">
        LendLoop, a neighborhood tool-lending board.
      </footer>
    </main>
  );
}
