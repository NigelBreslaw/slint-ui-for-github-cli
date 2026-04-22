import { assignProperties } from "slint-bridge-kit";
import { checkRequiredGitHubCliScopes } from "../gh/auth.ts";
import { checkGhCliVersionGate, formatMinGhCliVersion } from "../gh/gh-cli-version.ts";
import { emptyTransparentAvatarImage, loadAvatarRgba } from "../gh/avatar-image.ts";
import { ghApiGraphql } from "../gh/gh-app-client.ts";
import { getLastSlintUiOrgProjectsFetch } from "../gh/slint-ui-org-projects-ui.ts";
import { statusEmojiFromGraphqlHtml } from "../gh/status-emoji-from-graphql.ts";
import { parseGhGraphqlViewerMinimalResponse } from "../schemas/gh-graphql-viewer-minimal.ts";
import {
  readViewerSessionCache,
  viewerSessionFromMinimalViewer,
  writeViewerSessionCache,
} from "../session/viewer-session-cache.ts";
import { authed, type MainWindowInstance } from "../../bridges/node/slint-interface.ts";
import { uiPerfMarkT1Text, uiPerfMarkT2Avatar, uiPerfResetSession } from "../utils/ui-perf.ts";
import {
  applyCachedViewerToAppState,
  clearAuthDeviceFields,
  clearTimeReportingSelection,
  clearUserIdentity,
  refreshSlintUiOrgProjectsForWindow,
  resetListsWithoutClearingProfile,
} from "../../bridges/node/slint-window-bridge.ts";
import { VIEWER_APP_GRAPHQL_QUERY } from "../gh/viewer-queries.ts";
import {
  debugUserData,
  maybeDumpNotificationsThreadsDebugAsync,
  maybeDumpSlintUiProjectListJsonFromUiFetch,
  runDebugJsonSlintUiDumpsAsync,
  shouldRunSlintUiProjectDebugDumps,
} from "../../debug/github-app-debug-dumps.ts";
import { maybeDumpTimeReportingProjectFromKvWhenDebugJsonEnv } from "../time-reporting/dump-time-reporting-project-debug.ts";

let initialProjectsDebugPending: string | null = null;
let slintEventLoopHasStarted = false;
/** Set when `gh` is missing before `runEventLoop` is ready; shown from `runningCallback`. */
let pendingShowNoGhOverlay = false;
/** Same pattern for `gh` below minimum version. */
let pendingShowGhVersionTooOldOverlay = false;

/** Bumped on each `applyAuthUi` run so stale async work does not touch UI or session KV. */
let authOperationEpoch = 0;

function beginAuthOperation(): number {
  authOperationEpoch += 1;
  return authOperationEpoch;
}

function isAuthEpochCurrent(op: number): boolean {
  return op === authOperationEpoch;
}

export function slintRunningCallback(window: MainWindowInstance): void {
  slintEventLoopHasStarted = true;
  if (pendingShowNoGhOverlay) {
    pendingShowNoGhOverlay = false;
    window.ShellDialogsState.no_gh_cli_dialog_open = true;
  }
  if (pendingShowGhVersionTooOldOverlay) {
    pendingShowGhVersionTooOldOverlay = false;
    window.ShellDialogsState.gh_cli_version_dialog_open = true;
  }
  const login = initialProjectsDebugPending;
  initialProjectsDebugPending = null;
  if (login !== null && shouldRunSlintUiProjectDebugDumps()) {
    void runDebugJsonSlintUiDumpsAsync(login, getLastSlintUiOrgProjectsFetch()).catch((e) => {
      console.error("[debug-json] runDebugJsonSlintUiDumpsAsync failed:", e);
    });
  }
}

async function fetchAndApplyGitHubUser(
  window: MainWindowInstance,
  options: { op: number },
): Promise<void> {
  const { op } = options;
  const result = await ghApiGraphql(VIEWER_APP_GRAPHQL_QUERY);
  if (!isAuthEpochCurrent(op)) {
    return;
  }
  if (!result.ok) {
    window.status_message = result.error;
    clearUserIdentity(window);
    return;
  }
  const parsed = parseGhGraphqlViewerMinimalResponse(result.value);
  if (!isAuthEpochCurrent(op)) {
    return;
  }
  if (!parsed.ok) {
    window.status_message = parsed.message;
    clearUserIdentity(window);
    return;
  }
  const viewer = parsed.viewer;
  window.status_message = "";
  const st = viewer.status;
  const emojiPlain = statusEmojiFromGraphqlHtml(st?.emojiHTML ?? null);
  assignProperties(window.AppState, {
    user_login: viewer.login,
    user_name: viewer.name ?? "",
    user_profile_url: viewer.url,
    user_status_message: st?.message ?? "",
    user_status_emoji: emojiPlain,
  });
  uiPerfMarkT1Text("network");
  writeViewerSessionCache(viewerSessionFromMinimalViewer(viewer, emojiPlain));
  // Do not set emptyTransparentAvatarImage here: it would blank the avatar for the whole
  // `refreshSlintUiOrgProjectsForWindow` await (and any debug work). Keep the prior image
  // (e.g. from cache hydrate) until `loadAvatarRgba` replaces it.
  void loadAvatarRgba(viewer.avatarUrl).then((loaded) => {
    if (!isAuthEpochCurrent(op)) {
      return;
    }
    if (loaded !== undefined) {
      window.AppState.avatar = loaded;
      uiPerfMarkT2Avatar("network", loaded);
    } else {
      window.AppState.avatar = emptyTransparentAvatarImage;
    }
  });

  await refreshSlintUiOrgProjectsForWindow(window);
  if (!isAuthEpochCurrent(op)) {
    return;
  }
  maybeDumpSlintUiProjectListJsonFromUiFetch();

  if (process.env.GH_DEBUG_JSON === "1") {
    void debugUserData().catch((e) => {
      console.error("[debug-json] debugUserData failed:", e);
    });
    void maybeDumpNotificationsThreadsDebugAsync().catch((e) => {
      console.error("[debug-json] maybeDumpNotificationsThreadsDebugAsync failed:", e);
    });
    maybeDumpTimeReportingProjectFromKvWhenDebugJsonEnv();
    if (shouldRunSlintUiProjectDebugDumps()) {
      if (!slintEventLoopHasStarted) {
        initialProjectsDebugPending = viewer.login;
      } else {
        void runDebugJsonSlintUiDumpsAsync(viewer.login, getLastSlintUiOrgProjectsFetch()).catch(
          (e) => {
            console.error("[debug-json] runDebugJsonSlintUiDumpsAsync failed:", e);
          },
        );
      }
    }
  }
}

