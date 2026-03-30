import { execFile } from "node:child_process";

const DEFAULT_DEVICE_PAGE = "https://github.com/login/device";

function logOpenError(err: Error | null): void {
  if (err) {
    console.error("[github-app] openUrlInBrowser failed:", err);
  }
}

/**
 * Opens a URL in the system default browser (no shell).
 */
export function openUrlInBrowser(url: string): void {
  const target = url.trim().length > 0 ? url.trim() : DEFAULT_DEVICE_PAGE;
  try {
    if (process.platform === "darwin") {
      execFile("open", [target], logOpenError);
    } else if (process.platform === "win32") {
      execFile("cmd", ["/c", "start", "", target], { windowsHide: true }, logOpenError);
    } else {
      execFile("xdg-open", [target], logOpenError);
    }
  } catch (e) {
    console.error("[github-app] openUrlInBrowser failed:", e);
  }
}
