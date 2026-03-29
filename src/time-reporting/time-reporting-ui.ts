import type { MainWindowInstance } from "../slint-interface.ts";
import {
  buildFilteredProjectsModel,
  findSlintUiOpenProjectRowByNodeId,
} from "../gh/slint-ui-org-projects-ui.ts";
import { refreshSlintUiOrgProjectsForWindow } from "../ui/app-window-bridge.ts";
import { dumpTimeReportingProjectNodeToDebugJson } from "./dump-time-reporting-project-debug.ts";
import {
  readTimeReportingSelectedProjectKv,
  TIME_REPORTING_SELECTED_PROJECT_SCHEMA_VERSION,
  writeTimeReportingSelectedProjectKv,
} from "./time-reporting-selected-project-kv.ts";

function closeTimeReportingPicker(window: MainWindowInstance): void {
  window.TimeReportingState.picker_open = false;
  window.TimeReportingState.picker_allow_cancel = false;
}

/** Apply `time_reporting/selected_project_v1` from SQLite to `TimeReportingState` (call on startup and when entering the view). */
export function hydrateTimeReportingFromKv(window: MainWindowInstance): void {
  const stored = readTimeReportingSelectedProjectKv();
  if (stored === null) {
    window.TimeReportingState.has_selected_project = false;
    window.TimeReportingState.selected_project_label = "";
    return;
  }
  window.TimeReportingState.has_selected_project = true;
  window.TimeReportingState.selected_project_label = stored.title;
}

function openMandatoryPicker(window: MainWindowInstance): void {
  window.TimeReportingState.picker_allow_cancel = false;
  window.TimeReportingState.picker_open = true;
}

function openOptionalPicker(window: MainWindowInstance): void {
  window.TimeReportingState.picker_allow_cancel = true;
  window.TimeReportingState.picker_open = true;
}

/** Wire `TimeReportingState` callbacks. On project pick, persists KV and writes unconditional `debug-json`. */
export function wireTimeReportingUi(window: MainWindowInstance): void {
  window.TimeReportingState.time_reporting_view_init = () => {
    void (async () => {
      hydrateTimeReportingFromKv(window);
      await refreshSlintUiOrgProjectsForWindow(window);
      if (!window.TimeReportingState.has_selected_project) {
        openMandatoryPicker(window);
      }
    })();
  };

  window.TimeReportingState.time_reporting_view_exited = () => {
    closeTimeReportingPicker(window);
  };

  window.TimeReportingState.time_reporting_picker_cancel = () => {
    if (!window.TimeReportingState.picker_allow_cancel) {
      return;
    }
    closeTimeReportingPicker(window);
  };

  window.TimeReportingState.time_reporting_open_change_project = () => {
    window.AppState.projects_search = "";
    window.AppState.projects_filtered_model = buildFilteredProjectsModel("");
    openOptionalPicker(window);
    void refreshSlintUiOrgProjectsForWindow(window);
  };

  window.TimeReportingState.time_reporting_project_chosen = (id: string) => {
    void (async () => {
      let row = findSlintUiOpenProjectRowByNodeId(id);
      if (row === null) {
        await refreshSlintUiOrgProjectsForWindow(window);
        row = findSlintUiOpenProjectRowByNodeId(id);
      }
      if (row === null) {
        console.error("[time-reporting] Unknown project id after refresh:", id);
        return;
      }
      writeTimeReportingSelectedProjectKv({
        schemaVersion: TIME_REPORTING_SELECTED_PROJECT_SCHEMA_VERSION,
        nodeId: row.id,
        number: row.number,
        title: row.title,
        url: row.url,
      });
      window.TimeReportingState.has_selected_project = true;
      window.TimeReportingState.selected_project_label = row.title;
      closeTimeReportingPicker(window);
      await dumpTimeReportingProjectNodeToDebugJson(row.id);
    })();
  };
}
