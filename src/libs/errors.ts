import { ConvexError } from "convex/values";

const MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: "Please sign in again.",
  FORBIDDEN: "You're not allowed to do that.",
  NOT_FOUND: "That item no longer exists.",
  INVALID_NAME: "Name must be 2 to 80 characters.",
  INVALID_CONDITION: "Condition must be 2 to 60 characters.",
  INVALID_DESCRIPTION: "Description can be at most 500 characters.",
  INVALID_CATEGORY: "Please choose a valid category.",
  INVALID_MAX_LOAN_DAYS: "Maximum loan length must be 1 to 60 days.",
  TOO_MANY_IMAGES: "You can add up to 3 photos.",
  DUPLICATE_IMAGE: "That photo was added twice.",
  INVALID_IMAGE: "One of the photos could not be used.",
  INVALID_IMAGE_TYPE: "Photos must be JPG, PNG or WebP.",
  IMAGE_TOO_LARGE: "Each photo must be under 5 MB.",
  TOOL_HAS_ACTIVE_LOAN: "This tool has an active or pending loan.",
  CATEGORY_IN_USE: "Tools still use this category.",
  CANNOT_BORROW_OWN_TOOL: "You can't borrow your own tool.",
  START_IN_PAST: "Pick-up can't be in the past.",
  END_MUST_BE_AFTER_START: "Return must be after pick-up.",
  EXCEEDS_MAX_LOAN_LENGTH: "That's longer than the owner allows.",
  DATES_UNAVAILABLE: "Those dates are already taken.",
  ALREADY_REQUESTED: "You already have a pending request for this tool.",
  INVALID_DATES: "Please enter valid dates.",
  INVALID_STATUS: "This request has already been handled.",
  REQUEST_EXPIRED: "This request has expired.",
  LOAN_NOT_COMPLETED: "You can review once the tool is returned.",
  INVALID_RATING: "Choose a rating from 1 to 5.",
  INVALID_COMMENT: "Comments can be at most 500 characters.",
  ALREADY_REVIEWED: "You already reviewed this loan.",
};

export function errorCode(e: unknown): string {
  if (e instanceof ConvexError) return String(e.data);
  const m = e instanceof Error ? e.message : String(e);
  return m.match(/Error:\s*([A-Z_]{4,})/)?.[1] ?? "UNKNOWN";
}

export function friendlyError(e: unknown): string {
  return MESSAGES[errorCode(e)] ?? "Something went wrong. Please try again.";
}
