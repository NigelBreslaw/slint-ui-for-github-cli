import * as slint from "slint-ui";
import {
  buildFilteredProjectsModel,
  clearSlintUiOrgProjectsCache,
  refreshSlintUiOrgProjectsCache,
  type SlintProjectRow,
} from "../gh/slint-ui-org-projects-ui.ts";
import { emptyTransparentAvatarImage } from "../gh/avatar-image.ts";
import { fetchAllReviewRequestsSearch } from "../gh/graphql-review-requests.ts";
import type { MainWindowInstance, SlintReviewRequestRow } from "../slint-interface.ts";
import { resetTimeReportingItemsState } from "../time-reporting/time-reporting-items-cache.ts";
import { clearTimeReportingSelectedProjectKv } from "../time-reporting/time-reporting-selected-project-kv.ts";
import { clearViewerSessionCache, type ViewerSessionV1 } from "../session/viewer-session-cache.ts";
import { replaceArrayModelContents } from "../utils/replace-array-model.ts";
import { teardownSettingsDebugPanel } from "./settings-debug-panel.ts";

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
  replaceArrayModelContents(window.TimeReportingState.week_rows_model, []);
  window.TimeReportingState.week_label = "";
  window.TimeReportingState.week_range_subtitle = "";
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
