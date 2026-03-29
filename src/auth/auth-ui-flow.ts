import { checkRequiredGitHubCliScopes } from "../gh/auth.ts";
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
import type { MainWindowInstance } from "../slint-interface.ts";
import { uiPerfMarkT1Text, uiPerfMarkT2Avatar, uiPerfResetSession } from "../ui-perf.ts";
import {
  applyCachedViewerToAppState,
  clearAuthDeviceFields,
  clearUserIdentity,
  refreshSlintUiOrgProjectsForWindow,
  resetListsWithoutClearingProfile,
} from "../ui/app-window-bridge.ts";
import { VIEWER_APP_GRAPHQL_QUERY } from "../gh/viewer-queries.ts";
import {
  debugUserData,
  maybeDumpNotificationsThreadsDebugAsync,
  maybeDumpSlintUiProjectListJsonFromUiFetch,
  runDebugJsonSlintUiDumpsAsync,
  shouldRunSlintUiProjectDebugDumps,
} from "../debug/github-app-debug-dumps.ts";

let initialProjectsDebugPending: string | null = null;
let slintEventLoopHasStarted = false;
/** Set when `gh` is missing before `runEventLoop` is ready; shown from `runningCallback`. */
let pendingShowNoGhOverlay = false;

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
    window.show_no_gh_cli_installed();
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
  window.AppState.user_login = viewer.login;
  window.AppState.user_name = viewer.name ?? "";
  window.AppState.user_profile_url = viewer.url;
  const st = viewer.status;
  window.AppState.user_status_message = st?.message ?? "";
  const emojiPlain = statusEmojiFromGraphqlHtml(st?.emojiHTML ?? null);
  window.AppState.user_status_emoji = emojiPlain;
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
  const op = beginAuthOperation();

  window.AppState.auth = "loggedIn";
  window.status_message = "Checking…";
  clearAuthDeviceFields(window);
  window.close_auth_window();

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
    const scopeCheck = await checkRequiredGitHubCliScopes();
    if (!isAuthEpochCurrent(op)) {
      return;
    }
    if (!scopeCheck.ok && scopeCheck.noGh === true) {
      window.AppState.auth = "noGhCliInstalled";
      window.status_message = "gh not found (install GitHub CLI)";
      if (slintEventLoopHasStarted) {
        window.show_no_gh_cli_installed();
      } else {
        pendingShowNoGhOverlay = true;
      }
      clearAuthDeviceFields(window);
      window.close_auth_window();
      clearUserIdentity(window);
      return;
    }
    if (!scopeCheck.ok) {
      window.AppState.auth = "loggedOut";
      window.status_message = `${scopeCheck.message} Click Login to authorize with the required scopes.`;
      clearAuthDeviceFields(window);
      window.close_auth_window();
      clearUserIdentity(window);
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
