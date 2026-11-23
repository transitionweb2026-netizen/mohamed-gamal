/**
 * Checks a connected Supabase project from the outside, exactly as a visitor
 * sees it (publishable key only — no secret keys):
 *   - the website content can be read (cms_snapshot);
 *   - drafts, the activity log and administrators are NOT readable;
 *   - content cannot be written without signing in;
 *   - the storage buckets exist;
 *   - public sign-ups are disabled (no public registration).
 *
 * Usage:  npm run cms:verify          (reads .env.local)
 */
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local first.");
  process.exit(1);
}

const headers = { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" };
const results: { check: string; pass: boolean; detail: string }[] = [];
const check = async (name: string, fn: () => Promise<[boolean, string]>) => {
  try {
    const [pass, detail] = await fn();
    results.push({ check: name, pass, detail });
  } catch (error) {
    results.push({ check: name, pass: false, detail: (error as Error).message });
  }
};

await check("Website content is readable", async () => {
  const res = await fetch(`${url}/rest/v1/rpc/cms_snapshot`, { method: "POST", headers, body: JSON.stringify({ p_preview: false }) });
  const data = (await res.json()) as { settings?: unknown; pages?: unknown[]; sections?: unknown[]; preview?: boolean };
  return [res.ok && !!data.settings && (data.pages?.length ?? 0) >= 6 && data.preview === false, res.ok ? `${data.pages?.length ?? 0} pages, ${data.sections?.length ?? 0} visible sections` : JSON.stringify(data)];
});

for (const table of ["section_drafts", "activity_logs", "admins"]) {
  await check(`Visitors cannot read ${table}`, async () => {
    const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, { headers });
    const body = await res.text();
    return [!res.ok || body.trim() === "[]", res.ok ? "no rows visible" : `refused (${res.status})`];
  });
}

await check("Visitors cannot write content", async () => {
  const res = await fetch(`${url}/rest/v1/faqs`, { method: "POST", headers, body: JSON.stringify({ group_key: "home", question_en: "probe" }) });
  return [!res.ok, `refused (${res.status})`];
});

await check("Visitors cannot preview drafts", async () => {
  const res = await fetch(`${url}/rest/v1/rpc/cms_snapshot`, { method: "POST", headers, body: JSON.stringify({ p_preview: true }) });
  const data = (await res.json()) as { preview?: boolean };
  return [data.preview === false, "preview ignored for visitors"];
});

for (const bucket of ["images", "videos", "documents"]) {
  await check(`Storage bucket "${bucket}" exists`, async () => {
    const res = await fetch(`${url}/storage/v1/object/public/${bucket}/__cms_probe__`);
    const body = await res.text();
    return [!/bucket not found/i.test(body), /bucket not found/i.test(body) ? "missing — run the storage migration" : "present"];
  });
}

await check("Public sign-ups are disabled", async () => {
  const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
  const data = (await res.json()) as { disable_signup?: boolean };
  return [data.disable_signup === true, data.disable_signup ? "disabled" : "ENABLED — turn off Authentication → Sign In / Providers → Allow new users to sign up"];
});

const width = Math.max(...results.map((r) => r.check.length));
for (const r of results) console.log(`${r.pass ? "✓" : "✗"} ${r.check.padEnd(width)}  ${r.detail}`);
const failed = results.filter((r) => !r.pass).length;
console.log(failed ? `\n${failed} check(s) failed.` : "\nAll checks passed.");
process.exitCode = failed ? 1 : 0;
