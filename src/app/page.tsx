"use client";

import { useConvexAuth } from "convex/react";
import { SignInButton, SignOutButton } from "@clerk/nextjs";

export default function Home() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  return (
    <main style={{ padding: 24 }}>
      <p>
        Convex sees you as:{" "}
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