export function applyAuthUi(window: MainWindowInstance): void {
  uiPerfResetSession();
  pendingShowNoGhOverlay = false;
  pendingShowGhVersionTooOldOverlay = false;
  assignProperties(window.ShellDialogsState, {
    no_gh_cli_dialog_open: false,
    gh_cli_version_dialog_open: false,
  });
  const op = beginAuthOperation();

  assignProperties(window, { status_message: "Checking…" });
  assignProperties(window.ShellDialogsState, {
    gh_cli_version_block_detail: "",
    auth_device_flow_open: false,
  });
  assignProperties(window.AppState, { auth: authed.loggedIn });
  clearAuthDeviceFields(window);

  const cached = readViewerSessionCache();
  const hadCachedSession = cached !== null;
  if (cached !== null) {
    resetListsWithoutClearingProfile(window);
    applyCachedViewerToAppState(window, cached);
    uiPerfMarkT1Text("cache");
    window.status_message = "";
    // Avoid forcing emptyTransparent here: keep whatever the window had until decode finishes
    // (same idea as `fetchAndApplyGitHubUser` — no intentional blank before async load).
    void loadAvatarRgba(cached.viewer.avatarUrl).then((loaded) => {
      if (!isAuthEpochCurrent(op)) {
        return;
      }
      if (loaded !== undefined) {
        window.AppState.avatar = loaded;
        uiPerfMarkT2Avatar("cache", loaded);
      } else {
        window.AppState.avatar = emptyTransparentAvatarImage;
      }
    });
  } else {
    clearUserIdentity(window);
  }

  void (async () => {
    const versionGate = await checkGhCliVersionGate();
    if (!isAuthEpochCurrent(op)) {
      return;
    }
    if (
      versionGate.kind === "too_old" ||
      versionGate.kind === "unparseable" ||
      versionGate.kind === "exec_failed"
    ) {
      const minV = formatMinGhCliVersion();
      const status_message = `GitHub CLI must be updated to at least version ${minV}.`;
      let gh_cli_version_block_detail: string;
      if (versionGate.kind === "too_old") {
        const { major, minor, patch } = versionGate.parsed;
        gh_cli_version_block_detail = `Current version: ${major}.${minor}.${patch}`;
      } else if (versionGate.kind === "unparseable") {
        gh_cli_version_block_detail = `Could not parse version from: ${versionGate.line}`;
      } else {
        gh_cli_version_block_detail = versionGate.error;
      }
      assignProperties(window.AppState, { auth: authed.ghCliVersionTooOld });
      assignProperties(window, { status_message });
      assignProperties(window.ShellDialogsState, { gh_cli_version_block_detail });
      if (slintEventLoopHasStarted) {
        window.ShellDialogsState.gh_cli_version_dialog_open = true;
      } else {
        pendingShowGhVersionTooOldOverlay = true;
      }
      clearAuthDeviceFields(window);
      assignProperties(window.ShellDialogsState, { auth_device_flow_open: false });
      clearUserIdentity(window);
      clearTimeReportingSelection(window);
      return;
    }

    const scopeCheck = await checkRequiredGitHubCliScopes();
    if (!isAuthEpochCurrent(op)) {
      return;
    }
    if (!scopeCheck.ok && scopeCheck.noGh === true) {
      assignProperties(window.AppState, { auth: authed.noGhCliInstalled });
      assignProperties(window, { status_message: "gh not found (install GitHub CLI)" });
      if (slintEventLoopHasStarted) {
        window.ShellDialogsState.no_gh_cli_dialog_open = true;
      } else {
        pendingShowNoGhOverlay = true;
      }
      clearAuthDeviceFields(window);
      assignProperties(window.ShellDialogsState, { auth_device_flow_open: false });
      clearUserIdentity(window);
      clearTimeReportingSelection(window);
      return;
    }
    if (!scopeCheck.ok) {
      assignProperties(window.AppState, { auth: authed.loggedOut });
      assignProperties(window, {
        status_message: `${scopeCheck.message} Click Login to authorize with the required scopes.`,
      });
      clearAuthDeviceFields(window);
      assignProperties(window.ShellDialogsState, { auth_device_flow_open: false });
      clearUserIdentity(window);
      clearTimeReportingSelection(window);
      return;
    }
    window.status_message = hadCachedSession ? "" : "Loading…";
    await fetchAndApplyGitHubUser(window, { op });
  })().catch((e) => {
    console.error("[github-app] scope check or user fetch failed:", e);
    window.status_message = "Something went wrong";
    clearUserIdentity(window);
  });
}
