#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { globSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = fileURLToPath(new URL("..", import.meta.url));
const files = globSync("src/**/*.test.ts", { cwd: pkgRoot })
  .map((f) => join(pkgRoot, f))
  .sort();
if (files.length === 0) {
  console.error("No test files matching src/**/*.test.ts");
  process.exit(1);
}
const r = spawnSync(process.execPath, ["--test", ...files], { stdio: "inherit", cwd: pkgRoot });
process.exit(r.status ?? 1);
