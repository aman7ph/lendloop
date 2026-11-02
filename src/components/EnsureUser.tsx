"use client";

import { useEffect } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function EnsureUser() {
  const { isAuthenticated } = useConvexAuth();
  const store = useMutation(api.users.store);

  useEffect(() => {
    if (isAuthenticated) {
      store().catch((err) => console.error("Failed to store user", err));
    }
  }, [isAuthenticated, store]);

  return null;
}
