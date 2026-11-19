import { createHash } from "node:crypto";

/**
 * Deterministic UUIDs (name-based, v5-style) for the bundled content, so the
 * bundled snapshot and the generated seed SQL use the same ids and imports
 * stay idempotent: `stableId("media", "/images/photos/a.jpg")`.
 */
export function stableId(namespace: string, name: string): string {
  const hash = createHash("sha1").update(`drmohamedgamal:${namespace}:${name}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
