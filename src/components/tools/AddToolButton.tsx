"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ToolFormModal } from "./ToolFormModal";

export function AddToolButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        aria-label="Add a tool"
        onClick={() => setOpen(true)}
        className="flex size-10 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-hover"
      >
        <Plus size={20} />
      </button>
      {open && <ToolFormModal onClose={() => setOpen(false)} />}
    </>
  );
}
