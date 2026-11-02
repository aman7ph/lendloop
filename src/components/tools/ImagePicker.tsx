"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { PickerImage } from "@/lib/uploadImages";

export const MAX_IMAGES = 3;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  images: PickerImage[];
  onChange: (images: PickerImage[]) => void;
  onError: (message: string) => void;
};

export function ImagePicker({ images, onChange, onError }: Props) {
  const input = useRef<HTMLInputElement>(null);

  function add(files: FileList | null) {
    if (!files) return;
    const next = [...images];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_IMAGES) {
        onError("You can add up to 3 photos.");
        break;
      }
      if (!ALLOWED.includes(file.type)) {
        onError("Photos must be JPG, PNG or WebP.");
        continue;
      }
      if (file.size > MAX_BYTES) {
        onError("Each photo must be under 5 MB.");
        continue;
      }
      next.push({
        key: `${file.name}-${file.size}-${next.length}`,
        url: URL.createObjectURL(file),
        file,
      });
    }
    onChange(next);
    if (input.current) input.current.value = "";
  }

  function remove(img: PickerImage) {
    if (img.file) URL.revokeObjectURL(img.url);
    onChange(images.filter((i) => i.key !== img.key));
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((img) => (
        <div
          key={img.key}
          className="relative aspect-square overflow-hidden rounded-2xl bg-brand-soft"
        >
          <img
            src={img.url}
            alt="Tool photo"
            className="size-full object-cover"
          />
          <button
            type="button"
            aria-label="Remove photo"
            onClick={() => remove(img)}
            className="absolute right-1.5 top-1.5 rounded-full bg-ink/70 p-1 text-white"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      {images.length < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-brand/40 text-sm text-brand hover:bg-brand-soft"
        >
          <ImagePlus size={22} /> Add
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => add(e.target.files)}
      />
    </div>
  );
}
