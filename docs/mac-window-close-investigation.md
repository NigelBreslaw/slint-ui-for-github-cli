# macOS window close: shutdown vs hang investigation

This doc implements the investigation checklist for inconsistent behavior when closing the app window (immediate exit vs terminal stuck until Ctrl+C vs beachball).

## Symptom labels

Use these when recording results:

- **A — Shell stuck:** The window closes but `pnpm dev` does not return; you need Ctrl+C.
- **B — UI stuck:** The window does not close and the pointer spins (beachball).

## Reproduction matrix

Run `pnpm dev` (or `pnpm dev:shutdown-debug` for diagnostics). For each row, close the main window with the red button or Cmd+W and note **A**, **B**, or **OK** (process exits and the shell prompt returns).

| # | Steps before close |
|---|---------------------|
| 1 | Launch only; do not open Settings or Login. |
| 2 | Open **Settings**, wait until rate limit / countdown appear, then close **without** switching to Dashboard (sidebar). |
| 3 | Open **Settings**, switch to **Dashboard** (sidebar), then close. |
| 4 | Click **Login**, leave the auth overlay visible, close the main window. |
| 5 | Same as 4, but dismiss the overlay (`close_auth_window` path) before closing. |
| 6 | If available: trigger **GitHub CLI is not installed** overlay, then close. |

Compare row 1 vs 2: if **A** appears only after row 2, a lingering **`setInterval`** from the settings debug panel is a strong suspect (see code paths in `src/main.ts` and `src/ui/app-state.slint`).

## Shutdown diagnostics (`GH_DEBUG_SHUTDOWN=1`)

When this env var is set, the process logs:

1. A banner at startup.
2. **`[GH_DEBUG_SHUTDOWN] after runEventLoop resolved`** — if this **never** appears while the window is gone, `slint.runEventLoop()` has not finished (Slint still considers the loop active, e.g. another native window).
3. **`[GH_DEBUG_SHUTDOWN] after window.hide()`** — confirms execution continued past `await slint.runEventLoop`.
4. **`[GH_DEBUG_SHUTDOWN] beforeExit`** — runs when Node is about to exit; if **2** and **3** print but **4** never does, something is **keeping the Node event loop alive** (timers, open DB, child processes, etc.).
5. Each milestone logs **`activeResources`** from [`process.getActiveResourcesInfo()`](https://nodejs.org/api/process.html#processgetactiveresourcesinfo) (counts by resource type).

```bash
pnpm dev:shutdown-debug
```

Interpretation:

- **`Timers`** — often `setInterval` from settings debug countdown if settings was opened.
- **`FSReqWrap` / file handles** — e.g. SQLite via `better-sqlite3` (`openAppDb()` in `src/main.ts`).
- **Child processes** — e.g. in-flight `gh auth login` (`src/gh/auth.ts`).

## Beachball (symptom B): capture a sample

Automation cannot replace this step; do it once while the UI is hung:

1. Open **Activity Monitor**, find the **`node`** process running your app (note PID).
2. Select it → **Sample Process** (gear menu or toolbar).
3. Save the sample; look for the main thread blocked in Slint/native code vs Node/V8.

Optional: **Console.app** or `sample <pid> 5 -file /tmp/node-sample.txt` from Terminal.

Correlate with heavy work on UI callbacks: sync SQLite, `sharp`, long `gh` runs, etc.

## Slint / upstream references

Worth scanning or watching:

- [Slint `runEventLoop` (Node)](https://docs.slint.dev/latest/docs/node/functions/runEventLoop) — default **`quitOnLastWindowClosed: true`**; note the **16 ms** Node/Slint event-loop merge.
- [slint-ui/slint#1220](https://github.com/slint-ui/slint/issues/1220) — Todo demo: app did not quit when closing via **PopupWindow** (GL backend; fixed in 2022; related to **EventLoopQuitBehavior**).
- [slint-ui/slint#7318](https://github.com/slint-ui/slint/issues/7318) — **PopupWindow** `close()` behavior (regression discussion).
- [slint-ui/slint#4316](https://github.com/slint-ui/slint/issues/4316) — Node **`runEventLoop` / quit** API discussion.

Search the repo for new issues: [slint issues: macOS close](https://github.com/slint-ui/slint/issues?q=is%3Aissue+macos+close), [runEventLoop node](https://github.com/slint-ui/slint/issues?q=is%3Aissue+runEventLoop+node).

## Likely follow-up fixes (after you confirm a branch)

- **Timers:** Teardown settings debug (`stopSettingsDebugCountdown`) on app/window close, not only when leaving Settings in the sidebar.
- **SQLite:** Expose `closeAppDb()` and call it after `runEventLoop` resolves.
- **`runEventLoop` stuck with popups:** Close `PopupWindow` instances from the backend when the main window closes, or call `slint.quitEventLoop()` if Slint exposes a suitable hook for your version.
- **Upstream:** If samples point at Slint/winit on macOS, file or link an issue with repro + sample.
