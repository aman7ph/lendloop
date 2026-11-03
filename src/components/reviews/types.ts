import { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";

export type Profile = NonNullable<
  FunctionReturnType<typeof api.reviews.profile>
>;
export type GivenReview = FunctionReturnType<typeof api.reviews.given>[number];
