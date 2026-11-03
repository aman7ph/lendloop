"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs } from "@/components/ui/Tabs";
import { AllListings } from "@/components/admin/AllListings";
import { AllLoans } from "@/components/admin/AllLoans";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { TrustedLenders } from "@/components/admin/TrustedLenders";

export default function AdminPage() {
  const me = useQuery(api.users.me);
  const [tab, setTab] = useState("categories");

  if (me === undefined || me === null) return <Spinner />;
  if (me.role !== "admin")
    return <EmptyState text="This page is for admins only." />;

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        Admin
      </h1>
      <p className="mb-6 mt-1 text-muted">
        Moderate listings, loans and members.
      </p>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "categories", label: "Categories" },
          { id: "loans", label: "All loans" },
          { id: "members", label: "Members" },
          { id: "listings", label: "Listings" },
        ]}
      />

      <div className="mt-6">
        {tab === "categories" && <CategoryManager />}
        {tab === "loans" && <AllLoans />}
        {tab === "members" && <TrustedLenders />}
        {tab === "listings" && <AllListings />}
      </div>
    </div>
  );
}
