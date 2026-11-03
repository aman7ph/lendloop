const pad = (n: number) => String(n).padStart(2, "0");

export function toInputValue(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const fromInputValue = (value: string) => new Date(value).getTime();

const fmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const formatRange = (start: number, end: number) =>
  `${fmt.format(start)} – ${fmt.format(end)}`;

const dayFmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});
export const formatDay = (ms: number) => dayFmt.format(ms);
