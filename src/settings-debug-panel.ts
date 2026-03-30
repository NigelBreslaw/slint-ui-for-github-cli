import { fetchGraphqlRateLimit } from "./gh/graphql-rate-limit.ts";
import { getGhCliVersionLine } from "./gh/gh-cli-version.ts";
import { GIT_COMMIT_COUNT } from "./generated/build-info.ts";
import type { MainWindowInstance } from "./slint-interface.ts";
import { buildCommitLabel, readPackageVersion } from "./utils/package-meta.ts";
import { formatCountdownMs } from "./utils/format-countdown.ts";
import { formatRateLimitResetLocal } from "./utils/format-reset-at-local.ts";
import {
  clearSecurityAlertsRepoUi,
  hydrateSecurityAlertsRepo,
} from "./settings-security-alerts-repo.ts";

let settingsRateLimitDeadlineMs: number | null = null;
let settingsCountdownHandle: ReturnType<typeof setInterval> | null = null;
/** Bumped on panel teardown and each new load so stale async work cannot touch UI or timers. */
let settingsDebugEpoch = 0;

function clearSettingsDebugStrings(window: MainWindowInstance): void {
  clearSecurityAlertsRepoUi(window);
  window.SettingsState.settings_debug_gh_version = "";
  window.SettingsState.settings_debug_rate_limit = "";
  window.SettingsState.settings_debug_reset_at = "";
  window.SettingsState.settings_debug_countdown = "";
  window.SettingsState.settings_debug_app_version = "";
  window.SettingsState.settings_debug_commit_label = "";
  window.SettingsState.settings_debug_error = "";
}

function stopSettingsDebugCountdown(): void {
  if (settingsCountdownHandle !== null) {
    clearInterval(settingsCountdownHandle);
    settingsCountdownHandle = null;
  }
}

function invalidateInFlightSettingsDebugLoads(): void {
  settingsDebugEpoch++;
}

function resetSettingsDebugPanelState(window: MainWindowInstance): void {
  stopSettingsDebugCountdown();
  settingsRateLimitDeadlineMs = null;
  clearSettingsDebugStrings(window);
}

export function teardownSettingsDebugPanel(window: MainWindowInstance): void {
  invalidateInFlightSettingsDebugLoads();
  resetSettingsDebugPanelState(window);
}

function applySettingsDebugRateLimitFetchResult(
  window: MainWindowInstance,
  rl: Awaited<ReturnType<typeof fetchGraphqlRateLimit>>,
  errors: string[],
  epoch: number,
): void {
  if (rl.ok) {
    const { limit, remaining, resetAt } = rl.rateLimit;
    const used = limit - remaining;
    window.SettingsState.settings_debug_rate_limit = `${used} / ${limit} used (${remaining} left)`;
    const t = Date.parse(resetAt);
    if (!Number.isFinite(t)) {
      errors.push("Invalid rateLimit.resetAt from API");
      window.SettingsState.settings_debug_reset_at = resetAt;
      window.SettingsState.settings_debug_countdown = "—";
      settingsRateLimitDeadlineMs = null;
    } else {
      window.SettingsState.settings_debug_reset_at = formatRateLimitResetLocal(resetAt);
      settingsRateLimitDeadlineMs = t;
      tickSettingsCountdown(window);
      settingsCountdownHandle = setInterval(() => {
        if (epoch !== settingsDebugEpoch) {
          return;
        }
        tickSettingsCountdown(window);
      }, 1000);
    }
  } else {
    window.SettingsState.settings_debug_rate_limit = "—";
    window.SettingsState.settings_debug_reset_at = "—";
    window.SettingsState.settings_debug_countdown = "—";
    settingsRateLimitDeadlineMs = null;
    errors.push(rl.error);
  }
}

function tickSettingsCountdown(window: MainWindowInstance): void {
  if (settingsRateLimitDeadlineMs === null) {
    window.SettingsState.settings_debug_countdown = "—";
    return;
  }
  const remainingMs = settingsRateLimitDeadlineMs - Date.now();
  if (remainingMs <= 0) {
    void refreshSettingsRateLimitAfterReset(window);
    return;
  }
  window.SettingsState.settings_debug_countdown = formatCountdownMs(remainingMs);
}

async function refreshSettingsRateLimitAfterReset(window: MainWindowInstance): Promise<void> {
  const epoch = settingsDebugEpoch;
  stopSettingsDebugCountdown();
  window.SettingsState.settings_debug_countdown = "…";
  const rl = await fetchGraphqlRateLimit();
  if (epoch !== settingsDebugEpoch) {
    return;
  }
  const errors: string[] = [];
  applySettingsDebugRateLimitFetchResult(window, rl, errors, epoch);
  if (errors.length > 0) {
    const cur = window.SettingsState.settings_debug_error;
    const extra = errors.join(" · ");
    window.SettingsState.settings_debug_error = cur === "" ? extra : `${cur} · ${extra}`;
  }
}

export async function loadSettingsDebugPanel(window: MainWindowInstance): Promise<void> {
  invalidateInFlightSettingsDebugLoads();
  const epoch = settingsDebugEpoch;
  resetSettingsDebugPanelState(window);
  hydrateSecurityAlertsRepo(window);
  window.SettingsState.settings_debug_app_version = `v${readPackageVersion()}`;
  window.SettingsState.settings_debug_commit_label = buildCommitLabel(GIT_COMMIT_COUNT);

  const errors: string[] = [];
  const [ghVer, rl] = await Promise.all([getGhCliVersionLine(), fetchGraphqlRateLimit()]);
  if (epoch !== settingsDebugEpoch) {
    return;
  }

  if (ghVer.ok) {
    window.SettingsState.settings_debug_gh_version = ghVer.line;
  } else {
    window.SettingsState.settings_debug_gh_version = "—";
    errors.push(ghVer.error);
  }

  applySettingsDebugRateLimitFetchResult(window, rl, errors, epoch);

  window.SettingsState.settings_debug_error = errors.join(" · ");
}
