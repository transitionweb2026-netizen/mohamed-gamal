import "server-only";
import { cookies } from "next/headers";
import { listMedia } from "./repo";
import type { AdminSession } from "./session";

/** What every editing page needs besides its own data: the media library and the storage mode. */
export async function editorBasics(session: AdminSession) {
  return { media: await listMedia(session), mode: session.mode };
}

/** The content language chosen in the top bar (titles in lists, previews). */
export async function adminLang(): Promise<"ar" | "en"> {
  return (await cookies()).get("cms_admin_lang")?.value === "ar" ? "ar" : "en";
}
