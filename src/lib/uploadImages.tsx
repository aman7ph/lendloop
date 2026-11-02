import { Id } from "../../convex/_generated/dataModel";

export type PickerImage = {
  key: string;
  url: string;
  storageId?: Id<"_storage">;
  file?: File;
};

export async function uploadImages(
  images: PickerImage[],
  getUploadUrl: () => Promise<string>,
): Promise<Id<"_storage">[]> {
  const ids: Id<"_storage">[] = [];
  for (const img of images) {
    if (img.storageId) {
      ids.push(img.storageId);
      continue;
    }
    const res = await fetch(await getUploadUrl(), {
      method: "POST",
      headers: { "Content-Type": img.file!.type },
      body: img.file,
    });
    if (!res.ok) throw new Error("Error: UPLOAD_FAILED");
    const { storageId } = await res.json();
    ids.push(storageId as Id<"_storage">);
  }
  return ids;
}
