import { access, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const nodePackageDir = dirname(scriptDir);
const distDir = join(nodePackageDir, "dist");
const macosDir = join(nodePackageDir, "macos");
const executablePath = join(distDir, "primer-gallery");
const entitlementsPath = join(macosDir, "entitlements.plist");
const infoPlistTemplatePath = join(macosDir, "Info.plist");

const APP_NAME = "Primer Gallery";
const APP_BUNDLE = `${APP_NAME}.app`;
const APP_PATH = join(distDir, APP_BUNDLE);
const BUNDLE_EXECUTABLE = "primer-gallery";
const BUNDLE_ID = "dev.slint.primer-gallery";
const ZIP_PATH = join(distDir, `${APP_NAME}.zip`);

if (process.platform !== "darwin" || process.arch !== "arm64") {
  console.error(
    `macOS app packaging requires darwin arm64 (got ${process.platform} ${process.arch})`,
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

async function run(
  command: string,
  args: string[],
  options: { cwd?: string } = {},
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: options.cwd,
      stdio: "inherit",
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function readPackageVersion(): Promise<string> {
  const pkg = JSON.parse(
    await readFile(join(nodePackageDir, "package.json"), "utf8"),
  ) as { version?: string };
  return pkg.version ?? "0.0.1";
}

async function writeInfoPlist(version: string): Promise<void> {
  let template = await readFile(infoPlistTemplatePath, "utf8");
  template = template.replace(
    /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${version}$2`,
  );
  template = template.replace(
    /(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${version}$2`,
  );
  await writeFile(join(APP_PATH, "Contents", "Info.plist"), template);
}

async function packageApp(): Promise<void> {
  if (!(await pathExists(executablePath))) {
    throw new Error(
      `Missing ${executablePath}. Run "pnpm build:gallery" first.`,
    );
  }

  const version = await readPackageVersion();
  const macosBin = join(APP_PATH, "Contents", "MacOS");
  const resources = join(APP_PATH, "Contents", "Resources");

  await mkdir(macosBin, { recursive: true });
  await mkdir(resources, { recursive: true });
  await copyFile(executablePath, join(macosBin, BUNDLE_EXECUTABLE));
  await writeInfoPlist(version);

  console.log(`Packaged ${APP_PATH} (version ${version})`);
}

function resolveSignIdentity(): string {
  const identity = process.env.CODESIGN_IDENTITY?.trim();
  if (identity) {
    return identity;
  }
  throw new Error(
    "CODESIGN_IDENTITY is not set. Use a Developer ID Application certificate, e.g.\n" +
      '  export CODESIGN_IDENTITY="Developer ID Application: Your Name (TEAMID)"\n' +
      'List identities: security find-identity -v -p codesigning',
  );
}

async function signApp(): Promise<void> {
  const identity = resolveSignIdentity();
  const machO = join(APP_PATH, "Contents", "MacOS", BUNDLE_EXECUTABLE);
  const signArgs = [
    "--force",
    "--sign",
    identity,
    "--options",
    "runtime",
    "--timestamp",
    "--entitlements",
    entitlementsPath,
  ];

  await run("codesign", [...signArgs, machO]);
  await run("codesign", [...signArgs, APP_PATH]);

  console.log(`Signed ${APP_BUNDLE} with "${identity}"`);
  await run("codesign", ["--verify", "--deep", "--strict", "--verbose=2", APP_PATH]);
}

async function notarizeApp(): Promise<void> {
  const appleId = process.env.NOTARY_APPLE_ID?.trim();
  const teamId = process.env.NOTARY_TEAM_ID?.trim();
  const password = process.env.NOTARY_PASSWORD?.trim();

  if (!appleId || !teamId || !password) {
    throw new Error(
      "Notarization requires NOTARY_APPLE_ID, NOTARY_TEAM_ID, and NOTARY_PASSWORD.\n" +
        "NOTARY_PASSWORD can be an app-specific password or @keychain:AC_PASSWORD",
    );
  }

  await rm(ZIP_PATH, { force: true });

  await run("ditto", ["-c", "-k", "--keepParent", APP_PATH, ZIP_PATH]);
  console.log(`Created ${ZIP_PATH}`);

  await run("xcrun", [
    "notarytool",
    "submit",
    ZIP_PATH,
    "--apple-id",
    appleId,
    "--team-id",
    teamId,
    "--password",
    password,
    "--wait",
  ]);

  await run("xcrun", ["stapler", "staple", APP_PATH]);
  console.log(`Stapled notarization ticket to ${APP_BUNDLE}`);

  await run("spctl", ["-a", "-vv", APP_PATH]);
}

await packageApp();
await signApp();

if (process.env.NOTARIZE === "1") {
  await notarizeApp();
} else {
  console.log(
    "\nSkipping notarization (set NOTARIZE=1 and NOTARY_* env vars to notarize for public distribution).",
  );
}

console.log(`\nDone.\n  open "${APP_PATH}"\n`);
