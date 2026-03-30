import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function readPackageVersion(): string {
  try {
    const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json");
    const raw = readFileSync(pkgPath, "utf8");
    const j = JSON.parse(raw) as { version?: string };
    return j.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function buildCommitLabel(count: number): string {
  if (count <= 0) {
    return "— (run dev script to refresh)";
  }
  if (count < 1000) {
    return `v0.${String(count)}`;
  }
  return `v${String(count)}`;
}
