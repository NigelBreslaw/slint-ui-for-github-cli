/** Base UI public namespaces from packages/react/src/index.ts (42 components). */
export const BASE_UI_COMPONENTS = [
  {
    "kebab": "accordion",
    "label": "Accordion",
    "phase": 2
  },
  {
    "kebab": "alert-dialog",
    "label": "AlertDialog",
    "phase": 2
  },
  {
    "kebab": "autocomplete",
    "label": "Autocomplete",
    "phase": 4
  },
  {
    "kebab": "avatar",
    "label": "Avatar",
    "phase": 2
  },
  {
    "kebab": "button",
    "label": "Button",
    "phase": 2
  },
  {
    "kebab": "checkbox",
    "label": "Checkbox",
    "phase": 2
  },
  {
    "kebab": "checkbox-group",
    "label": "CheckboxGroup",
    "phase": 2
  },
  {
    "kebab": "collapsible",
    "label": "Collapsible",
    "phase": 2
  },
  {
    "kebab": "combobox",
    "label": "Combobox",
    "phase": 4
  },
  {
    "kebab": "context-menu",
    "label": "ContextMenu",
    "phase": 3
  },
  {
    "kebab": "csp-provider",
    "label": "CSPProvider",
    "phase": 2,
    "notes": "Web-only (CSP nonce for inline styles). Slint stub documents N/A."
  },
  {
    "kebab": "dialog",
    "label": "Dialog",
    "phase": 3
  },
  {
    "kebab": "direction-provider",
    "label": "DirectionProvider",
    "phase": 2,
    "notes": "RTL/LTR at app level in Phase 1; provider stub in Phase 2."
  },
  {
    "kebab": "drawer",
    "label": "Drawer",
    "phase": 3
  },
  {
    "kebab": "field",
    "label": "Field",
    "phase": 2
  },
  {
    "kebab": "fieldset",
    "label": "Fieldset",
    "phase": 2
  },
  {
    "kebab": "form",
    "label": "Form",
    "phase": 2
  },
  {
    "kebab": "input",
    "label": "Input",
    "phase": 2
  },
  {
    "kebab": "menu",
    "label": "Menu",
    "phase": 3
  },
  {
    "kebab": "menubar",
    "label": "Menubar",
    "phase": 3
  },
  {
    "kebab": "merge-props",
    "label": "Merge props",
    "phase": 2,
    "notes": "Web-only; not ported to Slint."
  },
  {
    "kebab": "meter",
    "label": "Meter",
    "phase": 5
  },
  {
    "kebab": "navigation-menu",
    "label": "NavigationMenu",
    "phase": 4
  },
  {
    "kebab": "number-field",
    "label": "NumberField",
    "phase": 5
  },
  {
    "kebab": "otp-field",
    "label": "OTPField",
    "phase": 5
  },
  {
    "kebab": "popover",
    "label": "Popover",
    "phase": 3
  },
  {
    "kebab": "preview-card",
    "label": "PreviewCard",
    "phase": 3
  },
  {
    "kebab": "progress",
    "label": "Progress",
    "phase": 2
  },
  {
    "kebab": "radio",
    "label": "Radio",
    "phase": 2
  },
  {
    "kebab": "radio-group",
    "label": "RadioGroup",
    "phase": 2
  },
  {
    "kebab": "scroll-area",
    "label": "ScrollArea",
    "phase": 5
  },
  {
    "kebab": "select",
    "label": "Select",
    "phase": 4
  },
  {
    "kebab": "separator",
    "label": "Separator",
    "phase": 2
  },
  {
    "kebab": "slider",
    "label": "Slider",
    "phase": 2
  },
  {
    "kebab": "switch",
    "label": "Switch",
    "phase": 2
  },
  {
    "kebab": "tabs",
    "label": "Tabs",
    "phase": 2
  },
  {
    "kebab": "toast",
    "label": "Toast",
    "phase": 4
  },
  {
    "kebab": "toggle",
    "label": "Toggle",
    "phase": 2
  },
  {
    "kebab": "toggle-group",
    "label": "ToggleGroup",
    "phase": 5
  },
  {
    "kebab": "toolbar",
    "label": "Toolbar",
    "phase": 5
  },
  {
    "kebab": "tooltip",
    "label": "Tooltip",
    "phase": 3
  },
  {
    "kebab": "use-render",
    "label": "Use render",
    "phase": 2,
    "notes": "Replaced by Slint components + @children; not ported."
  }
] as const;

export type BaseUiComponentEntry = (typeof BASE_UI_COMPONENTS)[number];

export function stubPageId(kebab: string): string {
  return `stub-${kebab}`;
}

