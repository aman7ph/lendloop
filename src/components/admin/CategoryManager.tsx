"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { friendlyError } from "@/lib/errors";

export function CategoryManager() {
  const categories = useQuery(api.categories.list) ?? [];
  const create = useMutation(api.categories.create);
  const remove = useMutation(api.categories.remove);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function run(fn: () => Promise<unknown>) {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e));
    }
  }

  const add = () =>
    run(async () => {
      await create({ name });
      setName("");
    });

  return (
    <section>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New category, e.g. garage"
          aria-label="New category"
          className={inputClass}
        />
        <Button onClick={add} disabled={!name.trim()}>
          Add
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-accent-soft p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <ul className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <li
            key={c}
            className="flex items-center gap-1 rounded-full bg-surface py-1.5 pl-4 pr-2 shadow-sm"
          >
            <span className="capitalize">{c}</span>
            <button
              aria-label={`Delete ${c}`}
              onClick={() => run(() => remove({ name: c }))}
              className="rounded-full p-1 text-muted hover:bg-accent-soft hover:text-danger"
            >
              <X size={16} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
