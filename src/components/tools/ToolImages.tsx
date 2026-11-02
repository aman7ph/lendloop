import { categoryStyle } from "@/lib/categoryStyle";

export function ToolImages({
  urls,
  category,
  name,
}: {
  urls: string[];
  category: string;
  name: string;
}) {
  const { tint, Icon } = categoryStyle(category);
  const slots = urls.length > 0 ? urls : [null];
  return (
    <div
      className={`grid gap-2 rounded-3xl p-2 ${tint}`}
      style={{ gridTemplateColumns: `repeat(${slots.length}, 1fr)` }}
    >
      {slots.map((url, i) => (
        <div
          key={i}
          className={`flex items-center justify-center overflow-hidden rounded-2xl bg-white/50 ${slots.length === 1 ? "aspect-[16/9]" : "aspect-square"}`}
        >
          {url ? (
            <img
              src={url}
              alt={`${name} photo ${i + 1}`}
              className="size-full object-cover"
            />
          ) : (
            <Icon size={28} className="text-muted/60" />
          )}
        </div>
      ))}
    </div>
  );
}
