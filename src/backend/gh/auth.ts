import { execFile, execFileSync, spawn } from "node:child_process";
import { promisify } from "node:util";
import {
  type ScopeCheckResult,
  REQUIRED_GH_OAUTH_SCOPES,
  checkScopesFromAuthStatusHostsJson,
} from "./required-scopes.ts";

const execFileAsync = promisify(execFile);

/** Default device-authorization page for github.com when the URL is not parsed from `gh` output. */
const DEFAULT_GITHUB_DEVICE_LOGIN_URL = "https://github.com/login/device";

type GhDeviceFlowInfo = {
  code: string;
  url: string;
};

type GhInteractiveOptions = {
  onClose: (code: number | null) => void;
  onDeviceFlowInfo?: (info: GhDeviceFlowInfo) => void;
};

const DEVICE_CODE_RE = /one-time code:\s*([A-Z0-9]{4}-[A-Z0-9]{4})/i;
const DEVICE_URL_RE = /(https:\/\/[^\s]+\/login\/device)/;

function tryParseDeviceFlow(buffer: string): GhDeviceFlowInfo | null {
  const codeMatch = DEVICE_CODE_RE.exec(buffer);
  if (codeMatch === null) {
    return null;
  }
  const code = codeMatch[1];
  const urlMatch = DEVICE_URL_RE.exec(buffer);
  const url = urlMatch !== null ? urlMatch[1] : DEFAULT_GITHUB_DEVICE_LOGIN_URL;
  return { code, url };
}

function spawnGhWithStdinInheritedTeedOutput(
  args: string[],
  { onClose, onDeviceFlowInfo }: GhInteractiveOptions,
): void {
  let deviceInfoSent = false;
  let aggregate = "";

  const tryEmitDeviceInfo = (): void => {
    if (deviceInfoSent || onDeviceFlowInfo === undefined) {
      return;
    }
    const parsed = tryParseDeviceFlow(aggregate);
    if (parsed !== null) {
      deviceInfoSent = true;
      onDeviceFlowInfo(parsed);
    }
  };

  const wireStream = (
    stream: NodeJS.ReadableStream | null,
    toTerminal: (chunk: string) => void,
  ): void => {
    if (stream === null) {
      return;
    }
    stream.setEncoding("utf8");
    stream.on("data", (chunk: string) => {
      toTerminal(chunk);
      aggregate += chunk;
      tryEmitDeviceInfo();
    });
  };

  let child;
  try {
    child = spawn("gh", args, {
      stdio: ["inherit", "pipe", "pipe"],
      detached: false,
    });
  } catch (e) {
    console.error("gh spawn failed", e);
    onClose(null);
    return;
  }

  const out = child.stdout;
  const err = child.stderr;
  if (out === null || err === null) {
    console.error("gh spawn missing piped stdio");
    onClose(null);
    return;
  }

  wireStream(out, (c) => {
    process.stdout.write(c);
  });
  wireStream(err, (c) => {
    process.stderr.write(c);
  });

  child.on("close", (code) => {
    onClose(code);
  });
  child.on("error", (err) => {
    console.error("gh process error", err);
    onClose(null);
  });
}

export function ghAuthLogout(): void {
  try {
    execFileSync("gh", ["auth", "logout"], { stdio: "inherit" });
  } catch (e) {
    console.error("gh auth logout failed", e);
  }
}

/**
 * Runs interactive `gh auth login` (stdin inherited; stdout/stderr teed to the terminal and parsed for device flow).
 * Uses `--web`, `--git-protocol ssh`, `--skip-ssh-key`, and `--scopes` from {@link REQUIRED_GH_OAUTH_SCOPES}.
 */
export function spawnGhAuthLogin(options: GhInteractiveOptions): void {
  const scopeCsv = REQUIRED_GH_OAUTH_SCOPES.join(",");
  spawnGhWithStdinInheritedTeedOutput(
    ["auth", "login", "--web", "--git-protocol", "ssh", "--skip-ssh-key", "--scopes", scopeCsv],
    options,
  );
}

/**
 * Runs `gh auth status --json hosts` once and checks token scopes against {@link REQUIRED_GH_OAUTH_SCOPES}.
 * On `ENOENT`, returns {@link ScopeCheckResult} with `noGh: true` for install-CLI UI.
 */
export async function checkRequiredGitHubCliScopes(): Promise<ScopeCheckResult> {
  try {
    const { stdout } = await execFileAsync("gh", ["auth", "status", "--json", "hosts"], {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    });
    let json: unknown;
    try {
      json = JSON.parse((stdout as string).trim());
    } catch {
      return {
        ok: false,
        unknown: true,
        message: "Could not verify scopes (unexpected `gh auth status` output).",
      };
    }
    return checkScopesFromAuthStatusHostsJson(json, REQUIRED_GH_OAUTH_SCOPES);
  } catch (e: unknown) {
    if (e !== null && typeof e === "object" && "code" in e && e.code === "ENOENT") {
      return {
        ok: false,
        noGh: true,
        unknown: true,
        message: "Could not verify scopes (`gh` not found).",
      };
    }
    return {
      ok: false,
      unknown: true,
      message: "Could not verify scopes (run `gh auth status` in a terminal).",
    };
  }
}
