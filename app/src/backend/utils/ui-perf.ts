/**
 * Opt-in UI timing logs when `GH_APP_UI_PERF=1`.
 * Milestones are relative to T0 at the start of each auth UI attempt (`applyAuthUi`).
 */
import type { SlintRgbaImage } from "../gh/avatar-image.ts";
import { isPlaceholderAvatarImage } from "../gh/avatar-image.ts";

function isUiPerfEnabled(): boolean {
  return process.env.GH_APP_UI_PERF === "1";
}

let t0Ms = 0;
let t1AtMs = 0;
let t2AtMs = 0;
let t1Done = false;
let t2Done = false;

function maybeLogT3Full(): void {
  if (!isUiPerfEnabled() || !t1Done || !t2Done || t0Ms === 0) {
    return;
  }
  const t1rel = t1AtMs - t0Ms;
  const t2rel = t2AtMs - t0Ms;
  const fullMs = Math.max(t1rel, t2rel);
  console.error(`[ui-perf] T3_full +${fullMs.toFixed(1)}ms (max of T1_text and T2_avatar)`);
}

/** Call at the beginning of `applyAuthUi` (each auth attempt). */
export function uiPerfResetSession(): void {
  if (!isUiPerfEnabled()) {
    return;
  }
  t0Ms = performance.now();
  t1AtMs = 0;
  t2AtMs = 0;
  t1Done = false;
  t2Done = false;
  console.error("[ui-perf] T0_start +0.0ms");
}

/** After `user_login` / `user_name` (and related header text) are set. First mark wins (cache vs later network refresh). */
export function uiPerfMarkT1Text(source: "cache" | "network"): void {
  if (!isUiPerfEnabled() || t0Ms === 0 || t1Done) {
    return;
  }
  const ms = performance.now() - t0Ms;
  t1AtMs = performance.now();
  t1Done = true;
  console.error(`[ui-perf] T1_text +${ms.toFixed(1)}ms source=${source}`);
  maybeLogT3Full();
}

/** After a non-placeholder avatar image is applied to `AppState.avatar`. First mark wins. */
export function uiPerfMarkT2Avatar(source: "cache" | "network", image: SlintRgbaImage): void {
  if (!isUiPerfEnabled() || t0Ms === 0 || t2Done) {
    return;
  }
  if (isPlaceholderAvatarImage(image)) {
    return;
  }
  const ms = performance.now() - t0Ms;
  t2AtMs = performance.now();
  t2Done = true;
  console.error(`[ui-perf] T2_avatar +${ms.toFixed(1)}ms source=${source}`);
  maybeLogT3Full();
}
