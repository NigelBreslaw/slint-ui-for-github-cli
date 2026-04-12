import * as slint from "slint-ui";
import { assignProperties, type ExhaustiveAllCallbacks } from "slint-bridge-kit";
import type {
  MainWindowInstance,
  ProjectBoardListStateHandle,
  SlintDataTableRow,
  SlintProjectBoardListRow,
} from "../../bridges/node/slint-interface.ts";
import { openUrlInBrowser } from "../utils/open-url.ts";
import { reloadProjectV2ItemsIntoCacheAndUi } from "../time-reporting/time-reporting-ui.ts";
import {
  applyProjectBoardListToWindow,
  applyProjectBoardPageSliceToWindow,
  clearProjectBoardPagingCache,
} from "./apply-project-board-list-to-window.ts";
import {
  getTimeReportingCachedItems,
  getTimeReportingCachedProjectNodeId,
} from "../time-reporting/time-reporting-items-cache.ts";
import { readTimeReportingSelectedProjectKv } from "../time-reporting/time-reporting-selected-project-kv.ts";

export function buildProjectBoardListStateCallbacks(
  window: MainWindowInstance,
): ExhaustiveAllCallbacks<ProjectBoardListStateHandle> {
  return {
    project_board_list_view_init: () => {
      void (async () => {
        const stored = readTimeReportingSelectedProjectKv();
        if (stored === null) {
          clearProjectBoardPagingCache();
          assignProperties(window.ProjectBoardListState, {
            has_selected_project: false,
            selected_project_label: "",
            items_load_status: "",
            board_rows_model: new slint.ArrayModel<SlintProjectBoardListRow>([]),
            board_data_table_rows: new slint.ArrayModel<SlintDataTableRow>([]),
            board_items_count: 0,
            board_page_index: 0,
          });
          return;
        }
        assignProperties(window.ProjectBoardListState, {
          has_selected_project: true,
          selected_project_label: stored.title,
        });
        const cachedId = getTimeReportingCachedProjectNodeId();
        const items = getTimeReportingCachedItems();
        if (cachedId === stored.nodeId && items !== null) {
          assignProperties(window.ProjectBoardListState, { items_load_status: "" });
          applyProjectBoardListToWindow(window);
          return;
        }
        await reloadProjectV2ItemsIntoCacheAndUi(window, stored.nodeId);
      })();
    },

    project_board_list_view_exited: () => {
      assignProperties(window.ProjectBoardListState, { items_load_status: "" });
    },

    project_board_list_refresh: () => {
      const stored = readTimeReportingSelectedProjectKv();
      if (stored === null) {
        return;
      }
      void reloadProjectV2ItemsIntoCacheAndUi(window, stored.nodeId);
    },

    project_board_list_open_row_url: (url: string) => {
      if (url.length > 0) {
        openUrlInBrowser(url);
      }
    },

    project_board_page_changed: (pageIndex: number) => {
      applyProjectBoardPageSliceToWindow(window, pageIndex);
    },
  };
}
