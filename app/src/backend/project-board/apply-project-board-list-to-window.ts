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

/** Default page size; assigned to `ProjectBoardListState.board_page_size` at startup. */
export const DEFAULT_PROJECT_BOARD_PAGE_SIZE = 10;

let cachedBoardRows: SlintProjectBoardListRow[] | null = null;

function effectiveBoardPageSize(window: MainWindowInstance): number {
  const n = window.ProjectBoardListState.board_page_size;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_PROJECT_BOARD_PAGE_SIZE;
}

/** Drop the in-memory full row list (e.g. sign-out, fetch error, or empty init). */
export function clearProjectBoardPagingCache(): void {
  cachedBoardRows = null;
}

function clampPageIndex(pageIndex: number, total: number, pageSize: number): number {
  if (total <= 0) {
    return 0;
  }
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return Math.max(0, Math.min(pageIndex, pageCount - 1));
}

/**
 * Updates `board_rows_model` / `board_data_table_rows` to a slice of the cached full board.
 * **`pageIndex`** is 0-based.
 */
export function applyProjectBoardPageSliceToWindow(
  window: MainWindowInstance,
  pageIndex: number,
): void {
  const pageSize = effectiveBoardPageSize(window);
  if (cachedBoardRows === null || cachedBoardRows.length === 0) {
    assignProperties(window.ProjectBoardListState, {
      board_rows_model: new slint.ArrayModel<SlintProjectBoardListRow>([]),
      board_data_table_rows: new slint.ArrayModel<SlintDataTableRow>([]),
      board_items_count: 0,
      board_page_index: 0,
    });
    return;
  }
  const total = cachedBoardRows.length;
  const idx = clampPageIndex(pageIndex, total, pageSize);
  const start = idx * pageSize;
  const slice = cachedBoardRows.slice(start, start + pageSize);
  const icons = getProjectBoardDataTableIconsFromWindow(window);
  const dataTableRows = mapProjectBoardListRowsToDataTableRows(slice, icons, start);
  assignProperties(window.ProjectBoardListState, {
    board_rows_model: new slint.ArrayModel<SlintProjectBoardListRow>(slice),
    board_data_table_rows: new slint.ArrayModel<SlintDataTableRow>(dataTableRows),
    board_items_count: total,
    board_page_index: idx,
  });
}

/**
 * Rebuilds the cached full row list from the time-reporting items cache, resets to page 0, and
 * applies the first slice to `board_rows_model` / `board_data_table_rows`.
 */
export function applyProjectBoardListToWindow(window: MainWindowInstance): void {
  const items = getTimeReportingCachedItems();
  if (items === null) {
    clearProjectBoardPagingCache();
    assignProperties(window.ProjectBoardListState, {
      board_rows_model: new slint.ArrayModel<SlintProjectBoardListRow>([]),
      board_data_table_rows: new slint.ArrayModel<SlintDataTableRow>([]),
      board_items_count: 0,
      board_page_index: 0,
    });
    return;
  }
  const rows = mapProjectV2ItemsToListRows(items);
  cachedBoardRows = rows;
  applyProjectBoardPageSliceToWindow(window, 0);
}
