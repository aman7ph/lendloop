"use client";

import { SignInButton } from "@clerk/nextjs";
import { HandHelping } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-12 pt-16 text-center md:pt-24">
      <span className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-brand text-white">
        <HandHelping size={28} />
      </span>
      <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
        Borrow what you need.
        <br />
        Lend what you don&apos;t<span className="text-accent">.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
        LendLoop is a neighborhood tool-lending board. Share the drill that sits
        in your garage, and borrow the ladder you only need once a year.
      </p>
      <div className="mt-8 flex justify-center">
        <SignInButton mode="modal" forceRedirectUrl="/browse">
          <Button className="h-12 px-8 text-base">
            Sign in to lend or borrow
          </Button>
        </SignInButton>
      </div>
    </section>
  );
}
