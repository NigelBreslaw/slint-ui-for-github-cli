import type { MainWindowInstance } from "../slint-interface.ts";
import {
  buildFilteredProjectsModel,
  findSlintUiOpenProjectRowByNodeId,
} from "../gh/slint-ui-org-projects-ui.ts";
import { refreshSlintUiOrgProjectsForWindow } from "../ui/app-window-bridge.ts";
import {
  TIME_REPORTING_SELECTED_PROJECT_SCHEMA_VERSION,
  writeTimeReportingSelectedProjectKv,
} from "./time-reporting-selected-project-kv.ts";

function closeTimeReportingPicker(window: MainWindowInstance): void {
  window.TimeReportingState.picker_open = false;
  window.TimeReportingState.picker_allow_cancel = false;
}

export function wireTimeReportingUi(window: MainWindowInstance): void {
  window.TimeReportingState.time_reporting_view_init = () => {
    void (async () => {
      await refreshSlintUiOrgProjectsForWindow(window);
      if (!window.TimeReportingState.has_selected_project) {
        window.TimeReportingState.picker_allow_cancel = false;
        window.TimeReportingState.picker_open = true;
      }
    })();
  };

  window.TimeReportingState.time_reporting_view_exited = () => {
    closeTimeReportingPicker(window);
  };

  window.TimeReportingState.time_reporting_picker_cancel = () => {
    closeTimeReportingPicker(window);
  };

  window.TimeReportingState.time_reporting_open_change_project = () => {
    window.AppState.projects_search = "";
    window.AppState.projects_filtered_model = buildFilteredProjectsModel("");
    window.TimeReportingState.picker_allow_cancel = true;
    window.TimeReportingState.picker_open = true;
    void refreshSlintUiOrgProjectsForWindow(window);
  };

  window.TimeReportingState.time_reporting_project_chosen = (id: string) => {
    const row = findSlintUiOpenProjectRowByNodeId(id);
    if (row === null) {
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
  };
}
