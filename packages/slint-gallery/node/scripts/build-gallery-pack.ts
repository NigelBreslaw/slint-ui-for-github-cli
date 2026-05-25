import { mkdir, rm, writeFile, access, chmod, readFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import * as esbuild from "esbuild";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const nodePackageDir = dirname(scriptDir);
const repoRoot = join(nodePackageDir, "../../..");
const distDir = join(nodePackageDir, "dist");
const tarPath = join(distDir, "gallery-assets.tar");
const seaBundlePath = join(distDir, "gallery-sea.cjs");
const seaConfigPath = join(distDir, "sea-config.json");
const outfile = join(distDir, "primer-gallery");

const NODE_VERSION = "25.9.0";

if (process.platform !== "darwin" || process.arch !== "arm64") {
  console.error(
    `Gallery pack requires darwin arm64 (got ${process.platform} ${process.arch})`,
  );
  process.exit(1);
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function createAssetsTar(): Promise<void> {
  const uiDir = join(repoRoot, "packages/slint-gallery/ui");
  const primerDir = join(repoRoot, "packages/primer-slint");
  if (!(await pathExists(uiDir)) || !(await pathExists(primerDir))) {
    throw new Error(`Missing asset dirs:\n  ${uiDir}\n  ${primerDir}`);
  }

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      "tar",
      [
        "-cf",
        tarPath,
        "-C",
        repoRoot,
        "packages/slint-gallery/ui",
        "packages/primer-slint",
      ],
      { stdio: "inherit", cwd: repoRoot },
    );
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tar create exited with code ${code}`));
    });
  });
  console.log(`Created ${tarPath}`);
}

async function bundleSeaMain(): Promise<void> {
  const nativeShim = join(nodePackageDir, "lib/slint-native-shim.cjs");
  await esbuild.build({
    entryPoints: [join(nodePackageDir, "gallery-sea-main.ts")],
    outfile: seaBundlePath,
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node25",
    external: ["node:sea"],
    plugins: [
      {
        name: "slint-native-shim",
        setup(build) {
          build.onResolve(
            { filter: /^@slint-ui\/slint-ui-binary-darwin-arm64/ },
            () => ({ path: nativeShim }),
          );
          build.onLoad({ filter: /rust-module\.cjs$/ }, async (args) => {
            let contents = await readFile(args.path, "utf8");
            contents = contents.replace(
              "return require(process.env.NAPI_RS_NATIVE_LIBRARY_PATH)",
              [
                "const _napiMod = { exports: {} };",
                "process.dlopen(_napiMod, process.env.NAPI_RS_NATIVE_LIBRARY_PATH);",
                "return _napiMod.exports",
              ].join("; "),
            );
            return { contents, loader: "js" };
          });
        },
      },
    ],
    logLevel: "info",
  });
  console.log(`Bundled ${seaBundlePath}`);
}

async function resolveAddonPath(): Promise<string> {
  const { resolveSlintNativeAddon } = await import(
    "../lib/resolve-slint-native-addon.ts"
  );
  return resolveSlintNativeAddon(repoRoot);
}

async function writeSeaConfig(addonPath: string): Promise<void> {
  const config = {
    main: seaBundlePath,
    mainFormat: "commonjs",
    output: outfile,
    disableExperimentalSEAWarning: true,
    assets: {
      "slint-ui.darwin-arm64.node": addonPath,
      "gallery-assets.tar": tarPath,
    },
  };
  await writeFile(seaConfigPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`Wrote ${seaConfigPath}`);
}

async function resolveNode259(): Promise<string> {
  const toolsDir = join(
    nodePackageDir,
    ".tools",
    `node-v${NODE_VERSION}-darwin-arm64`,
  );
  const bin = join(toolsDir, "bin", "node");
  if (await pathExists(bin)) {
    return bin;
  }

  const home = process.env.HOME ?? "";
  const pnpmCandidates = [
    join(home, "Library", "pnpm", "nodejs", NODE_VERSION, "bin", "node"),
    join(home, ".local", "share", "pnpm", "nodejs", NODE_VERSION, "bin", "node"),
  ];
  for (const candidate of pnpmCandidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  if (process.version.startsWith(`v${NODE_VERSION}`)) {
    return process.execPath;
  }

  const archive = `node-v${NODE_VERSION}-darwin-arm64.tar.gz`;
  const url = `https://nodejs.org/dist/v${NODE_VERSION}/${archive}`;
  const cacheDir = join(nodePackageDir, ".tools");
  const archivePath = join(cacheDir, archive);

  await mkdir(cacheDir, { recursive: true });
  console.log(`Downloading Node ${NODE_VERSION} from ${url}…`);
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download Node ${NODE_VERSION}: ${response.status}`);
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(archivePath));

  await mkdir(toolsDir, { recursive: true });
  await new Promise<void>((resolve, reject) => {
    const proc = spawn("tar", ["-xzf", archivePath, "-C", cacheDir], {
      stdio: "inherit",
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tar extract exited with code ${code}`));
    });
  });

  if (!(await pathExists(bin))) {
    throw new Error(`Node binary missing after extract: ${bin}`);
  }
  await chmod(bin, 0o755);
  return bin;
}

async function buildSea(nodeBin: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(nodeBin, ["--build-sea", seaConfigPath], {
      cwd: nodePackageDir,
      stdio: "inherit",
      env: {
        ...process.env,
        SLINT_ENABLE_EXPERIMENTAL_FEATURES: "1",
      },
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`node --build-sea exited with code ${code}`));
    });
  });
  console.log(`Built ${outfile}`);
}

async function adhocSign(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const proc = spawn("codesign", ["-s", "-", "--force", outfile], {
      stdio: "inherit",
    });
    proc.on("error", (err) => {
      console.warn(`codesign skipped: ${err.message}`);
      resolve();
    });
    proc.on("close", (code) => {
      if (code === 0) {
        console.log(`Ad-hoc signed ${outfile}`);
        resolve();
      } else {
        console.warn(`codesign exited with code ${code} (continuing)`);
        resolve();
      }
    });
  });
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await createAssetsTar();
await bundleSeaMain();
const addonPath = await resolveAddonPath();
await writeSeaConfig(addonPath);
const nodeBin = await resolveNode259();
const version = await new Promise<string>((resolve, reject) => {
  const proc = spawn(nodeBin, ["--version"], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  let out = "";
  proc.stdout?.on("data", (chunk) => {
    out += chunk;
  });
  proc.on("close", (code) => {
    if (code === 0) resolve(out.trim());
    else reject(new Error("node --version failed"));
  });
});
console.log(`Using ${nodeBin} (${version})`);
await buildSea(nodeBin);
await adhocSign();

console.log(`\nDone. Run:\n  ${outfile}\n`);
