import { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";

export type Loan = FunctionReturnType<typeof api.loans.myRequests>[number];
export type ReviewPrompt = FunctionReturnType<
  typeof api.reviews.reviewable
>[number];
