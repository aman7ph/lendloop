"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/libs/useCurrentUser";
import { Spinner } from "@/components/ui/Spinner";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { MobileTabBar } from "./MobileTabBar";

const WAITING = {
  loading: "Loading...",
  signedOut: "Redirecting...",
  settingUp: "Setting up your account...",
};

export function AppShell({ children }: { children: ReactNode }) {
  const state = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "signedOut") router.replace("/");
  }, [state.status, router]);

  if (state.status !== "ready") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner text={WAITING[state.status]} />
      </div>
    );
  }

  const isAdmin = state.me.role === "admin";
  return (
    <div className="min-h-dvh">
      <TopBar />
      <div className="mx-auto flex max-w-6xl gap-8 px-4 pb-28 pt-6 md:px-8 md:pb-10">
        <Sidebar isAdmin={isAdmin} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <MobileTabBar isAdmin={isAdmin} />
    </div>
  );
}
