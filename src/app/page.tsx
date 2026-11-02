"use client";

import { useConvexAuth } from "convex/react";
import { SignInButton, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useMutation } from "convex/react";

export default function Home() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me);

  const create = useMutation(api.tools.create);
  const tools = useQuery(api.tools.list, me ? {} : "skip");
  const publicTools = useQuery(api.tools.listPublic);
  const categories = useQuery(api.categories.list);
  const addCategory = useMutation(api.categories.create);

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

      <button
        onClick={() =>
          create({
            name: "Cordless drill",
            category: "power tools",
            condition: "good",
            description: "18V, two batteries",
          })
        }
      >
        Add test tool
      </button>
      <pre>signed in: {JSON.stringify(tools, null, 2)}</pre>
      <pre>public: {JSON.stringify(publicTools, null, 2)}</pre>

      <pre>categories: {JSON.stringify(categories)}</pre>
      <button onClick={() => addCategory({ name: "  Garage  " })}>
        Add category (admin)
      </button>
    </main>
  );
}
