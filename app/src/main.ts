import * as slint from "slint-ui";
import {
  assignProperties,
  wireFunctions,
  type ExhaustiveAllCallbacks,
  type ExhaustiveCallbacks,
} from "slint-bridge-kit";
import { applyAuthUi, slintRunningCallback } from "./backend/auth/auth-ui-flow.ts";
import { closeAppDb, openAppDb } from "./backend/db/app-db.ts";
import { ghAuthLogout, spawnGhAuthLogin } from "./backend/gh/auth.ts";
import {
  applyProjectPickerSliceToWindow,
  DEFAULT_PROJECT_PICKER_PAGE_SIZE,
  type SlintProjectRow,
} from "./backend/gh/slint-ui-org-projects-ui.ts";
import { copyTextToClipboard } from "./backend/utils/clipboard-write.ts";
import { openUrlInBrowser } from "./backend/utils/open-url.ts";
import { clearViewerSessionCache } from "./backend/session/viewer-session-cache.ts";
import type {
  AppStateHandle,
  MainWindowInstance,
  MainWindowModule,
  SettingsStateHandle,
  ShellDialogsStateHandle,
  SlintDataTableRow,
  SlintImportCandidateRow,
  SlintProjectBoardListRow,
  SlintReviewRequestRow,
  SlintSecurityAlertRow,
  SlintSelectOption,
  SlintTimeReportingWeekRow,
} from "./bridges/node/slint-interface.ts";
import { authed, dashboardTab } from "./bridges/node/slint-interface.ts";
import { DEFAULT_PROJECT_BOARD_PAGE_SIZE } from "./backend/project-board/apply-project-board-list-to-window.ts";
import { buildProjectBoardListStateCallbacks } from "./backend/project-board/project-board-list-ui.ts";
import { hydrateProjectBoardListLabelsFromKv } from "./backend/project-board/hydrate-project-board-list-from-kv.ts";
import {
  buildTimeReportingStateCallbacks,
  hydrateTimeReportingFromKv,
} from "./backend/time-reporting/time-reporting-ui.ts";
import {
  clearAuthDeviceFields,
  clearTimeReportingSelection,
  refreshDashboardReviewRequests,
  refreshDashboardSecurityAlerts,
} from "./bridges/node/slint-window-bridge.ts";
import {
  loadSettingsDebugPanel,
  teardownSettingsDebugPanel,
} from "./backend/settings/settings-debug-panel.ts";
import { applySecurityAlertsRepoEdited } from "./backend/settings/settings-security-alerts-repo.ts";
import {
  createMainWindowGeometryPersister,
  restoreMainWindowGeometry,
} from "./backend/window/window-geometry-main.ts";

openAppDb();

const ui = slint.loadFile(new URL("./ui/main.slint", import.meta.url)) as MainWindowModule;

const window = new ui.MainWindow({
  status_message: "",
});

restoreMainWindowGeometry(window);
const windowGeometryPersister = createMainWindowGeometryPersister(window);

assignProperties(window.AppState, {
  projects_filtered_model: new slint.ArrayModel<SlintProjectRow>([]),
  projects_picker_select_options: new slint.ArrayModel<SlintSelectOption>([]),
  projects_picker_options_count: 0,
  projects_picker_selected_index: -1,
  projects_filtered_count: 0,
  projects_picker_page_index: 0,
  projects_picker_page_size: DEFAULT_PROJECT_PICKER_PAGE_SIZE,
  review_requests_model: new slint.ArrayModel<SlintReviewRequestRow>([]),
  security_alerts_model: new slint.ArrayModel<SlintSecurityAlertRow>([]),
});

assignProperties(window.TimeReportingState, {
  week_rows_model: new slint.ArrayModel<SlintTimeReportingWeekRow>([]),
});

assignProperties(window.ProjectBoardListState, {
  board_rows_model: new slint.ArrayModel<SlintProjectBoardListRow>([]),
  board_data_table_rows: new slint.ArrayModel<SlintDataTableRow>([]),
  board_items_count: 0,
  board_page_index: 0,
  board_page_size: DEFAULT_PROJECT_BOARD_PAGE_SIZE,
  import_dialog_open: false,
  import_repos_search: "",
  import_repos_load_status: "",
  import_repo_options_count: 0,
  import_repo_selected_index: -1,
  import_repo_select_options: new slint.ArrayModel<SlintSelectOption>([]),
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
  board_import_success_message: "",
});

