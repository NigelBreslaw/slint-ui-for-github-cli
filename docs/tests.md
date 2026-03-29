# Tests

This project uses Node’s built-in test runner ([`node:test`](https://nodejs.org/api/test.html)) and [`node:assert/strict`](https://nodejs.org/api/assert.html). Test files are named `*.test.ts` and live next to (or near) the code they cover.

## Running tests

```bash
pnpm test
```

This runs [`scripts/run-tests.ts`](../scripts/run-tests.ts), which discovers every file matching `src/**/*.test.ts` and invokes `node --test` on that list.

Type checking is separate:

```bash
pnpm typecheck
```

## What is not covered

- **Slint UI** (`*.slint`, `slint-ui` windows) — no automated UI tests in this repo yet.
- **Real `gh` CLI / network** — unit tests use fixtures and pure functions only; integration tests against GitHub are manual.

---

## Test files and cases

### `src/utils/format-countdown.test.ts`

Exercises [`formatCountdownMs`](../src/utils/format-countdown.ts) (countdown string `MM:SS`).

| Case | Intent |
| --- | --- |
| formats 90 seconds as 01:30 | Normal multi-minute remainder |
| formats 59 seconds as 00:59 | Seconds roll under one minute |
| formats exactly one minute | Boundary at 60s |
| returns 00:00 for zero, negative, NaN, and Infinity | Non-positive / non-finite inputs |

### `src/utils/format-reset-at-local.test.ts`

Exercises [`formatRateLimitResetLocal`](../src/utils/format-reset-at-local.ts) (friendly local display of GitHub `rateLimit.resetAt`).

| Case | Intent |
| --- | --- |
| matches Date#toLocaleString with the same formatting options (stable under TZ=UTC) | Implementation stays aligned with the same `toLocaleString` options; `TZ=UTC` set in the test for stability |
| returns the input when the timestamp is not parseable | Invalid ISO string is passed through unchanged |

### `src/gh/map-gh-exec-error.test.ts`

Exercises [`mapGhExecError`](../src/gh/map-gh-exec-error.ts) (normalizing `execFile` / `gh` failures).

| Case | Intent |
| --- | --- |
| maps ENOENT to install hint | Missing `gh` binary |
| prefixes non-empty stderr | Typical `gh` failure with stderr message |
| uses Error.message when stderr is present but empty after trim | `Error` plus empty stderr buffer |
| uses Error message for generic Error | Plain `Error` |
| stringifies unknown values | Non-object throwables |

### `src/gh/status-emoji-from-graphql.test.ts`

Exercises [`statusEmojiFromGraphqlHtml`](../src/gh/status-emoji-from-graphql.ts) (strip HTML around emoji from GraphQL).

| Case | Intent |
| --- | --- |
| returns empty for null and empty string | No emoji |
| strips a single wrapper div | Common GitHub HTML shape |
| strips nested tags | Multiple tags |
| returns empty when only tags remain after strip | No visible glyph left |

### `src/session/viewer-session-cache.test.ts`

Exercises [`parseViewerSessionJson`](../src/session/viewer-session-cache.ts) (persisted viewer snapshot for fast startup; no SQLite in tests—JSON only).

| Case | Intent |
| --- | --- |
| uses a stable KV key | `VIEWER_SESSION_KV_KEY` matches `viewer_session_v1` |
| accepts a valid v1 session | Round-trip with `serializeViewerSession` |
| returns null for wrong schema version | Unknown `schemaVersion` |
| returns null when authenticated is not true | `authenticated: false` rejected |
| returns null for invalid JSON | Parse error |
| returns null when login is missing | Empty `login` string |
| returns null when name has wrong type | Type guard on `name` |

### `src/schemas/gh-graphql-rate-limit.test.ts`

Exercises [`parseGhGraphqlRateLimitResponse`](../src/schemas/gh-graphql-rate-limit.ts) against JSON fixtures in [`src/test/fixtures/graphql/`](../src/test/fixtures/graphql/).

| Case | Fixture (if any) | Intent |
| --- | --- | --- |
| accepts a valid rateLimit payload | `rate-limit-valid.json` | Happy path |
| surfaces top-level GraphQL errors when data is missing rateLimit | `rate-limit-graphql-errors.json` | `errors[]` message propagated |
| rejects when data has no rateLimit field | `rate-limit-data-no-rateLimit.json` | Wrong `data` shape |
| rejects null rateLimit node | `rate-limit-rateLimit-null.json` | Null `data.rateLimit` |
| rejects wrong types on rateLimit | `rate-limit-bad-limit-type.json` | Arktype rejects bad types |
| rejects non-object root | _(inline `null`)_ | Non-object payload |

### `src/schemas/gh-graphql-viewer-minimal.test.ts`

Exercises [`parseGhGraphqlViewerMinimalResponse`](../src/schemas/gh-graphql-viewer-minimal.ts) against the same fixture directory.

| Case | Fixture (if any) | Intent |
| --- | --- | --- |
| accepts a full viewer payload | `viewer-valid.json` | Happy path with `status` |
| accepts null status | `viewer-status-null.json` | `status: null` allowed |
| surfaces top-level GraphQL errors | `viewer-graphql-errors.json` | `errors[]` message |
| rejects when data has no viewer field | `viewer-data-no-viewer.json` | Missing `data.viewer` |
| rejects null viewer | `viewer-viewer-null.json` | `data.viewer` null |
| rejects viewer missing required login | `viewer-missing-login.json` | Arktype / shape failure |
| rejects non-object root | _(inline `undefined`)_ | Non-object payload |

---

## GraphQL fixtures

Static payloads live under `src/test/fixtures/graphql/`:

| File | Role |
| --- | --- |
| `rate-limit-valid.json` | Valid `data.rateLimit` |
| `rate-limit-graphql-errors.json` | Top-level errors + null `data` |
| `rate-limit-data-no-rateLimit.json` | `data` without `rateLimit` |
| `rate-limit-rateLimit-null.json` | `data.rateLimit` explicitly null |
| `rate-limit-bad-limit-type.json` | `limit` as string (type error) |
| `viewer-valid.json` | Full minimal viewer + status |
| `viewer-status-null.json` | Viewer with `status: null` |
| `viewer-graphql-errors.json` | Top-level GraphQL errors |
| `viewer-data-no-viewer.json` | `data` without `viewer` |
| `viewer-viewer-null.json` | `data.viewer` null |
| `viewer-missing-login.json` | Viewer object missing `login` |

---

## Tooling notes

- **Knip** treats `src/**/*.test.ts` as entry files (see [`knip.json`](../knip.json)) so test files are not reported as unused.
- **Oxlint / oxfmt** run on `src/` (including `*.test.ts`) via `pnpm lint` and `pnpm format`.

## Related docs

- [UI performance logging (`GH_APP_UI_PERF`)](./perf.md)
- [Viewer session cache (startup hydrate)](./session-cache.md)
