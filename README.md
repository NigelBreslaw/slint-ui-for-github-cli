# github-app

Slint desktop UI that reads data from the [GitHub CLI](https://cli.github.com/) (`gh`) on your machine.

## Prerequisites

- **Node.js** 24 or newer
- **pnpm** (see [pnpm.io](https://pnpm.io/installation))
- **GitHub CLI** (`gh`) installed and authenticated (`gh auth login`)

## Setup

From the project root:

```bash
pnpm install
```

The first install runs native install steps for **`slint-ui`** and **`sharp`**. If your package manager blocks install scripts, allow those packages (this repo lists them under `pnpm.onlyBuiltDependencies` in `package.json`).

## Dependencies (runtime)

- **[slint-ui](https://www.npmjs.com/package/slint-ui)** — Slint UI for Node ([Slint-node docs](https://docs.slint.dev/latest/docs/node/)).
- **[arktype](https://www.npmjs.com/package/arktype)** — Runtime validation of JSON returned by `gh api`. Schemas are maintained **per endpoint** against GitHub’s published **[OpenAPI description](https://docs.github.com/en/rest/about-the-rest-api/about-the-openapi-description-for-the-rest-api)** (see `src/schemas/`). For example, `gh api user` (`GET /user`) is checked in `src/schemas/gh-api-user.ts`.
- **[sharp](https://www.npmjs.com/package/sharp)** — Decodes the profile image from `avatar_url` (PNG/JPEG/WebP, etc.) into RGBA for Slint’s `Image` element (`src/gh/avatar-image.ts`). If download or decode fails, the window still opens and only the label may be shown.

## Run

```bash
pnpm start
```

This runs `node src/main.ts` (TypeScript is executed directly via Node’s built-in type stripping).

**Login from a terminal:** The app can start **Login** (`gh auth login`) with inherited stdio so the interactive browser or device flow works. Run **`pnpm start`** from a terminal session (not only from a GUI launcher that does not attach a TTY), or run `gh auth login` yourself before opening the app. Purely GUI launches without a usable stdin/stdout may need a different approach later.

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

Files are named from the API path, for example `debug-json/gh-api--user.json` for `gh api user`.

When signed in, the app also dumps **project-related** data for debug: REST **Projects V2** (`projects-v2--…`), REST **Projects (classic)** kanban boards (`projects-classic--user--…`, `projects-classic--org--…`), output of **`gh project list`** for you and each org (`projects-gh-cli--user.json`, `projects-gh-cli--org--….json`), plus `projects-v2--orgs-membership.json` for org membership. V2 and `gh project list` usually need the **`project`** scope (`gh auth refresh -s project`). Classic org projects may require org permission to see private boards; failures appear as `*--error.json` for that call.
