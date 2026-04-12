# Primer gallery

Standalone Slint window for browsing Primer components. This folder holds gallery-only UI; the library lives in the parent directory.

**Content:** sidebar groups mirror sections from `app/src/ui/views/primer-gallery.slint`: **Buttons** (`gallery-buttons-page.slint`), **Navs** (`gallery-navs-page.slint`), **Feedback** (`gallery-feedback-page.slint` — Banner, Spinner, Avatar, Label, LabelGroup). Remaining groups still show a placeholder until migrated.

**Direction:** evolve toward a Storybook-like experience: named demos per component, optional metadata (variants, tokens), and room for visual or manual QA notes in later PRs.

Run from the monorepo root:

```bash
pnpm dev:gallery
```
