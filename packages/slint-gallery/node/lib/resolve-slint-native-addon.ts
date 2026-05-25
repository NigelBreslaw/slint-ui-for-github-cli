import { access, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const ADDON_PKG = "@slint-ui/slint-ui-binary-darwin-arm64";
const ADDON_FILE = "slint-ui.darwin-arm64.node";

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/** Resolve darwin-arm64 slint-ui N-API addon after pnpm install. */
export async function resolveSlintNativeAddon(repoRoot: string): Promise<string> {
  try {
    const require = createRequire(join(repoRoot, "package.json"));
    return require.resolve(`${ADDON_PKG}/${ADDON_FILE}`);
  } catch {
    // fall through
  }

  const direct = join(repoRoot, "node_modules", ADDON_PKG, ADDON_FILE);
  if (await pathExists(direct)) {
    return direct;
  }

  const store = join(repoRoot, "node_modules", ".pnpm");
  let entries: string[] = [];
  try {
    entries = await readdir(store);
  } catch {
    entries = [];
  }

  for (const entry of entries) {
    if (!entry.startsWith("@slint-ui+slint-ui-binary-darwin-arm64@")) {
      continue;
    }
    const candidate = join(
      store,
      entry,
      "node_modules",
      ADDON_PKG,
      ADDON_FILE,
    );
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not find ${ADDON_PKG}/${ADDON_FILE}. Run pnpm install at the repo root.`,
  );
}
