import { join } from "node:path";

/**
 * Local data directory for this app (SQLite DB, avatar files, etc.).
 * Uses `join(process.cwd(), ".data")` — typically the repo root when started via `pnpm start`.
 */
export function appDataRoot(): string {
  return join(process.cwd(), ".data");
}
