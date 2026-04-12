import * as slint from "slint-ui";
import { assignProperties, type ExhaustiveAllCallbacks } from "slint-bridge-kit";
import { fetchRepoCandidatesPageGraphql } from "../gh/graphql-repo-candidates.ts";
import { fetchAllSlintUiOrgReposRest } from "../gh/fetch-slint-ui-org-repos-rest.ts";
import type { RepoCandidateRow } from "../schemas/gh-graphql-repo-candidates.ts";
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

function mapRepoCandidateToSlint(row: RepoCandidateRow): SlintImportCandidateRow {
  return {
    kind: row.kind === "issue" ? projectBoardItemKind.issue : projectBoardItemKind.pullRequest,
    number: row.number,
    title: row.title,
    url: row.url,
  };
}

function getFilteredImportRepos(window: MainWindowInstance): OrgRepoRow[] {
  return filterOrgRepos(importReposCache, window.ProjectBoardListState.import_repos_search);
}

function clearImportCandidatesUi(window: MainWindowInstance): void {
  assignProperties(window.ProjectBoardListState, {
    import_candidates_load_status: "",
    import_candidate_count: 0,
    import_candidate_rows: new slint.ArrayModel<SlintImportCandidateRow>([]),
  });
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

function clearImportReposUiState(window: MainWindowInstance): void {
  importReposCache = [];
  assignProperties(window.ProjectBoardListState, {
    import_repos_search: "",
    import_repos_load_status: "",
    import_repo_selected_index: -1,
    import_repo_options_count: 0,
    import_repo_select_options: new slint.ArrayModel<SlintSelectOption>([]),
    import_candidates_load_status: "",
    import_candidate_count: 0,
    import_candidate_rows: new slint.ArrayModel<SlintImportCandidateRow>([]),
  });
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
        assignProperties(window.ProjectBoardListState, {
          import_dialog_open: true,
          import_repos_load_status: "Loading repositories…",
          import_repos_search: "",
          import_repo_selected_index: -1,
          import_repo_select_options: new slint.ArrayModel<SlintSelectOption>([]),
          import_repo_options_count: 0,
          import_candidates_load_status: "",
          import_candidate_count: 0,
          import_candidate_rows: new slint.ArrayModel<SlintImportCandidateRow>([]),
        });
        const res = await fetchAllSlintUiOrgReposRest();
        if (!res.ok) {
          importReposCache = [];
          assignProperties(window.ProjectBoardListState, {
            import_repos_load_status: res.error,
            import_repo_select_options: new slint.ArrayModel<SlintSelectOption>([]),
            import_repo_options_count: 0,
            import_candidates_load_status: "",
            import_candidate_count: 0,
            import_candidate_rows: new slint.ArrayModel<SlintImportCandidateRow>([]),
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
            import_candidate_rows: new slint.ArrayModel<SlintImportCandidateRow>([]),
          });
          return;
        }
        assignProperties(window.ProjectBoardListState, {
          import_candidates_load_status: "Loading issues and pull requests…",
        });
        const page = await fetchRepoCandidatesPageGraphql(parts.owner, parts.name, { first: 100 });
        if (!page.ok) {
          assignProperties(window.ProjectBoardListState, {
            import_candidates_load_status: page.error,
            import_candidate_count: 0,
            import_candidate_rows: new slint.ArrayModel<SlintImportCandidateRow>([]),
          });
          return;
        }
        const slintRows = page.value.rows.map(mapRepoCandidateToSlint);
        assignProperties(window.ProjectBoardListState, {
          import_candidates_load_status: "",
          import_candidate_count: slintRows.length,
          import_candidate_rows: new slint.ArrayModel<SlintImportCandidateRow>(slintRows),
        });
      })();
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
