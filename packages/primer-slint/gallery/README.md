# Primer gallery

Standalone Slint window for browsing Primer components. This folder holds gallery-only UI; the library lives in the parent directory.

**Content:** **Buttons** (`gallery-buttons-page.slint`), **Navs** (`gallery-navs-page.slint`), **Feedback** (`gallery-feedback-page.slint`), **Forms** (`gallery-forms-page.slint`), **Data** (`gallery-data-page.slint` — DataTable, Pagination). **Layout** still shows a placeholder until migrated.

**Direction:** evolve toward a Storybook-like experience: named demos per component, optional metadata (variants, tokens), and room for visual or manual QA notes in later PRs.

Run from the monorepo root:

```bash
pnpm dev:gallery
```
