import * as slint from "slint-ui";
import { assignProperties, type ExhaustiveAllCallbacks } from "slint-bridge-kit";
import {
  addProjectV2ItemsByContentIdsSequential,
  type AddProjectV2ItemOutcome,
} from "../gh/graphql-add-project-v2-item.ts";
import { fetchRepoCandidatesPageGraphql } from "../gh/graphql-repo-candidates.ts";
import { fetchAllSlintUiOrgReposRest } from "../gh/fetch-slint-ui-org-repos-rest.ts";
import {
  compareUpdatedAtDesc,
  type RepoCandidateRow,
  type RepoCandidatesParsedPage,
} from "../schemas/gh-graphql-repo-candidates.ts";
import type { OrgRepoRow } from "../schemas/gh-rest-org-repos.ts";
import {
  projectBoardItemKind,
  type MainWindowInstance,
  type ProjectBoardListStateHandle,
  type SlintDataTableRow,
  type SlintImportCandidateRow,
  type SlintProjectBoardListRow,
  type SlintSelectOption,
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

let importReposCache: OrgRepoRow[] = [];

/** Accumulated GraphQL rows for the selected repo (PR7 pagination). */
let importCandidatesAccumulated: RepoCandidateRow[] = [];
let importCandidatesIssuesCursor: string | null = null;
let importCandidatesPrsCursor: string | null = null;
let importCandidatesIssuesHasNext = false;
let importCandidatesPrsHasNext = false;
/** Owner + repo name for `fetchRepoCandidatesPageGraphql` while the import dialog has a selection. */
let importCandidatesOwner = "";
let importCandidatesRepo = "";
const importCandidateSelectedIds = new Set<string>();

function mapOrgReposToSelectOptions(rows: readonly OrgRepoRow[]): SlintSelectOption[] {
  return rows.map((r) => ({
    value: r.fullName,
    label: r.fullName,
    enabled: true,
  }));
}

function filterOrgRepos(rows: readonly OrgRepoRow[], query: string): OrgRepoRow[] {
  const q = query.trim().toLowerCase();
  if (q === "") {
    return [...rows];
  }
  return rows.filter(
    (r) => r.fullName.toLowerCase().includes(q) || r.name.toLowerCase().includes(q),
  );
}

function parseOwnerNameFromFullName(fullName: string): { owner: string; name: string } | null {
  const i = fullName.indexOf("/");
  if (i <= 0 || i === fullName.length - 1) {
    return null;
  }
  return { owner: fullName.slice(0, i), name: fullName.slice(i + 1) };
}

function mergeCandidatePages(
  existing: readonly RepoCandidateRow[],
  page: readonly RepoCandidateRow[],
): RepoCandidateRow[] {
  return [...existing, ...page].sort((x, y) => compareUpdatedAtDesc(x.updatedAt, y.updatedAt));
}

function filterCandidatesBySearch(
  rows: readonly RepoCandidateRow[],
  query: string,
): RepoCandidateRow[] {
  const s = query.trim().toLowerCase();
  if (s === "") {
    return [...rows];
  }
  return rows.filter((r) => {
    const numStr = String(r.number);
    return (
      r.title.toLowerCase().includes(s) ||
      numStr.includes(s) ||
      `#${r.number}`.toLowerCase().includes(s)
    );
  });
}

function toSlintImportCandidateRow(
  r: RepoCandidateRow,
  selected: boolean,
): SlintImportCandidateRow {
  return {
    node_id: r.nodeId,
    kind: r.kind === "issue" ? projectBoardItemKind.issue : projectBoardItemKind.pullRequest,
    number: r.number,
    title: r.title,
    url: r.url,
    selected,
  };
}

function syncImportCandidatesHasMoreToWindow(window: MainWindowInstance): void {
  const hasMore = importCandidatesIssuesHasNext || importCandidatesPrsHasNext;
  assignProperties(window.ProjectBoardListState, { import_candidates_has_more: hasMore });
}

function rebuildImportCandidateRowsModel(window: MainWindowInstance): void {
  const q = window.ProjectBoardListState.import_candidates_search;
  const filtered = filterCandidatesBySearch(importCandidatesAccumulated, q);
  const slintRows = filtered.map((r) =>
    toSlintImportCandidateRow(r, importCandidateSelectedIds.has(r.nodeId)),
  );
  assignProperties(window.ProjectBoardListState, {
    import_candidate_count: slintRows.length,
    import_candidates_total_loaded: importCandidatesAccumulated.length,
    import_candidate_rows: new slint.ArrayModel<SlintImportCandidateRow>(slintRows),
    import_selected_count: importCandidateSelectedIds.size,
  });
  syncImportCandidatesHasMoreToWindow(window);
}

function resetImportCandidatePaginationState(): void {
  importCandidatesAccumulated = [];
  importCandidatesIssuesCursor = null;
  importCandidatesPrsCursor = null;
  importCandidatesIssuesHasNext = false;
  importCandidatesPrsHasNext = false;
  importCandidatesOwner = "";
  importCandidatesRepo = "";
  importCandidateSelectedIds.clear();
}

function clearImportCandidatesUi(window: MainWindowInstance): void {
  resetImportCandidatePaginationState();
  assignProperties(window.ProjectBoardListState, {
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
  });
}

function getFilteredImportRepos(window: MainWindowInstance): OrgRepoRow[] {
  return filterOrgRepos(importReposCache, window.ProjectBoardListState.import_repos_search);
}

function applyImportRepoFilterToWindow(window: MainWindowInstance): void {
  const q = window.ProjectBoardListState.import_repos_search;
  const filtered = filterOrgRepos(importReposCache, q);
  assignProperties(window.ProjectBoardListState, {
    import_repo_select_options: new slint.ArrayModel<SlintSelectOption>(
      mapOrgReposToSelectOptions(filtered),
    ),
    import_repo_selected_index: -1,
    import_repo_options_count: filtered.length,
  });
  clearImportCandidatesUi(window);
}

function truncateOneLine(s: string, max: number): string {
  const one = s.trim().split("\n")[0] ?? s;
  return one.length > max ? `${one.slice(0, max)}…` : one;
}

function summarizeImportAddOutcomes(outcomes: AddProjectV2ItemOutcome[]): string {
  const ok = outcomes.filter((o) => o.ok).length;
  const fail = outcomes.length - ok;
  if (outcomes.length === 0) {
    return "Nothing to add.";
  }
  if (fail === 0) {
    return ok === 1 ? "Added 1 item to the project." : `Added ${ok} items to the project.`;
  }
  const firstErr = outcomes.find(
    (o): o is { contentId: string; ok: false; error: string } => !o.ok,
  );
  const errTail = firstErr ? `: ${truncateOneLine(firstErr.error, 120)}` : "";
  return `Added ${ok} of ${outcomes.length}. ${fail} failed${errTail}`;
}

function clearImportReposUiState(window: MainWindowInstance): void {
  importReposCache = [];
  clearImportCandidatesUi(window);
  assignProperties(window.ProjectBoardListState, {
    import_repos_search: "",
    import_repos_load_status: "",
    import_repo_selected_index: -1,
    import_repo_options_count: 0,
    import_repo_select_options: new slint.ArrayModel<SlintSelectOption>([]),
  });
}

async function applyFetchedCandidatesPage(
  window: MainWindowInstance,
  page: RepoCandidatesParsedPage,
  append: boolean,
): Promise<void> {
  if (append) {
    importCandidatesAccumulated = mergeCandidatePages(importCandidatesAccumulated, page.rows);
  } else {
    importCandidatesAccumulated = [...page.rows].sort((x, y) =>
      compareUpdatedAtDesc(x.updatedAt, y.updatedAt),
    );
  }
  importCandidatesIssuesCursor = page.issuesPageInfo.endCursor;
  importCandidatesPrsCursor = page.pullRequestsPageInfo.endCursor;
  importCandidatesIssuesHasNext = page.issuesPageInfo.hasNextPage;
  importCandidatesPrsHasNext = page.pullRequestsPageInfo.hasNextPage;
  rebuildImportCandidateRowsModel(window);
  assignProperties(window.ProjectBoardListState, { import_candidates_load_status: "" });
}

export function buildProjectBoardListStateCallbacks(
  window: MainWindowInstance,
): ExhaustiveAllCallbacks<ProjectBoardListStateHandle> {
  return {
    project_board_list_view_init: () => {
      void (async () => {
        const stored = readTimeReportingSelectedProjectKv();
        if (stored === null) {
          clearProjectBoardPagingCache();
          clearImportReposUiState(window);
          assignProperties(window.ProjectBoardListState, {
            has_selected_project: false,
            selected_project_label: "",
            board_import_success_message: "",
            items_load_status: "",
            import_dialog_open: false,
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
      clearImportReposUiState(window);
      assignProperties(window.ProjectBoardListState, {
        board_import_success_message: "",
        items_load_status: "",
        import_dialog_open: false,
      });
    },

    project_board_import_dialog_closed: () => {
      clearImportReposUiState(window);
      assignProperties(window.ProjectBoardListState, { import_dialog_open: false });
    },

    project_board_import_dialog_opened: () => {
      void (async () => {
        importReposCache = [];
        clearImportCandidatesUi(window);
        assignProperties(window.ProjectBoardListState, {
          import_dialog_open: true,
          import_repos_load_status: "Loading repositories…",
          import_repos_search: "",
          import_repo_selected_index: -1,
          import_repo_select_options: new slint.ArrayModel<SlintSelectOption>([]),
          import_repo_options_count: 0,
        });
        const res = await fetchAllSlintUiOrgReposRest();
        if (!res.ok) {
          importReposCache = [];
          assignProperties(window.ProjectBoardListState, {
            import_repos_load_status: res.error,
            import_repo_select_options: new slint.ArrayModel<SlintSelectOption>([]),
            import_repo_options_count: 0,
          });
          return;
        }
        importReposCache = res.repos;
        assignProperties(window.ProjectBoardListState, { import_repos_load_status: "" });
        applyImportRepoFilterToWindow(window);
      })();
    },

    project_board_import_repos_search_changed: (query: string) => {
      assignProperties(window.ProjectBoardListState, { import_repos_search: query });
      applyImportRepoFilterToWindow(window);
    },

    project_board_import_repo_selected_changed: (index: number) => {
      void (async () => {
        if (index < 0) {
          clearImportCandidatesUi(window);
          return;
        }
        const filtered = getFilteredImportRepos(window);
        const repo = filtered[index];
        if (repo === undefined) {
          clearImportCandidatesUi(window);
          return;
        }
        const parts = parseOwnerNameFromFullName(repo.fullName);
        if (parts === null) {
          assignProperties(window.ProjectBoardListState, {
            import_candidates_load_status: "Invalid repository name.",
            import_candidate_count: 0,
            import_candidates_total_loaded: 0,
            import_candidate_rows: new slint.ArrayModel<SlintImportCandidateRow>([]),
            import_candidates_has_more: false,
          });
          return;
        }
        resetImportCandidatePaginationState();
        importCandidatesOwner = parts.owner;
        importCandidatesRepo = parts.name;
        assignProperties(window.ProjectBoardListState, {
          import_candidates_load_status: "Loading issues and pull requests…",
          import_candidates_search: "",
          import_candidates_has_more: false,
          import_candidates_load_more_busy: false,
        });
        const page = await fetchRepoCandidatesPageGraphql(parts.owner, parts.name, { first: 100 });
        if (!page.ok) {
          assignProperties(window.ProjectBoardListState, {
            import_candidates_load_status: page.error,
            import_candidate_count: 0,
            import_candidates_total_loaded: 0,
            import_candidate_rows: new slint.ArrayModel<SlintImportCandidateRow>([]),
            import_candidates_has_more: false,
          });
          return;
        }
        await applyFetchedCandidatesPage(window, page.value, false);
      })();
    },

    project_board_import_candidates_search_changed: (query: string) => {
      assignProperties(window.ProjectBoardListState, { import_candidates_search: query });
      rebuildImportCandidateRowsModel(window);
    },

    project_board_import_candidates_load_more: () => {
      void (async () => {
        if (importCandidatesOwner === "" || importCandidatesRepo === "") {
          return;
        }
        if (!importCandidatesIssuesHasNext && !importCandidatesPrsHasNext) {
          return;
        }
        assignProperties(window.ProjectBoardListState, { import_candidates_load_more_busy: true });
        const page = await fetchRepoCandidatesPageGraphql(
          importCandidatesOwner,
          importCandidatesRepo,
          {
            first: 100,
            issuesAfter: importCandidatesIssuesCursor,
            pullRequestsAfter: importCandidatesPrsCursor,
          },
        );
        assignProperties(window.ProjectBoardListState, { import_candidates_load_more_busy: false });
        if (!page.ok) {
          assignProperties(window.ProjectBoardListState, {
            import_candidates_load_status: page.error,
          });
          return;
        }
        await applyFetchedCandidatesPage(window, page.value, true);
      })();
    },

    project_board_import_candidates_select_all_on_page: () => {
      const q = window.ProjectBoardListState.import_candidates_search;
      const filtered = filterCandidatesBySearch(importCandidatesAccumulated, q);
      for (const r of filtered) {
        importCandidateSelectedIds.add(r.nodeId);
      }
      rebuildImportCandidateRowsModel(window);
    },

    project_board_import_candidate_toggled: (nodeId: string) => {
      if (importCandidateSelectedIds.has(nodeId)) {
        importCandidateSelectedIds.delete(nodeId);
      } else {
        importCandidateSelectedIds.add(nodeId);
      }
      rebuildImportCandidateRowsModel(window);
    },

    project_board_import_add_selected_to_project: () => {
      void (async () => {
        const stored = readTimeReportingSelectedProjectKv();
        if (stored === null) {
          assignProperties(window.ProjectBoardListState, {
            import_add_selected_message: "No project selected.",
          });
          return;
        }
        const ids = [...importCandidateSelectedIds];
        if (ids.length === 0) {
          assignProperties(window.ProjectBoardListState, {
            import_add_selected_message: "Select at least one issue or pull request.",
          });
          return;
        }
        assignProperties(window.ProjectBoardListState, {
          import_add_selected_busy: true,
          import_add_selected_message: "Adding to project…",
        });
        const outcomes = await addProjectV2ItemsByContentIdsSequential(stored.nodeId, ids, {
          delayMsBetween: 350,
        });
        importCandidateSelectedIds.clear();
        rebuildImportCandidateRowsModel(window);
        const msg = summarizeImportAddOutcomes(outcomes);
        const fullSuccess = outcomes.length > 0 && outcomes.every((o) => o.ok);
        assignProperties(window.ProjectBoardListState, {
          import_add_selected_busy: false,
          import_add_selected_message: fullSuccess ? "" : msg,
        });
        await reloadProjectV2ItemsIntoCacheAndUi(window, stored.nodeId);
        if (fullSuccess) {
          clearImportReposUiState(window);
          assignProperties(window.ProjectBoardListState, { import_dialog_open: false });
          if (window.ProjectBoardListState.items_load_status === "") {
            const n = outcomes.length;
            const successLine =
              n === 1 ? "Added 1 item to the project." : `Added ${n} items to the project.`;
            assignProperties(window.ProjectBoardListState, {
              board_import_success_message: successLine,
            });
          }
        }
      })();
    },

    project_board_import_success_dismissed: () => {
      assignProperties(window.ProjectBoardListState, { board_import_success_message: "" });
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
