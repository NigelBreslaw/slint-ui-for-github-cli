import * as slint from "slint-ui";
import { assignProperties } from "slint-bridge-kit";
import {
  applyProjectPickerSliceToWindow,
  clearSlintUiOrgProjectsCache,
  refreshSlintUiOrgProjectsCache,
  type SlintProjectRow,
} from "../../backend/gh/slint-ui-org-projects-ui.ts";
import { emptyTransparentAvatarImage } from "../../backend/gh/avatar-image.ts";
import { fetchDependabotAlertsForRepo } from "../../backend/gh/dependabot-alerts.ts";
import { fetchAllReviewRequestsSearch } from "../../backend/gh/graphql-review-requests.ts";
import type {
  MainWindowInstance,
  SlintDataTableRow,
  SlintImportCandidateRow,
  SlintProjectBoardListRow,
  SlintReviewRequestRow,
  SlintSecurityAlertRow,
  SlintSelectOption,
  SlintTimeReportingWeekRow,
} from "./slint-interface.ts";
import { appView, dashboardTab } from "./slint-interface.ts";
import { readSecurityAlertsRepositoryOwnerRepo } from "../../backend/settings/security-alerts-repo-kv.ts";
import { clearProjectBoardPagingCache } from "../../backend/project-board/apply-project-board-list-to-window.ts";
import { resetTimeReportingItemsState } from "../../backend/time-reporting/time-reporting-items-cache.ts";
import { clearTimeReportingSelectedProjectKv } from "../../backend/time-reporting/time-reporting-selected-project-kv.ts";
import {
  clearViewerSessionCache,
  type ViewerSessionV1,
} from "../../backend/session/viewer-session-cache.ts";
import { teardownSettingsDebugPanel } from "../../backend/settings/settings-debug-panel.ts";

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
  assignProperties(window.AppState, {
    dashboard_active_tab: dashboardTab.itemsToReview,
    security_alerts_data_ready: false,
    security_alerts_total: 0,
    security_alerts_load_status: "",
    security_alerts_model: new slint.ArrayModel<SlintSecurityAlertRow>([]),
  });
}

/**
 * Call after a successful save of the security alerts repository setting so the dashboard refetches if needed.
 */
export function onSecurityAlertsRepositorySaved(window: MainWindowInstance): void {
  securityAlertsFetchGeneration++;
  assignProperties(window.AppState, {
    security_alerts_data_ready: false,
    security_alerts_total: 0,
    security_alerts_load_status: "",
    security_alerts_model: new slint.ArrayModel<SlintSecurityAlertRow>([]),
  });
  if (window.AppState.dashboard_active_tab === dashboardTab.securityAlerts) {
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
    assignProperties(window.AppState, {
      security_alerts_data_ready: true,
      security_alerts_total: 0,
      security_alerts_load_status: "Set a repository under Settings → Security alerts repository.",
      security_alerts_model: new slint.ArrayModel<SlintSecurityAlertRow>([]),
    });
    return;
  }

  assignProperties(window.AppState, {
    security_alerts_data_ready: false,
    security_alerts_load_status: "Loading security alerts…",
    security_alerts_model: new slint.ArrayModel<SlintSecurityAlertRow>([]),
    security_alerts_total: 0,
  });

  const res = await fetchDependabotAlertsForRepo(parts.owner, parts.repo);
  if (gen !== securityAlertsFetchGeneration) {
    return;
  }

  if (!res.ok) {
    assignProperties(window.AppState, {
      security_alerts_load_status: formatDependabotAlertsUserError(res.error),
      security_alerts_data_ready: false,
    });
    return;
  }

  assignProperties(window.AppState, {
    security_alerts_total: res.rows.length,
    security_alerts_load_status: "",
    security_alerts_data_ready: true,
    security_alerts_model: new slint.ArrayModel<SlintSecurityAlertRow>(
      res.rows.map((r) => ({
        title: r.summary,
        subtitle: `${r.severity} · ${r.ecosystem}/${r.packageName} · #${r.number} (${r.state})`,
        url: r.htmlUrl,
      })),
    ),
  });
}

/**
 * Clears persisted Time reporting project selection and Slint globals. Call on sign-out and when
 * `gh` is missing or scopes block login. Not called from `clearUserIdentity` (that also runs when
 * there is no viewer session cache yet at startup—see `applyAuthUi`).
 */
export function clearTimeReportingSelection(window: MainWindowInstance): void {
  clearTimeReportingSelectedProjectKv();
  assignProperties(window.TimeReportingState, {
    picker_allow_cancel: false,
    picker_open: false,
    has_selected_project: false,
    selected_project_label: "",
    week_rows_model: new slint.ArrayModel<SlintTimeReportingWeekRow>([]),
    week_label: "",
    week_range_subtitle: "",
    week_hdr_mo: "",
    week_hdr_tu: "",
    week_hdr_we: "",
    week_hdr_th: "",
    week_hdr_fr: "",
    week_grid_hint: "",
    items_load_status: "",
    detail_open: false,
    detail_title: "",
    detail_body: "",
  });
  clearProjectBoardPagingCache();
  assignProperties(window.ProjectBoardListState, {
    has_selected_project: false,
    selected_project_label: "",
    board_import_success_message: "",
    items_load_status: "",
    board_items_count: 0,
    board_page_index: 0,
    board_rows_model: new slint.ArrayModel<SlintProjectBoardListRow>([]),
    board_data_table_rows: new slint.ArrayModel<SlintDataTableRow>([]),
    import_candidates_load_status: "",
    import_candidate_count: 0,
    import_candidate_rows: new slint.ArrayModel<SlintImportCandidateRow>([]),
    import_candidates_search: "",
    import_candidates_has_more: false,
    import_candidates_load_more_busy: false,
    import_candidates_total_loaded: 0,
    import_selected_count: 0,
    import_add_selected_busy: false,
    import_add_selected_message: "",
  });
  resetTimeReportingItemsState();
}

