/**
 * TypeScript view of the Slint `MainWindow` and globals (`AppState`, `SettingsState`,
 * `TimeReportingState`, `ProjectBoardListState`) plus DataTable / Label wire enums in this module, wired from
 * [`ui/main.slint`](../../ui/main.slint) / [`bridges/slint/app-state.slint`](../slint/app-state.slint).
 * Slint enum cases use the same spelling as in `.slint` (camelCase here); wire values are defined
 * once via `slintEnumMembers` so call sites use dot access and unions stay in sync.
 */
import * as slint from "slint-ui";
import { slintEnumMembers, type SlintEnumValues } from "slint-bridge-kit";
import type { SlintRgbaImage } from "../../backend/gh/avatar-image.ts";
import type { SlintProjectRow } from "../../backend/gh/slint-ui-org-projects-ui.ts";

/** Row shape must match `ReviewRequestRow` in `app-state.slint`. */
export type SlintReviewRequestRow = {
  title: string;
  url: string;
  repo_label: string;
  author_login: string;
};

/** Row shape must match `SecurityAlertRow` in `app-state.slint`. */
export type SlintSecurityAlertRow = {
  title: string;
  subtitle: string;
  url: string;
};

/** Maps to `DashboardTab` in `app-state.slint`. */
export const dashboardTab = slintEnumMembers(["itemsToReview", "securityAlerts"] as const);
export type DashboardTab = SlintEnumValues<typeof dashboardTab>;

/** Maps to `Authed` in `app-state.slint`. */
export const authed = slintEnumMembers([
  "loggedOut",
  "noGhCliInstalled",
  "ghCliVersionTooOld",
  "loggedIn",
  "authorizing",
] as const);
export type Authed = SlintEnumValues<typeof authed>;

/** Maps to `AppView` in `app-state.slint`. */
export const appView = slintEnumMembers([
  "dashboard",
  "settings",
  "timeReporting",
  "projectBoardList",
  "primerGallery",
] as const);
export type AppView = SlintEnumValues<typeof appView>;

export type AppStateHandle = {
  auth: Authed;
  user_login: string;
  user_name: string;
  user_profile_url: string;
  user_status_message: string;
  user_status_emoji: string;
  avatar?: SlintRgbaImage;
  view: AppView;
  review_requests_data_ready: boolean;
  review_requests_total: number;
  review_requests_load_status: string;
  review_requests_model: slint.ArrayModel<SlintReviewRequestRow>;
  dashboard_active_tab: DashboardTab;
  security_alerts_data_ready: boolean;
  security_alerts_total: number;
  security_alerts_load_status: string;
  security_alerts_model: slint.ArrayModel<SlintSecurityAlertRow>;
  dashboard_tab_changed: (tab: DashboardTab) => void;
  projects_search: string;
  projects_load_status: string;
  projects_filtered_model: slint.ArrayModel<SlintProjectRow>;
  project_search_changed: (query: string) => void;
  window_geometry_changed: (width: number, height: number) => void;
  sign_out: () => void;
  sign_in: () => void;
  open_project_url: (url: string) => void;
  dashboard_init: () => void;
};

/** Row shape must match `SelectOption` in `primer-select-common.slint`. */
export type SlintSelectOption = {
  value: string;
  label: string;
  enabled: boolean;
};

export type SettingsStateHandle = {
  settings_init: () => void;
  settings_exited: () => void;
  primer_demo_select_options: slint.ArrayModel<SlintSelectOption>;
  primer_demo_select_changed: (value: number) => void;
  primer_demo_selected_index: number;
  security_alerts_repo_input: string;
  security_alerts_repo_error: string;
  security_alerts_repo_edited: (text: string) => void;
  settings_debug_gh_version: string;
  settings_debug_rate_limit: string;
  settings_debug_reset_at: string;
  settings_debug_countdown: string;
  settings_debug_commit_label: string;
  settings_debug_error: string;
};

/** Matches `TimeReportingWeekRow` in `time-reporting-state.slint` (Slint `item-id` → `item_id`). */
export type SlintTimeReportingWeekRow = {
  item_id: string;
  grid_week_key: string;
  title: string;
  url: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  total: string;
};

/** Maps to `ProjectBoardItemKind` in `project-board-list-state.slint`. */
export const projectBoardItemKind = slintEnumMembers([
  "pullRequest",
  "issue",
  "draftIssue",
] as const);
export type ProjectBoardItemKind = SlintEnumValues<typeof projectBoardItemKind>;

