"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { friendlyError } from "@/lib/errors";
import { PickerImage, uploadImages } from "@/lib/uploadImages";
import { ImagePicker } from "./ImagePicker";
import { MyTool } from "./types";

const CONDITIONS = ["Like new", "Good", "Fair", "Worn"];

type Props = { tool?: MyTool; onClose: () => void };

export function ToolFormModal({ tool, onClose }: Props) {
  const categories = useQuery(api.categories.list) ?? [];
  const create = useMutation(api.tools.create);
  const update = useMutation(api.tools.update);
  const getUploadUrl = useMutation(api.tools.generateUploadUrl);

  const [name, setName] = useState(tool?.name ?? "");
  const [category, setCategory] = useState(tool?.category ?? "");
  const [condition, setCondition] = useState(tool?.condition ?? "Good");
  const [description, setDescription] = useState(tool?.description ?? "");
  const [maxDays, setMaxDays] = useState(String(tool?.maxLoanDays ?? 14));
  const [images, setImages] = useState<PickerImage[]>(
    (tool?.imageIds ?? []).flatMap((id, i) =>
      tool?.imageUrls[i]
        ? [{ key: id, url: tool.imageUrls[i], storageId: id }]
        : [],
    ),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const chosenCategory = category || categories[0] || "";

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const imageIds = await uploadImages(images, getUploadUrl);
      const fields = {
        name,
        category: chosenCategory,
        condition,
        description,
        maxLoanDays: Number(maxDays),
        imageIds,
      };
      if (tool) await update({ toolId: tool.id, ...fields });
      else await create(fields);
      onClose();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={tool ? "Edit tool" : "Add a tool"}
      eyebrow="Share with neighbors"
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <Field label="Tool name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="e.g. Cordless drill"
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select
              value={chosenCategory}
              onChange={(e) => setCategory(e.target.value)}
              className={`${inputClass} capitalize`}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Condition">
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className={inputClass}
            >
              {CONDITIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Short description" hint="(optional)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="What should a neighbor know before borrowing it?"
            className="w-full rounded-2xl border border-line bg-surface p-3 outline-none focus:border-brand"
          />
        </Field>

        <Field label="Longest loan" hint="(days, up to 60)">
          <input
            type="number"
            min={1}
            max={60}
            value={maxDays}
            onChange={(e) => setMaxDays(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Photos" hint="(up to 3)">
          <ImagePicker
            images={images}
            onChange={setImages}
            onError={setError}
          />
        </Field>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-accent-soft p-3 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy} className="flex-1">
            {busy ? "Saving..." : tool ? "Save changes" : "Add tool"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
