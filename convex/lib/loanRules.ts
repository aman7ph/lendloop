export const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_MAX_LOAN_DAYS = 14;
export const MAX_ALLOWED_LOAN_DAYS = 60;
export const START_GRACE_MS = 5 * 60 * 1000;

export function overlaps(
  a: { startDate: number; endDate: number },
  b: { startDate: number; endDate: number },
) {
  return a.startDate < b.endDate && b.startDate < a.endDate;
}
