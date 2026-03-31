import * as slint from "slint-ui";
import { assignProperties, wireFunctions, type ExhaustiveCallbacks } from "slint-bridge-kit";
import { applyAuthUi, slintRunningCallback } from "./backend/auth/auth-ui-flow.ts";
import { closeAppDb, openAppDb } from "./backend/db/app-db.ts";
import { ghAuthLogout, spawnGhAuthLogin } from "./backend/gh/auth.ts";
import {
  buildFilteredProjectsModel,
  type SlintProjectRow,
} from "./backend/gh/slint-ui-org-projects-ui.ts";
import { copyTextToClipboard } from "./backend/utils/clipboard-write.ts";
import { openUrlInBrowser } from "./backend/utils/open-url.ts";
import { clearViewerSessionCache } from "./backend/session/viewer-session-cache.ts";
import type {
  AppStateHandle,
  MainWindowModule,
  SlintReviewRequestRow,
  SlintSecurityAlertRow,
  SlintSelectOption,
  SlintTimeReportingWeekRow,
} from "./slint-interface.ts";
import {
  hydrateTimeReportingFromKv,
  wireTimeReportingUi,
} from "./backend/time-reporting/time-reporting-ui.ts";
import {
  clearAuthDeviceFields,
  clearTimeReportingSelection,
  refreshDashboardReviewRequests,
  refreshDashboardSecurityAlerts,
} from "./slint-window-bridge.ts";
import { loadSettingsDebugPanel, teardownSettingsDebugPanel } from "./settings-debug-panel.ts";
import { applySecurityAlertsRepoEdited } from "./settings-security-alerts-repo.ts";

openAppDb();

const ui = slint.loadFile(new URL("./ui/main.slint", import.meta.url)) as MainWindowModule;

const window = new ui.MainWindow({
  status_message: "",
  "auth-device-code": "",
  "auth-device-url": "",
  "gh-cli-version-block-detail": "",
});

assignProperties(window.AppState, {
  projects_filtered_model: new slint.ArrayModel<SlintProjectRow>([]),
  review_requests_model: new slint.ArrayModel<SlintReviewRequestRow>([]),
  security_alerts_model: new slint.ArrayModel<SlintSecurityAlertRow>([]),
});

assignProperties(window.TimeReportingState, {
  week_rows_model: new slint.ArrayModel<SlintTimeReportingWeekRow>([]),
});

assignProperties(window.SettingsState, {
  primer_demo_select_options: new slint.ArrayModel<SlintSelectOption>([
    { value: "github.com", label: "github.com", enabled: true },
    { value: "enterprise", label: "GitHub Enterprise Server", enabled: true },
    { value: "disabled-demo", label: "Disabled (demo)", enabled: false },
  ]),
  primer_demo_selected_value: "github.com",
  primer_demo_selected_label: "github.com",
  primer_demo_select_changed: () => {},
});

hydrateTimeReportingFromKv(window);

const appStateCallbacks = {
  project_search_changed: (query: string) => {
    window.AppState.projects_filtered_model = buildFilteredProjectsModel(query);
  },
  open_project_url: (url: string) => {
    openUrlInBrowser(url);
  },
  dashboard_init: () => {
    void refreshDashboardReviewRequests(window);
  },
  dashboard_tab_changed: (tab) => {
    if (tab === "securityAlerts") {
      void refreshDashboardSecurityAlerts(window);
    }
  },
  sign_in: () => {
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
  },
  sign_out: () => {
    ghAuthLogout();
    clearViewerSessionCache();
    clearTimeReportingSelection(window);
    void applyAuthUi(window);
  },
} satisfies ExhaustiveCallbacks<
  AppStateHandle,
  | "project_search_changed"
  | "open_project_url"
  | "dashboard_init"
  | "dashboard_tab_changed"
  | "sign_in"
  | "sign_out"
>;
wireFunctions(window.AppState, appStateCallbacks);

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
