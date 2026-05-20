---
name: primer-port-pr-sequential
description: >-
  Executes multi-PR implementation plans one pull request at a time: requires
  an ordered PR table in the plan, keeps each PR small, implements only the
  current PR until the user continues, leaves git to the user, and enforces
  acceptance (pnpm autofix, pnpm test, pnpm dev or dev:gallery with a clean
  app start). Use when working through a staged Primer port or any multi-PR
  plan in this repo, or when the user asks to do one PR at a time with
  review-sized chunks.
---

# Primer port — sequential PR execution

## Canonical reference

- **This skill (§1 below)** — required **PR** / **Title** / **Scope** / **Acceptance** table for multi-PR plans.
- [`packages/primer-slint/AGENTS.md`](../../../packages/primer-slint/AGENTS.md) — monorepo **verification** and package pointers.
- Orchestrator: [`primer-port-orchestrator`](../primer-port-orchestrator/SKILL.md).
- Gallery demos: [`primer-port-gallery-demo`](../primer-port-gallery-demo/SKILL.md).

## 1) Plan must include a PR table

Before any implementation, the plan **must** contain an **ordered** table with at least:

| PR | Title | Scope | Acceptance |
|----|-------|-------|------------|

Optionally add **Depends on** or notes when PR *n* must follow PR *m*. If the table is missing, **add it first** and agree scope per row before coding.

## 2) Keep each PR small

Each row should be **one reviewable chunk**: a single concern (e.g. spike only, tokens only, visuals only). Avoid “do the rest of the feature” rows. Split further if a row mixes unrelated files or risks.

## 3) Implement only the current PR

When work **starts** on a multi-PR plan:

- Implement **only PR 1** (or only the **first** not-yet-done PR if resuming mid-plan).
- **Do not** start files, refactors, or follow-up tasks meant for PR 2+.
- **Tell the user explicitly:** you are working on **only PR *n*** (state its title from the plan table).

## 4) Git is for the user

**Branches, commits, pushes, and PRs on GitHub** are the user’s responsibility unless they explicitly ask the agent to run git commands. After finishing the code changes for the current PR, **remind the user** that git (commit / push / open PR) is left to them.

## 5) Stop and wait after each PR

When the **current** PR’s implementation is complete (and acceptance steps below are satisfied or clearly delegated):

1. **Stop.** Do not begin the next PR.
2. Summarize what was done for **this** PR only.
3. Tell the user which **PR number** was completed and that **git is theirs**.
4. Wait until they **ask to continue**, request the **next** PR, or give a **build** / CI / explicit go-ahead—then implement **only the next** PR in the table and repeat from §3.

## 6) Acceptance criteria (every PR)

From the **monorepo root**, each PR must meet **all** of:

1. **`pnpm autofix`** — completes successfully.
2. **`pnpm test`** — passes.
3. **App starts** — one of:
   - **`pnpm dev`** — default when the PR touches the main app or shared packages beyond gallery-only scope; confirm startup without obvious errors and a quick sanity check on touched UI.
   - **`pnpm dev:gallery`** — when the PR scope is **only** `packages/slint-gallery/**` and/or `primer-slint` exports consumed by gallery (no main-app UI changes). Confirm the gallery window loads; **open the touched playground** and toggle **every new or changed sidebar control** ([`primer-port-gallery-demo`](../primer-port-gallery-demo/SKILL.md)).

**Recommended** (aligns with AGENTS verification): also run **`pnpm typecheck`** before considering the PR done, unless the user’s workflow explicitly excludes it for this step.

If any step fails, fix within the **same** PR scope or adjust the plan—do not roll failure into “the next PR.”

## 7) Resume until done

Repeat §3–§6 for PR 2, 3, … until the table is complete. Each time you start work, **announce** which **single** PR you are implementing.

## Related skills

- [`primer-port-orchestrator`](../primer-port-orchestrator/SKILL.md) — full port phases before PR breakdown.
- [`primer-port-gallery-demo`](../primer-port-gallery-demo/SKILL.md) — gallery page layout and sidebar pattern.
- [`primer-slint-interaction-states`](../primer-slint-interaction-states/SKILL.md) — interaction styling in Slint.
