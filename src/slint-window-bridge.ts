import * as slint from "slint-ui";
import {
  buildFilteredProjectsModel,
  clearSlintUiOrgProjectsCache,
  refreshSlintUiOrgProjectsCache,
  type SlintProjectRow,
} from "./backend/gh/slint-ui-org-projects-ui.ts";
import { emptyTransparentAvatarImage } from "./backend/gh/avatar-image.ts";
import { fetchDependabotAlertsForRepo } from "./backend/gh/dependabot-alerts.ts";
import { fetchAllReviewRequestsSearch } from "./backend/gh/graphql-review-requests.ts";
import type {
  MainWindowInstance,
  SlintReviewRequestRow,
  SlintSecurityAlertRow,
  SlintTimeReportingWeekRow,
} from "./slint-interface.ts";
import { readSecurityAlertsRepositoryOwnerRepo } from "./backend/settings/security-alerts-repo-kv.ts";
import { resetTimeReportingItemsState } from "./backend/time-reporting/time-reporting-items-cache.ts";
import { clearTimeReportingSelectedProjectKv } from "./backend/time-reporting/time-reporting-selected-project-kv.ts";
import { clearViewerSessionCache, type ViewerSessionV1 } from "./backend/session/viewer-session-cache.ts";
import { teardownSettingsDebugPanel } from "./settings-debug-panel.ts";

let securityAlertsFetchGeneration = 0;

function formatDependabotAlertsUserError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("not found") || m.includes("404")) {
    return "Could not load Dependabot alerts (Not Found). Check the repository in Settings → Security alerts repository, that Dependabot is enabled, and that your token includes the repo or security_events scope (see scopes.md).";
  }
  if (m.includes("403") || m.includes("forbidden")) {
    return "Access denied for Dependabot alerts. Run gh auth refresh --scopes security_events or use a token with the repo scope. See scopes.md.";
  }
  return message;
}

/** Resets the Security alerts tab and clears its list (e.g. sign-out or scope reset). */
function resetDashboardSecurityAlertsUi(window: MainWindowInstance): void {
  securityAlertsFetchGeneration++;
  window.AppState.dashboard_active_tab = "itemsToReview";
  window.AppState.security_alerts_data_ready = false;
  window.AppState.security_alerts_total = 0;
  window.AppState.security_alerts_load_status = "";
  window.AppState.security_alerts_model = new slint.ArrayModel<SlintSecurityAlertRow>([]);
}

/**
 * Call after a successful save of the security alerts repository setting so the dashboard refetches if needed.
 */
export function onSecurityAlertsRepositorySaved(window: MainWindowInstance): void {
  securityAlertsFetchGeneration++;
  window.AppState.security_alerts_data_ready = false;
  window.AppState.security_alerts_total = 0;
  window.AppState.security_alerts_load_status = "";
  window.AppState.security_alerts_model = new slint.ArrayModel<SlintSecurityAlertRow>([]);
  if (window.AppState.dashboard_active_tab === "securityAlerts") {
    void refreshDashboardSecurityAlerts(window);
  }
}

export async function refreshDashboardSecurityAlerts(window: MainWindowInstance): Promise<void> {
  const gen = ++securityAlertsFetchGeneration;
  const parts = readSecurityAlertsRepositoryOwnerRepo();
  if (parts === null) {
    if (gen !== securityAlertsFetchGeneration) {
      return;
    }
    window.AppState.security_alerts_data_ready = true;
    window.AppState.security_alerts_total = 0;
    window.AppState.security_alerts_load_status =
      "Set a repository under Settings → Security alerts repository.";
    window.AppState.security_alerts_model = new slint.ArrayModel<SlintSecurityAlertRow>([]);
    return;
  }

  window.AppState.security_alerts_data_ready = false;
  window.AppState.security_alerts_load_status = "Loading security alerts…";
  window.AppState.security_alerts_model = new slint.ArrayModel<SlintSecurityAlertRow>([]);
  window.AppState.security_alerts_total = 0;

  const res = await fetchDependabotAlertsForRepo(parts.owner, parts.repo);
  if (gen !== securityAlertsFetchGeneration) {
    return;
  }

  if (!res.ok) {
    window.AppState.security_alerts_load_status = formatDependabotAlertsUserError(res.error);
    window.AppState.security_alerts_data_ready = false;
    return;
  }

  window.AppState.security_alerts_total = res.rows.length;
  window.AppState.security_alerts_load_status = "";
  window.AppState.security_alerts_data_ready = true;
  window.AppState.security_alerts_model = new slint.ArrayModel<SlintSecurityAlertRow>(
    res.rows.map((r) => ({
      title: r.summary,
      subtitle: `${r.severity} · ${r.ecosystem}/${r.packageName} · #${r.number} (${r.state})`,
      url: r.htmlUrl,
    })),
  );
}

/**
 * Clears persisted Time reporting project selection and Slint globals. Call on sign-out and when
 * `gh` is missing or scopes block login. Not called from `clearUserIdentity` (that also runs when
 * there is no viewer session cache yet at startup—see `applyAuthUi`).
 */
