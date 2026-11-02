type Props = { name: string; imageUrl?: string | null; size?: number };

export function Avatar({ name, imageUrl, size = 36 }: Props) {
  const box = { width: size, height: size };
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        style={box}
        className="rounded-full object-cover"
      />
    );
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      style={{ ...box, fontSize: size * 0.36 }}
      className="inline-flex items-center justify-center rounded-full bg-accent-soft font-semibold text-ink"
    >
      {initials}
    </span>
  );
}