/** Resets in-memory lists and org project cache; does not clear Time reporting KV (same GitHub user). */
export function resetListsWithoutClearingProfile(window: MainWindowInstance): void {
  assignProperties(window.AppState, {
    review_requests_data_ready: false,
    review_requests_total: 0,
    review_requests_load_status: "",
    review_requests_model: new slint.ArrayModel<SlintReviewRequestRow>([]),
  });
  resetDashboardSecurityAlertsUi(window);
  clearSlintUiOrgProjectsCache();
  assignProperties(window.AppState, {
    projects_search: "",
    projects_load_status: "",
    projects_filtered_model: new slint.ArrayModel<SlintProjectRow>([]),
    projects_picker_select_options: new slint.ArrayModel<SlintSelectOption>([]),
    projects_picker_options_count: 0,
    projects_picker_selected_index: -1,
    projects_filtered_count: 0,
    projects_picker_page_index: 0,
  });
  teardownSettingsDebugPanel(window);
}

export function applyCachedViewerToAppState(
  window: MainWindowInstance,
  cached: ViewerSessionV1,
): void {
  const v = cached.viewer;
  assignProperties(window.AppState, {
    user_login: v.login,
    user_name: v.name ?? "",
    user_profile_url: v.url,
    user_status_message: v.statusMessage,
    user_status_emoji: v.statusEmoji,
  });
}

export function clearUserIdentity(window: MainWindowInstance): void {
  clearViewerSessionCache();
  assignProperties(window.AppState, {
    avatar: emptyTransparentAvatarImage,
    user_login: "",
    user_name: "",
    user_profile_url: "",
    user_status_message: "",
    user_status_emoji: "",
    view: appView.dashboard,
    review_requests_data_ready: false,
    review_requests_total: 0,
    review_requests_load_status: "",
    review_requests_model: new slint.ArrayModel<SlintReviewRequestRow>([]),
  });
  resetDashboardSecurityAlertsUi(window);
  clearSlintUiOrgProjectsCache();
  assignProperties(window.AppState, {
    projects_search: "",
    projects_load_status: "",
    projects_filtered_model: new slint.ArrayModel<SlintProjectRow>([]),
    projects_picker_select_options: new slint.ArrayModel<SlintSelectOption>([]),
    projects_picker_options_count: 0,
    projects_picker_selected_index: -1,
    projects_filtered_count: 0,
    projects_picker_page_index: 0,
  });
  teardownSettingsDebugPanel(window);
}

export async function refreshDashboardReviewRequests(window: MainWindowInstance): Promise<void> {
  assignProperties(window.AppState, {
    review_requests_data_ready: false,
    review_requests_load_status: "Loading review requests…",
    review_requests_model: new slint.ArrayModel<SlintReviewRequestRow>([]),
    review_requests_total: 0,
  });
  const res = await fetchAllReviewRequestsSearch();
  if (!res.ok) {
    assignProperties(window.AppState, { review_requests_load_status: res.error });
    return;
  }
  assignProperties(window.AppState, {
    review_requests_total: res.issueCount,
    review_requests_load_status: "",
    review_requests_data_ready: true,
    review_requests_model: new slint.ArrayModel<SlintReviewRequestRow>(
      res.rows.map((r) => ({
        title: r.title,
        url: r.url,
        repo_label: r.repo_label,
        author_login: r.author_login,
      })),
    ),
  });
}

export function clearAuthDeviceFields(window: MainWindowInstance): void {
  assignProperties(window.ShellDialogsState, {
    auth_device_code: "",
    auth_device_url: "",
  });
}

export async function refreshSlintUiOrgProjectsForWindow(
  window: MainWindowInstance,
): Promise<void> {
  assignProperties(window.AppState, {
    projects_load_status: "Loading projects…",
    projects_filtered_model: new slint.ArrayModel<SlintProjectRow>([]),
    projects_picker_select_options: new slint.ArrayModel<SlintSelectOption>([]),
    projects_picker_options_count: 0,
    projects_picker_selected_index: -1,
    projects_filtered_count: 0,
    projects_picker_page_index: 0,
  });
  const res = await refreshSlintUiOrgProjectsCache();
  if (!res.ok) {
    assignProperties(window.AppState, {
      projects_load_status: res.error,
      projects_filtered_model: new slint.ArrayModel<SlintProjectRow>([]),
      projects_picker_select_options: new slint.ArrayModel<SlintSelectOption>([]),
      projects_picker_options_count: 0,
      projects_picker_selected_index: -1,
      projects_filtered_count: 0,
      projects_picker_page_index: 0,
    });
    return;
  }
  assignProperties(window.AppState, { projects_load_status: "" });
  applyProjectPickerSliceToWindow(window, 0);
}
