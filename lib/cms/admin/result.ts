import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { DbFailure } from "./db";
import type { FieldError } from "@/lib/cms/fields";

export type { ActionResult } from "./result-types";
import type { ActionResult } from "./result-types";

/** Thrown for problems the editor can fix; the message is shown as is. */
export class UserError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: FieldError[],
  ) {
    super(message);
  }
}

// Messages raised by our own database functions are written for editors.
const OWN_MESSAGES = [
  "The CMS must keep at least one owner.",
  "Only owners can manage administrators.",
  "This file is still used on the website. Remove it from those places first.",
  "There is no draft to publish, or this account may not publish it.",
  "This list cannot be reordered.",
  "Only administrators can reorder content.",
];

export function friendlyError(error: unknown): string {
  if (error instanceof UserError) return error.message;
  if (error instanceof DbFailure) {
    const { code, message } = error.error;
    if (OWN_MESSAGES.includes(message) || message.startsWith("No Supabase Auth user with this email")) return message;
    switch (code) {
      case "23505":
        return "Another item already uses this identifier. Choose a different one.";
      case "23503":
        return "This item is still used elsewhere on the website, so it cannot be removed.";
      case "23514":
      case "22001":
      case "22P02":
        return "A value is not in the accepted format. Check the highlighted fields and try again.";
      case "42501":
        return "Your account is not allowed to make this change.";
      case "PGRST301":
      case "PGRST303":
        return "Your session has expired. Please sign in again.";
    }
    console.error("[cms] database error", error.error);
    return "The change could not be saved because of a database error. Please try again.";
  }
  console.error("[cms] unexpected error", error);
  return "Something went wrong. Please try again.";
}

/** Runs a Server Action body and turns failures into a result the form can show. */
export async function run<T>(fn: () => Promise<T>, message?: string): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data, message };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: friendlyError(error), fieldErrors: error instanceof UserError ? error.fieldErrors : undefined };
  }
}

/** Rebuilds the public website pages after published content changed. */
export function revalidateSite() {
  revalidatePath("/[lang]", "layout");
}