export function clearTimeReportingSelection(window: MainWindowInstance): void {
  clearTimeReportingSelectedProjectKv();
  window.TimeReportingState.picker_allow_cancel = false;
  window.TimeReportingState.picker_open = false;
  window.TimeReportingState.has_selected_project = false;
  window.TimeReportingState.selected_project_label = "";
  window.TimeReportingState.week_rows_model = new slint.ArrayModel<SlintTimeReportingWeekRow>([]);
  window.TimeReportingState.week_label = "";
  window.TimeReportingState.week_range_subtitle = "";
  window.TimeReportingState.week_hdr_mo = "";
  window.TimeReportingState.week_hdr_tu = "";
  window.TimeReportingState.week_hdr_we = "";
  window.TimeReportingState.week_hdr_th = "";
  window.TimeReportingState.week_hdr_fr = "";
  window.TimeReportingState.week_grid_hint = "";
  window.TimeReportingState.items_load_status = "";
  window.TimeReportingState.detail_open = false;
  window.TimeReportingState.detail_title = "";
  window.TimeReportingState.detail_body = "";
  resetTimeReportingItemsState();
}

/** Resets in-memory lists and org project cache; does not clear Time reporting KV (same GitHub user). */
export function resetListsWithoutClearingProfile(window: MainWindowInstance): void {
  window.AppState.view = "none";
  window.AppState.review_requests_data_ready = false;
  window.AppState.review_requests_total = 0;
  window.AppState.review_requests_load_status = "";
  window.AppState.review_requests_model = new slint.ArrayModel<SlintReviewRequestRow>([]);
  resetDashboardSecurityAlertsUi(window);
  clearSlintUiOrgProjectsCache();
  window.AppState.projects_search = "";
  window.AppState.projects_load_status = "";
  window.AppState.projects_filtered_model = new slint.ArrayModel<SlintProjectRow>([]);
  teardownSettingsDebugPanel(window);
}

export function applyCachedViewerToAppState(
  window: MainWindowInstance,
  cached: ViewerSessionV1,
): void {
  const v = cached.viewer;
  window.AppState.user_login = v.login;
  window.AppState.user_name = v.name ?? "";
  window.AppState.user_profile_url = v.url;
  window.AppState.user_status_message = v.statusMessage;
  window.AppState.user_status_emoji = v.statusEmoji;
}

export function clearUserIdentity(window: MainWindowInstance): void {
  clearViewerSessionCache();
  window.AppState.avatar = emptyTransparentAvatarImage;
  window.AppState.user_login = "";
  window.AppState.user_name = "";
  window.AppState.user_profile_url = "";
  window.AppState.user_status_message = "";
  window.AppState.user_status_emoji = "";
  window.AppState.view = "none";
  window.AppState.review_requests_data_ready = false;
  window.AppState.review_requests_total = 0;
  window.AppState.review_requests_load_status = "";
  window.AppState.review_requests_model = new slint.ArrayModel<SlintReviewRequestRow>([]);
  resetDashboardSecurityAlertsUi(window);
  clearSlintUiOrgProjectsCache();
  window.AppState.projects_search = "";
  window.AppState.projects_load_status = "";
  window.AppState.projects_filtered_model = new slint.ArrayModel<SlintProjectRow>([]);
  teardownSettingsDebugPanel(window);
}

export async function refreshDashboardReviewRequests(window: MainWindowInstance): Promise<void> {
  window.AppState.review_requests_data_ready = false;
  window.AppState.review_requests_load_status = "Loading review requests…";
  window.AppState.review_requests_model = new slint.ArrayModel<SlintReviewRequestRow>([]);
  window.AppState.review_requests_total = 0;
  const res = await fetchAllReviewRequestsSearch();
  if (!res.ok) {
    window.AppState.review_requests_load_status = res.error;
    return;
  }
  window.AppState.review_requests_total = res.issueCount;
  window.AppState.review_requests_load_status = "";
  window.AppState.review_requests_data_ready = true;
  window.AppState.review_requests_model = new slint.ArrayModel<SlintReviewRequestRow>(
    res.rows.map((r) => ({
      title: r.title,
      url: r.url,
      repo_label: r.repo_label,
    })),
  );
}

export function clearAuthDeviceFields(window: MainWindowInstance): void {
  window.auth_device_code = "";
  window.auth_device_url = "";
}

export async function refreshSlintUiOrgProjectsForWindow(
  window: MainWindowInstance,
): Promise<void> {
  window.AppState.projects_load_status = "Loading projects…";
  window.AppState.projects_filtered_model = new slint.ArrayModel<SlintProjectRow>([]);
  const res = await refreshSlintUiOrgProjectsCache();
  if (!res.ok) {
    window.AppState.projects_load_status = res.error;
    window.AppState.projects_filtered_model = new slint.ArrayModel<SlintProjectRow>([]);
    return;
  }
  window.AppState.projects_load_status = "";
  window.AppState.projects_filtered_model = buildFilteredProjectsModel(
    window.AppState.projects_search,
  );
}
