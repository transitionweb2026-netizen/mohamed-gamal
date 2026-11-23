import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionState } from "@/lib/cms/admin/session";
import { BUCKET_RULES, mimeOf, STORAGE_PATH_PATTERN } from "@/lib/cms/media-rules";
import type { MediaBucket } from "@/lib/cms/types";

/**
 * DEVELOPMENT ONLY (local CMS mode): stores an uploaded file under
 * public/uploads/<bucket>/<path>, standing in for Supabase Storage. Refused
 * in every other mode — with Supabase, the browser uploads to Storage directly.
 */
export async function POST(request: NextRequest) {
  const state = await getSessionState();
  if (state.status !== "admin" || state.session.mode !== "local") return NextResponse.json({ error: "Not available." }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  const bucket = String(form.get("bucket") ?? "") as MediaBucket;
  const path = String(form.get("path") ?? "");
  const rule = BUCKET_RULES[bucket];
  if (!(file instanceof File) || !rule || !STORAGE_PATH_PATTERN.test(path)) return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  if (!rule.mimeTypes.includes(mimeOf(file)) || file.size > rule.maxBytes) return NextResponse.json({ error: "This file is not accepted." }, { status: 400 });

  const target = join(process.cwd(), "public", "uploads", bucket, ...path.split("/"));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ ok: true });
}
