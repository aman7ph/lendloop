"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");

  if (isLoading) return { status: "loading" as const };
  if (!isAuthenticated) return { status: "signedOut" as const };
  if (!me) return { status: "settingUp" as const };
  return { status: "ready" as const, me };
}
