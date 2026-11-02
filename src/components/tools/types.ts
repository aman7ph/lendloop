import { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";

export type Tool = FunctionReturnType<typeof api.tools.list>[number];
