import "server-only";

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizePassword } from "@/lib/password-policy";

const passwordDigests = new Set(
  readFileSync(
    join(process.cwd(), "data", "password-blocklist.sha256"),
    "utf8"
  )
    .split(/\r?\n/)
    .filter(Boolean)
);

export function isPasswordBlocklisted(password: string): boolean {
  const digest = createHash("sha256")
    .update(normalizePassword(password), "utf8")
    .digest("hex");

  return passwordDigests.has(digest);
}
