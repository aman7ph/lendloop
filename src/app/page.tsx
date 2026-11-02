"use client";

import { useConvexAuth } from "convex/react";
import { SignInButton, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me);

  return (
    <main style={{ padding: 24 }}>
      <span>
        {me === undefined
          ? "loading..."
          : me === null
            ? "none"
            : `${me.name} (${me.role})`}
      </span>
      <p>
        My profile: Convex sees you as:
        {isLoading
          ? "loading..."
          : isAuthenticated
            ? "SIGNED IN"
            : "signed out"}
      </p>
      {isAuthenticated ? <SignOutButton /> : <SignInButton />}
    </main>
  );
}