export function upstreamPath(kebab: string): string {
  return `packages/react/src/${kebab}`;
}

export const STUB_BY_PAGE_ID = new Map(
  BASE_UI_COMPONENTS.map((c) => [
    stubPageId(c.kebab),
    {
      title: c.label,
      upstreamPath: upstreamPath(c.kebab),
      targetPhase: c.phase,
      notes: "notes" in c ? (c as { notes?: string }).notes ?? "" : "",
    },
  ]),
);

/** Foundation demo pages (Phase 1). More leaves added in PR4–PR9. */
export const FOUNDATION_SIDEBAR_LEAVES = [
  { id: "foundation-tokens", label: "Design tokens" },
  { id: "foundation-anchor", label: "Anchor & popup" },
  { id: "foundation-dismiss", label: "Dismiss" },
  { id: "foundation-focus", label: "Focus & modal" },
] as const;

export const GALLERY_SIDEBAR_NAV = [
  {
    folderId: "folder-welcome",
    label: "Welcome",
    leaves: [{ id: "welcome", label: "Welcome" }],
  },
  {
    folderId: "folder-foundation",
    label: "Foundation",
    leaves: [...FOUNDATION_SIDEBAR_LEAVES],
  },
  {
    folderId: "folder-accordion",
    "label": "Accordion",
    "leaves": [
      {
        "id": "stub-accordion",
        "label": "Accordion"
      }
    ]
  },
  {
    "folderId": "folder-alert-dialog",
    "label": "AlertDialog",
    "leaves": [
      {
        "id": "stub-alert-dialog",
        "label": "AlertDialog"
      }
    ]
  },
  {
    "folderId": "folder-autocomplete",
    "label": "Autocomplete",
    "leaves": [
      {
        "id": "stub-autocomplete",
        "label": "Autocomplete"
      }
    ]
  },
  {
    "folderId": "folder-avatar",
    "label": "Avatar",
    "leaves": [
      {
        "id": "stub-avatar",
        "label": "Avatar"
      }
    ]
  },
  {
    "folderId": "folder-button",
    "label": "Button",
    "leaves": [
      {
        "id": "stub-button",
        "label": "Button"
      }
    ]
  },
  {
    "folderId": "folder-checkbox",
    "label": "Checkbox",
    "leaves": [
      {
        "id": "stub-checkbox",
        "label": "Checkbox"
      }
    ]
  },
  {
    "folderId": "folder-checkbox-group",
    "label": "CheckboxGroup",
    "leaves": [
      {
        "id": "stub-checkbox-group",
        "label": "CheckboxGroup"
      }
    ]
  },
  {
    "folderId": "folder-collapsible",
    "label": "Collapsible",
    "leaves": [
      {
        "id": "stub-collapsible",
        "label": "Collapsible"
      }
    ]
  },
  {
    "folderId": "folder-combobox",
    "label": "Combobox",
    "leaves": [
      {
        "id": "stub-combobox",
        "label": "Combobox"
      }
    ]
  },
  {
    "folderId": "folder-context-menu",
    "label": "ContextMenu",
    "leaves": [
      {
        "id": "stub-context-menu",
        "label": "ContextMenu"
      }
    ]
  },
  {
    "folderId": "folder-csp-provider",
    "label": "CSPProvider",
    "leaves": [
      {
        "id": "stub-csp-provider",
        "label": "CSPProvider"
      }
    ]
  },
  {
    "folderId": "folder-dialog",
    "label": "Dialog",
    "leaves": [
      {
        "id": "stub-dialog",
        "label": "Dialog"
      }
    ]
  },
  {
    "folderId": "folder-direction-provider",
    "label": "DirectionProvider",
    "leaves": [
      {
        "id": "stub-direction-provider",
        "label": "DirectionProvider"
      }
    ]
  },
  {
    "folderId": "folder-drawer",
    "label": "Drawer",
    "leaves": [
      {
        "id": "stub-drawer",
        "label": "Drawer"
      }
    ]
  },
  {
    "folderId": "folder-field",
    "label": "Field",
    "leaves": [
      {
        "id": "stub-field",
        "label": "Field"
      }
    ]
  },
  {
    "folderId": "folder-fieldset",
    "label": "Fieldset",
    "leaves": [
      {
        "id": "stub-fieldset",
        "label": "Fieldset"
      }
    ]
  },
  {
    "folderId": "folder-form",
    "label": "Form",
    "leaves": [
      {
        "id": "stub-form",
        "label": "Form"
      }
    ]
  },
  {
    "folderId": "folder-input",
    "label": "Input",
    "leaves": [
      {
        "id": "stub-input",
        "label": "Input"
      }
    ]
  },
  {
    "folderId": "folder-menu",
    "label": "Menu",
    "leaves": [
      {
        "id": "stub-menu",
        "label": "Menu"
      }
    ]
  },
  {
    "folderId": "folder-menubar",
    "label": "Menubar",
    "leaves": [
      {
        "id": "stub-menubar",
        "label": "Menubar"
      }
    ]
  },
  {
    "folderId": "folder-merge-props",
    "label": "Merge props",
    "leaves": [
      {
        "id": "stub-merge-props",
        "label": "Merge props"
      }
    ]
  },
  {
    "folderId": "folder-meter",
    "label": "Meter",
    "leaves": [
      {
        "id": "stub-meter",
        "label": "Meter"
      }
    ]
  },
  {
    "folderId": "folder-navigation-menu",
    "label": "NavigationMenu",
    "leaves": [
      {
        "id": "stub-navigation-menu",
        "label": "NavigationMenu"
      }
    ]
  },
  {
    "folderId": "folder-number-field",
    "label": "NumberField",
    "leaves": [
      {
        "id": "stub-number-field",
        "label": "NumberField"
      }
    ]
  },
  {
    "folderId": "folder-otp-field",
    "label": "OTPField",
    "leaves": [
      {
        "id": "stub-otp-field",
        "label": "OTPField"
      }
    ]
  },
  {
    "folderId": "folder-popover",
    "label": "Popover",
    "leaves": [
      {
        "id": "stub-popover",
        "label": "Popover"
      }
    ]
  },
  {
    "folderId": "folder-preview-card",
    "label": "PreviewCard",
    "leaves": [
      {
        "id": "stub-preview-card",
        "label": "PreviewCard"
      }
    ]
  },
  {
    "folderId": "folder-progress",
    "label": "Progress",
    "leaves": [
      {
        "id": "stub-progress",
        "label": "Progress"
      }
    ]
  },
  {
    "folderId": "folder-radio",
    "label": "Radio",
    "leaves": [
      {
        "id": "stub-radio",
        "label": "Radio"
      }
    ]
  },
  {
    "folderId": "folder-radio-group",
    "label": "RadioGroup",
    "leaves": [
      {
        "id": "stub-radio-group",
        "label": "RadioGroup"
      }
    ]
  },
  {
    "folderId": "folder-scroll-area",
    "label": "ScrollArea",
    "leaves": [
      {
        "id": "stub-scroll-area",
        "label": "ScrollArea"
      }
    ]
  },
  {
    "folderId": "folder-select",
    "label": "Select",
    "leaves": [
      {
        "id": "stub-select",
        "label": "Select"
      }
    ]
  },
  {
    "folderId": "folder-separator",
    "label": "Separator",
    "leaves": [
      {
        "id": "stub-separator",
        "label": "Separator"
      }
    ]
  },
  {
    "folderId": "folder-slider",
    "label": "Slider",
    "leaves": [
      {
        "id": "stub-slider",
        "label": "Slider"
      }
    ]
  },
  {
    "folderId": "folder-switch",
    "label": "Switch",
    "leaves": [
      {
        "id": "stub-switch",
        "label": "Switch"
      }
    ]
  },
  {
    "folderId": "folder-tabs",
    "label": "Tabs",
    "leaves": [
      {
        "id": "stub-tabs",
        "label": "Tabs"
      }
    ]
  },
  {
    "folderId": "folder-toast",
    "label": "Toast",
    "leaves": [
      {
        "id": "stub-toast",
        "label": "Toast"
      }
    ]
  },
  {
    "folderId": "folder-toggle",
    "label": "Toggle",
    "leaves": [
      {
        "id": "stub-toggle",
        "label": "Toggle"
      }
    ]
  },
  {
    "folderId": "folder-toggle-group",
    "label": "ToggleGroup",
    "leaves": [
      {
        "id": "stub-toggle-group",
        "label": "ToggleGroup"
      }
    ]
  },
  {
    "folderId": "folder-toolbar",
    "label": "Toolbar",
    "leaves": [
      {
        "id": "stub-toolbar",
        "label": "Toolbar"
      }
    ]
  },
  {
    "folderId": "folder-tooltip",
    "label": "Tooltip",
    "leaves": [
      {
        "id": "stub-tooltip",
        "label": "Tooltip"
      }
    ]
  },
  {
    "folderId": "folder-use-render",
    "label": "Use render",
    "leaves": [
      {
        "id": "stub-use-render",
        "label": "Use render"
      }
    ]
  }
] as const;
