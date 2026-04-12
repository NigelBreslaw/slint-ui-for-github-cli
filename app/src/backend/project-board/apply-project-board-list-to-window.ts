import * as slint from "slint-ui";
import { assignProperties } from "slint-bridge-kit";
import type {
  MainWindowInstance,
  SlintDataTableRow,
  SlintProjectBoardListRow,
} from "../../bridges/node/slint-interface.ts";
import { getTimeReportingCachedItems } from "../time-reporting/time-reporting-items-cache.ts";
import { getProjectBoardDataTableIconsFromWindow } from "./project-board-datatable-icons.ts";
import { mapProjectBoardListRowsToDataTableRows } from "./map-project-board-list-to-data-table-rows.ts";
import { mapProjectV2ItemsToListRows } from "./map-project-v2-items-to-list-rows.ts";

/**
 * Fills `ProjectBoardListState.board_rows_model` and **`board_data_table_rows`** from the time-reporting items cache
 * (full board, not week-filtered).
 */
export function applyProjectBoardListToWindow(window: MainWindowInstance): void {
  const items = getTimeReportingCachedItems();
  if (items === null) {
    assignProperties(window.ProjectBoardListState, {
      board_rows_model: new slint.ArrayModel<SlintProjectBoardListRow>([]),
      board_data_table_rows: new slint.ArrayModel<SlintDataTableRow>([]),
      board_items_count: 0,
    });
    return;
  }
  const rows = mapProjectV2ItemsToListRows(items);
  const icons = getProjectBoardDataTableIconsFromWindow(window);
  const dataTableRows = mapProjectBoardListRowsToDataTableRows(rows, icons);
  assignProperties(window.ProjectBoardListState, {
    board_rows_model: new slint.ArrayModel<SlintProjectBoardListRow>(rows),
    board_data_table_rows: new slint.ArrayModel<SlintDataTableRow>(dataTableRows),
    board_items_count: rows.length,
  });
}