assignProperties(window.SettingsState, {
  primer_demo_select_options: new slint.ArrayModel<SlintSelectOption>([
    { value: "github.com", label: "github.com", enabled: true },
    { value: "enterprise", label: "GitHub Enterprise Server", enabled: true },
    { value: "disabled-demo", label: "Disabled (demo)", enabled: false },
  ]),
  primer_demo_selected_index: 0,
});

assignProperties(window.ShellDialogsState, {
  no_gh_cli_dialog_open: false,
  gh_cli_version_dialog_open: false,
  auth_device_flow_open: false,
  gh_cli_version_block_detail: "",
  auth_device_code: "",
  auth_device_url: "",
});

hydrateTimeReportingFromKv(window);
hydrateProjectBoardListLabelsFromKv(window);

const appStateCallbacks = {
  project_search_changed: (query: string) => {
    applyProjectPickerSliceToWindow(window, 0, query);
  },
  projects_picker_page_changed: (pageIndex: number) => {
    applyProjectPickerSliceToWindow(window, pageIndex);
  },
  open_project_url: (url: string) => {
    openUrlInBrowser(url);
  },
  dashboard_init: () => {
    void refreshDashboardReviewRequests(window);
  },
  dashboard_tab_changed: (tab) => {
    if (tab === dashboardTab.securityAlerts) {
      void refreshDashboardSecurityAlerts(window);
    }
  },
  sign_in: () => {
    clearAuthDeviceFields(window);
    assignProperties(window.AppState, { auth: authed.authorizing });
    assignProperties(window.ShellDialogsState, { auth_device_flow_open: true });
    spawnGhAuthLogin({
      onDeviceFlowInfo: (info) => {
        assignProperties(window.ShellDialogsState, {
          auth_device_code: info.code,
          auth_device_url: info.url,
        });
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
} satisfies ExhaustiveAllCallbacks<AppStateHandle>;
wireFunctions(window.AppState, appStateCallbacks);

const settingsStateCallbacks = {
  primer_demo_select_changed: (_index: number) => {
    window.SettingsState.primer_demo_selected_index = _index;
  },
  security_alerts_repo_edited: (text: string) => {
    applySecurityAlertsRepoEdited(window, text);
  },
  settings_init: () => {
    void loadSettingsDebugPanel(window);
  },
  settings_exited: () => {
    teardownSettingsDebugPanel(window);
  },
} satisfies ExhaustiveAllCallbacks<SettingsStateHandle>;
wireFunctions(window.SettingsState, settingsStateCallbacks);

wireFunctions(window.TimeReportingState, buildTimeReportingStateCallbacks(window));

wireFunctions(window.ProjectBoardListState, buildProjectBoardListStateCallbacks(window));

const shellDialogsCallbacks = {
  open_cli_install_page: () => {
    openUrlInBrowser("https://cli.github.com/");
  },
  open_github_device_clicked: () => {
    void copyTextToClipboard(window.ShellDialogsState.auth_device_code).finally(() => {
      openUrlInBrowser(window.ShellDialogsState.auth_device_url);
    });
  },
} satisfies ExhaustiveAllCallbacks<ShellDialogsStateHandle>;
wireFunctions(window.ShellDialogsState, shellDialogsCallbacks);

const mainWindowHandlers = {
  viewport_changed: () => {
    windowGeometryPersister.schedulePersist();
  },
} satisfies ExhaustiveCallbacks<MainWindowInstance, "viewport_changed">;
wireFunctions(window, mainWindowHandlers);

window.show();
applyAuthUi(window);
await slint.runEventLoop({
  runningCallback: () => {
    slintRunningCallback(window);
  },
});
teardownSettingsDebugPanel(window);
windowGeometryPersister.persistNow();
windowGeometryPersister.dispose();
window.hide();
closeAppDb();
// Slint's Node bridge uses a repeating timer (~16 ms) merged with Node's loop; a TTY also
// keeps stdin/stdout/stderr referenced, so the process would not exit on its own after the UI closes.
process.exit(0);
