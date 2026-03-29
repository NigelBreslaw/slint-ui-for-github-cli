/**
 * TypeScript view of the Slint `MainWindow` and globals (`AppState`, `SettingsState`,
 * `TimeReportingState`) wired from
 * [`ui/main.slint`](./ui/main.slint) / [`ui/app-state.slint`](./ui/app-state.slint). Keep string
 * unions aligned with Slint enums (slint-node uses kebab-case for `AppState.auth`).
 */
import * as slint from "slint-ui";
import type { SlintRgbaImage } from "./gh/avatar-image.ts";
import type { SlintProjectRow } from "./gh/slint-ui-org-projects-ui.ts";

/** Row shape must match `ReviewRequestRow` in `app-state.slint`. */
export type SlintReviewRequestRow = {
  title: string;
  url: string;
  repo_label: string;
};

/** Maps to `Authed` in `app-state.slint` (kebab-case on the wire). */
export type AuthedAuthState = "loggedOut" | "noGhCliInstalled" | "loggedIn" | "authorizing";

/** Maps to `View` in `app-state.slint`. */
export type AppStateView = "none" | "dashboard" | "settings" | "timeReporting";

export type AppStateHandle = {
  auth: AuthedAuthState;
  user_login: string;
  user_name: string;
  user_profile_url: string;
  user_status_message: string;
  user_status_emoji: string;
  avatar?: SlintRgbaImage;
  view: AppStateView;
  review_requests_data_ready: boolean;
  review_requests_total: number;
  review_requests_load_status: string;
  review_requests_model: slint.ArrayModel<SlintReviewRequestRow>;
  projects_search: string;
  projects_load_status: string;
  projects_filtered_model: slint.ArrayModel<SlintProjectRow>;
  project_search_changed: (query: string) => void;
  sign_out: () => void;
  sign_in: () => void;
  open_project_url: (url: string) => void;
  dashboard_init: () => void;
};

export type SettingsStateHandle = {
  settings_init: () => void;
  settings_exited: () => void;
  settings_debug_gh_version: string;
  settings_debug_rate_limit: string;
  settings_debug_reset_at: string;
  settings_debug_countdown: string;
  settings_debug_app_version: string;
  settings_debug_commit_label: string;
  settings_debug_error: string;
};

export type TimeReportingStateHandle = {
  time_reporting_project_chosen: (id: string) => void;
  time_reporting_picker_cancel: () => void;
  time_reporting_open_change_project: () => void;
  picker_allow_cancel: boolean;
  picker_open: boolean;
  has_selected_project: boolean;
  selected_project_label: string;
};

export type MainWindowInstance = {
  run(): Promise<void>;
  show(): void;
  hide(): void;
  AppState: AppStateHandle;
  SettingsState: SettingsStateHandle;
  TimeReportingState: TimeReportingStateHandle;
  login_clicked?: () => void;
  open_github_device_clicked?: () => void;
  show_auth_window: () => void;
  close_auth_window: () => void;
  show_no_gh_cli_installed: () => void;
  open_cli_install_page: () => void;
  status_message: string;
  auth_device_code: string;
  auth_device_url: string;
};

export type MainWindowOpts = {
  status_message?: string;
  "auth-device-code"?: string;
  "auth-device-url"?: string;
};

/** Result shape of `slint.loadFile(…/main.slint)` for the exported `MainWindow` component. */
export type MainWindowModule = {
  MainWindow: new (opts: MainWindowOpts) => MainWindowInstance;
};
