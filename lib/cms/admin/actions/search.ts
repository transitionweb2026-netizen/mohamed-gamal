"use server";

import { searchContent } from "../repo";
import { requireAdmin } from "../session";
import { run } from "../result";
import type { ActionResult } from "../result-types";

export async function searchDashboard(query: string): Promise<ActionResult<{ title: string; subtitle: string; href: string }[]>> {
  return run(async () => searchContent(await requireAdmin(), typeof query === "string" ? query.slice(0, 80) : ""));
}
