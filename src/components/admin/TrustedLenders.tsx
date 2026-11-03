"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ShieldCheck } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { friendlyError } from "@/lib/errors";

export function TrustedLenders() {
  const users = useQuery(api.users.listForAdmin);
  const setTrusted = useMutation(api.users.setTrusted);
  const [error, setError] = useState("");

  if (users === undefined) return <Spinner />;

  return (
    <>
      {error && (
        <p
          role="alert"
          className="mb-3 rounded-xl bg-accent-soft p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <ul className="grid gap-3">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex items-center gap-3 rounded-3xl bg-surface p-3 shadow-sm"
          >
            <Avatar name={u.name} imageUrl={u.imageUrl} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{u.name}</p>
              <div className="flex gap-2">
                {u.role === "admin" && <Badge>Admin</Badge>}
                {u.trustedLender && (
                  <Badge tone="success">
                    <ShieldCheck size={12} /> Trusted
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant={u.trustedLender ? "outline" : "primary"}
              onClick={async () => {
                setError("");
                try {
                  await setTrusted({ userId: u.id, trusted: !u.trustedLender });
                } catch (e) {
                  setError(friendlyError(e));
                }
              }}
            >
              {u.trustedLender ? "Remove badge" : "Mark trusted"}
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}