/** Maps to `DataTableCellKind` in `DataTable/types.slint`. */
export const dataTableCellKind = slintEnumMembers(["text", "label", "icon_text", "action"] as const);
export type DataTableCellKindWire = SlintEnumValues<typeof dataTableCellKind>;

/** Maps to `LabelVariant` in `Label/types.slint` (cell placeholders). */
export const labelVariant = slintEnumMembers([
  "default",
  "primary",
  "secondary",
  "accent",
  "success",
  "attention",
  "severe",
  "danger",
  "done",
  "sponsors",
] as const);
export type LabelVariantWire = SlintEnumValues<typeof labelVariant>;

/** Maps to `LabelSize` in `Label/types.slint`. */
export const labelSize = slintEnumMembers(["small", "large"] as const);
export type LabelSizeWire = SlintEnumValues<typeof labelSize>;

/** Pixel buffer for Slint `image` on `DataTableCell` (Node bridge). */
export type SlintDataTableImage = {
  width: number;
  height: number;
  data: Buffer | Uint8Array;
};

/** Matches `DataTableCell` in `DataTable/types.slint` (Node uses `label_*` for hyphenated fields). */
export type SlintDataTableCell = {
  kind: DataTableCellKindWire;
  text: string;
  label_variant: LabelVariantWire;
  label_size: LabelSizeWire;
  icon: SlintDataTableImage;
};

/** Matches `DataTableRow` in `DataTable/types.slint`. */
export type SlintDataTableRow = {
  id: string;
  cells: SlintDataTableCell[];
};

/** Matches `ProjectBoardListRow` in `project-board-list-state.slint`. */
export type SlintProjectBoardListRow = {
  kind: ProjectBoardItemKind;
  state: string;
  number: number;
  title: string;
  subtitle: string;
  url: string;
};

export type ProjectBoardListStateHandle = {
  project_board_list_view_init: () => void;
  project_board_list_view_exited: () => void;
  project_board_list_refresh: () => void;
  project_board_list_open_row_url: (url: string) => void;
  has_selected_project: boolean;
  selected_project_label: string;
  items_load_status: string;
  board_items_count: number;
  board_rows_model: slint.ArrayModel<SlintProjectBoardListRow>;
  board_data_table_rows: slint.ArrayModel<SlintDataTableRow>;
};

export type TimeReportingStateHandle = {
  time_reporting_view_init: () => void;
  time_reporting_view_exited: () => void;
  time_reporting_project_chosen: (id: string) => void;
  time_reporting_picker_cancel: () => void;
  time_reporting_open_change_project: () => void;
  time_reporting_week_prev: () => void;
  time_reporting_week_next: () => void;
  time_reporting_week_this: () => void;
  time_reporting_refresh: () => void;
  time_reporting_time_cell_clicked: (row_index: number, day_index: number) => void;
  time_reporting_open_row_url: (url: string) => void;
  time_reporting_detail_close: () => void;
  picker_allow_cancel: boolean;
  picker_open: boolean;
  has_selected_project: boolean;
  selected_project_label: string;
  week_rows_model: slint.ArrayModel<SlintTimeReportingWeekRow>;
  items_load_status: string;
  week_label: string;
  week_range_subtitle: string;
  week_hdr_mo: string;
  week_hdr_tu: string;
  week_hdr_we: string;
  week_hdr_th: string;
  week_hdr_fr: string;
  week_grid_hint: string;
  detail_open: boolean;
  detail_title: string;
  detail_body: string;
};

export type MainWindowInstance = {
  run(): Promise<void>;
  show(): void;
  hide(): void;
  window: import("slint-ui").Window;
  AppState: AppStateHandle;
  SettingsState: SettingsStateHandle;
  TimeReportingState: TimeReportingStateHandle;
  ProjectBoardListState: ProjectBoardListStateHandle;
  login_clicked?: () => void;
  open_github_device_clicked?: () => void;
  show_auth_window: () => void;
  close_auth_window: () => void;
  show_no_gh_cli_installed: () => void;
  show_gh_cli_version_too_old: () => void;
  open_cli_install_page: () => void;
  gh_cli_version_block_detail: string;
  status_message: string;
  auth_device_code: string;
  auth_device_url: string;
};

export type MainWindowOpts = {
  status_message?: string;
  "auth-device-code"?: string;
  "auth-device-url"?: string;
  "gh-cli-version-block-detail"?: string;
};

/** Result shape of `slint.loadFile(…/main.slint)` for the exported `MainWindow` component. */
export type MainWindowModule = {
  MainWindow: new (opts: MainWindowOpts) => MainWindowInstance;
};
