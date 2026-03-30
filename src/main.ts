import * as slint from "slint-ui";
import { applyAuthUi, slintRunningCallback } from "./auth/auth-ui-flow.ts";
import { closeAppDb, openAppDb } from "./db/app-db.ts";
import { ghAuthLogout, spawnGhAuthLogin } from "./gh/auth.ts";
import { buildFilteredProjectsModel, type SlintProjectRow } from "./gh/slint-ui-org-projects-ui.ts";
import { copyTextToClipboard } from "./utils/clipboard-write.ts";
import { openUrlInBrowser } from "./utils/open-url.ts";
import { clearViewerSessionCache } from "./session/viewer-session-cache.ts";
import type {
  MainWindowModule,
  SlintReviewRequestRow,
  SlintSecurityAlertRow,
  SlintTimeReportingWeekRow,
} from "./slint-interface.ts";
import {
  hydrateTimeReportingFromKv,
  wireTimeReportingUi,
} from "./time-reporting/time-reporting-ui.ts";
import {
  clearAuthDeviceFields,
  clearTimeReportingSelection,
  refreshDashboardReviewRequests,
  refreshDashboardSecurityAlerts,
} from "./ui/app-window-bridge.ts";
import { loadSettingsDebugPanel, teardownSettingsDebugPanel } from "./ui/settings-debug-panel.ts";
import { applySecurityAlertsRepoEdited } from "./ui/settings-security-alerts-repo.ts";

openAppDb();

const ui = slint.loadFile(new URL("./ui/main.slint", import.meta.url)) as MainWindowModule;

const window = new ui.MainWindow({
  status_message: "",
  "auth-device-code": "",
  "auth-device-url": "",
  "gh-cli-version-block-detail": "",
});

window.AppState.projects_filtered_model = new slint.ArrayModel<SlintProjectRow>([]);
window.AppState.review_requests_model = new slint.ArrayModel<SlintReviewRequestRow>([]);
window.AppState.security_alerts_model = new slint.ArrayModel<SlintSecurityAlertRow>([]);
window.TimeReportingState.week_rows_model = new slint.ArrayModel<SlintTimeReportingWeekRow>([]);

hydrateTimeReportingFromKv(window);
window.AppState.project_search_changed = (query: string) => {
  window.AppState.projects_filtered_model = buildFilteredProjectsModel(query);
};

window.AppState.open_project_url = (url: string) => {
  openUrlInBrowser(url);
};

window.AppState.dashboard_init = () => {
  void refreshDashboardReviewRequests(window);
};

window.AppState.dashboard_tab_changed = (tab) => {
  if (tab === "securityAlerts") {
    void refreshDashboardSecurityAlerts(window);
  }
};

window.SettingsState.security_alerts_repo_edited = (text: string) => {
  applySecurityAlertsRepoEdited(window, text);
};

window.SettingsState.settings_init = () => {
  void loadSettingsDebugPanel(window);
};

window.SettingsState.settings_exited = () => {
  teardownSettingsDebugPanel(window);
};

wireTimeReportingUi(window);

window.TimeReportingState.time_reporting_open_row_url = (url: string) => {
  if (url.length > 0) {
    openUrlInBrowser(url);
  }
};

window.open_github_device_clicked = () => {
  void copyTextToClipboard(window.auth_device_code).finally(() => {
    openUrlInBrowser(window.auth_device_url);
  });
};

window.AppState.sign_in = () => {
  clearAuthDeviceFields(window);
  window.AppState.auth = "authorizing";
  window.show_auth_window();
  spawnGhAuthLogin({
    onDeviceFlowInfo: (info) => {
      window.auth_device_code = info.code;
      window.auth_device_url = info.url;
    },
    onClose: () => {
      clearAuthDeviceFields(window);
      void applyAuthUi(window);
    },
  });
};

window.AppState.sign_out = () => {
  ghAuthLogout();
  clearViewerSessionCache();
  clearTimeReportingSelection(window);
  void applyAuthUi(window);
};

window.open_cli_install_page = () => {
  openUrlInBrowser("https://cli.github.com/");
};

window.show();
applyAuthUi(window);
await slint.runEventLoop({
  runningCallback: () => {
    slintRunningCallback(window);
  },
});
teardownSettingsDebugPanel(window);
window.hide();
closeAppDb();
// Slint's Node bridge uses a repeating timer (~16 ms) merged with Node's loop; a TTY also
// keeps stdin/stdout/stderr referenced, so the process would not exit on its own after the UI closes.
process.exit(0);
