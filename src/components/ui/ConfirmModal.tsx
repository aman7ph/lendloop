"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { friendlyError } from "@/lib/errors";

type Props = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
};

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: Props) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-muted">{message}</p>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-accent-soft p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={confirm}
          disabled={busy}
          className="flex-1"
        >
          {busy ? "Working..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
