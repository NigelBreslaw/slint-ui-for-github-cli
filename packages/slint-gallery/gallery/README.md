# Primer gallery

Standalone Slint window for browsing Primer components. This folder holds gallery-only UI; the **`primer-slint`** library lives in the sibling package [`primer-slint`](../../primer-slint/). Component demos are not embedded in the main github-app window; use this app (or browse `gallery/*-page.slint` in this package).

**Content:** **Buttons** (`gallery-buttons-page.slint`), **Navs** (`gallery-navs-page.slint`), **Feedback** (`gallery-feedback-page.slint`), **Forms** (`gallery-forms-page.slint`), **Data** (`gallery-data-page.slint` — DataTable, Pagination), **Action list** (`gallery-action-list-page.slint` — ActionList / ActionListRow), **Action list 2** (`gallery-action-list2-page.slint` — ActionList2, Storybook Features demos).

**`AnchoredOverlay` / `PopupWindow`:** [`anchored-popupwindow.md`](anchored-popupwindow.md) — parent-relative coordinates, vertical flip, and references to app patterns.

**Direction:** evolve toward a Storybook-like experience: named demos per component, optional metadata (variants, tokens), and room for visual or manual QA notes in later PRs.

Run from the monorepo root:

```bash
pnpm dev:gallery
```
