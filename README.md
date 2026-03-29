# github-app

Slint desktop UI that reads data from the [GitHub CLI](https://cli.github.com/) (`gh`) on your machine.

## Prerequisites

- **Node.js** 24 or newer
- **pnpm** (see [pnpm.io](https://pnpm.io/installation))
- **GitHub CLI** (`gh`) on your **`PATH`** (Windows, macOS, and Linux use the same command name; the app does not ship `gh`). If it is missing, the UI shows a **no CLI installed** state with no **Login** button until you install it from [cli.github.com](https://cli.github.com/). After install, authenticate with `gh auth login` or the in-app **Login** flow.

**OAuth scopes:** The app expects classic token scopes **`read:org`** and **`read:project`**. If `gh` is missing them (or scopes cannot be verified), the UI stays **logged out** with an explanation—use **Login** to authorize with the required scopes (see [scopes.md](scopes.md)).

## Setup

From the project root:

```bash
pnpm install
```

The first install runs native install steps for **`slint-ui`** and **`sharp`**. If your package manager blocks install scripts, allow those packages (this repo lists them under `pnpm.onlyBuiltDependencies` in `package.json`).

## Dependencies (runtime)

- **[slint-ui](https://www.npmjs.com/package/slint-ui)** — Slint UI for Node ([Slint-node docs](https://docs.slint.dev/latest/docs/node/)).
- **[arktype](https://www.npmjs.com/package/arktype)** — Runtime validation of JSON returned by `gh api` (REST) and `gh api graphql` (see `src/schemas/`). The signed-in user profile comes from a **minimal GraphQL `viewer`** query, validated in `src/schemas/gh-graphql-viewer-minimal.ts`.
- **[sharp](https://www.npmjs.com/package/sharp)** — Decodes the profile image from `avatarUrl` (PNG/JPEG/WebP, etc.) into RGBA for Slint’s `Image` element (`src/gh/avatar-image.ts`). If download or decode fails, the window still opens and only the label may be shown.

## Run

```bash
pnpm start
```

This runs `node src/main.ts` (TypeScript is executed directly via Node’s built-in type stripping).

**Login from a terminal:** The app starts **Login** as `gh auth login --web --git-protocol ssh --skip-ssh-key --scopes read:org,read:project` (scopes match [`REQUIRED_GH_OAUTH_SCOPES`](src/gh/required-scopes.ts)) with inherited stdio so the browser OAuth flow runs with fewer prompts. That sets GitHub **git** protocol to **SSH** for this login; switch to HTTPS afterward with `gh config set git_protocol https -h github.com` if you prefer. Run **`pnpm start`** from a terminal session (not only from a GUI launcher that does not attach a TTY), or sign in with `gh` yourself first. Purely GUI launches without a usable stdin/stdout may need a different approach later.

If `gh` uses the **device code** flow, the overlay shows the one-time code and an **Open GitHub** button that copies the code to the clipboard and opens the device page in your browser (same output is still mirrored in the terminal); you may still need to press Enter there when `gh` asks.

### Typecheck

```bash
pnpm typecheck
```

## Debug mode (JSON dumps)

When **`GH_DEBUG_JSON=1`**, each successful `gh api …` response is pretty-printed to the **`debug-json/`** directory (gitignored). Useful for inspecting API payloads while building the UI.

**Do not** enable this while screen-sharing; responses can include account details or other sensitive data.

Run with the helper script (works on Windows, macOS, and Linux via [cross-env](https://github.com/kentcdodds/cross-env)):

```bash
pnpm dev:debug
```

Equivalent without the script:

```bash
GH_DEBUG_JSON=1 pnpm start
```

On Windows (cmd), you can also use `set GH_DEBUG_JSON=1` before `pnpm start` if you prefer.

Files are named from the API path or query purpose, for example `debug-json/gh-graphql--viewer-status.json` for the wide GraphQL `viewer` debug dump, or `gh-api--user--orgs--….json` for REST calls.

When signed in, the app also dumps **project-related** data for debug: `projects-v2--orgs-membership.json` for org membership (REST), then GraphQL **`projectsV2`** for the **`slint-ui`** org only (`projects-v2--org--slint-ui…`). That org list is fetched **once** per run and reused for **`assigned-open--projects-list--slint-ui.json`** (same `projectsV2` payload shape). The payload is a list of `ProjectV2` fields. It does **not** write user-scoped project files (`projects-v2--user--…`) in that mode. The debug helper without an org filter also dumps **your** user projects (GraphQL) and **all** of your orgs (for local experimentation). **`read:project`** is required (see [scopes.md](scopes.md)). Failures appear as `*--error.json` for that call.

**Assigned open work (`slint-ui`):** the app runs **`gh search issues`** (assignee `@me`, owner `slint-ui`, `--state open`, `--include-prs`) → `debug-json/assigned-open--search--slint-ui.json`. There is **no** GitHub API that lists “org projects that contain open work assigned to me” in one shot; project boards are queried **per project**. The project list comes from the same GraphQL **`organization.projectsV2`** shape as `projects-v2--org--slint-ui…`, including **`items.totalCount`** on each project (that count is **all** cards on the board—open and closed—not “open assigned to me”). That snapshot is written as `assigned-open--projects-list--slint-ui.json` (`source`, `projects`, …). For each **non-closed** project with **`items.totalCount > 0`**, project rows are written as `assigned-open--project-items--slint-ui--<projectNumber>.json`. Projects with **no items at all** skip item fetch and still emit `{ "items": [], "totalCount": 0 }` for that stem.

**Default path (`GH_DEBUG_ASSIGNED_PROJECT_ITEMS` unset or not `graphql`):** uses **`gh project item-list`** with `--query` `assignee:@me is:open -is:archived`, matching the Projects UI filter language. `item-list` uses **GraphQL** under the hood; running many in parallel (and alongside other debug GraphQL) often triggers **`API rate limit exceeded`**. By default only **one** `item-list` runs at a time. Set **`GH_DEBUG_ASSIGNED_ITEM_LIST_CONCURRENCY`** to a small integer (e.g. `2`–`4`) for more parallelism (capped at 8).

**Optional batched GraphQL path:** set **`GH_DEBUG_ASSIGNED_PROJECT_ITEMS=graphql`** to fetch items via **`gh api graphql`** using several `node(id: …)` aliases per HTTP request (fewer subprocesses and round-trips). Tune batch width with **`GH_DEBUG_ASSIGNED_PROJECT_ITEMS_BATCH`** (default **5**, max **10**). Payloads include **`"source": "graphql-batched"`** and a **`filter`** string describing **client-side** rules (`isArchived` on `ProjectV2Item`, `OPEN` issues/PRs, assignee match, draft issues by assignee)—close to the CLI query but **not guaranteed identical**. GraphQL **rate-limit points** are **not** guaranteed lower than `item-list`; batching is mainly **efficiency of requests**. If **`viewer { login }`** fails, the app logs to stderr and **falls back** to `gh project item-list`.

**Project tasks** can include **draft issues** that are not repo issues until converted. Subcommand / batch failures write `*--error.json` next to that stem.
