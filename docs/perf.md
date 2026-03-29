# UI performance measurement

## `GH_APP_UI_PERF`

When set to `1`, the app logs timing milestones to **stderr** while starting the authenticated UI (`applyAuthUi`).

Example:

```bash
GH_APP_UI_PERF=1 pnpm dev
```

### Milestones

All times are milliseconds from **T0** (start of each auth UI attempt, before cache hydrate or `clearUserIdentity`).

| Log | Meaning |
| --- | --- |
| `T0_start` | Baseline (+0.0 ms). |
| `T1_text` | `AppState.user_login` / `user_name` (and related header text) first populated. `source=cache` if restored from SQLite session snapshot; `source=network` after a successful GraphQL viewer response. Only the **first** T1 in an attempt is logged. |
| `T2_avatar` | `AppState.avatar` first set to a **non-placeholder** image. `source=cache` or `source=network`. Only the **first** T2 is logged. |
| `T3_full` | Emitted once both T1 and T2 have been logged; value is `max(T1, T2)` relative to T0. |

If the avatar never becomes non-placeholder (e.g. load failure), T2 and T3 may not appear.

### Session cache interaction

With a warm **viewer session** in the app database (see [session-cache.md](./session-cache.md)), T1/T2 often show `source=cache` shortly after startup, before the background `gh` scope check and GraphQL refresh complete.
