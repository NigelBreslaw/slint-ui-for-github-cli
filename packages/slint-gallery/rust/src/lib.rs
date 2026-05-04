//! Primer gallery — shared wiring (native binary and future WASM entry).

use slint::{ComponentHandle, Image, ModelRc, SharedString, VecModel};
use std::cell::RefCell;
use std::collections::BTreeSet;
use std::rc::Rc;

/// Keep in sync with **`packages/slint-gallery/node/state/gallery-sidebar-nav-bridge-shared.ts`** (`GALLERY_SIDEBAR_NAV`).
const GALLERY_SIDEBAR_NAV: [(&str, &str, &str); 14] = [
    (
        "folder-action-list",
        "Action list",
        "action-list-playground",
    ),
    ("folder-buttons", "Buttons", "buttons-playground"),
    ("folder-data", "Data", "data-playground"),
    ("folder-dialogs", "Dialogs", "dialogs-playground"),
    ("folder-feedback", "Feedback", "feedback-playground"),
    ("folder-forms", "Forms", "forms-playground"),
    ("folder-navs", "Navs", "navs-playground"),
    ("folder-select", "Select", "select-playground"),
    (
        "folder-segmented-control",
        "Segmented control",
        "segmented-control-playground",
    ),
    (
        "folder-state-label",
        "State label",
        "state-label-playground",
    ),
    (
        "folder-text-input",
        "Text input",
        "text-input-playground",
    ),
    (
        "folder-toggle-switch",
        "Toggle switch",
        "toggle-switch-playground",
    ),
    ("folder-tree-view", "Tree view", "tree-view-playground"),
    (
        "folder-underline-nav",
        "Underline nav",
        "underline-nav-playground",
    ),
];

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

slint::include_modules!();

const ACTION_LIST_ROW_LABELS: [&str; 4] = [
    "Primer Backlog",
    "Accessibility",
    "Octicons",
    "Primer React",
];

const SELECT_PANEL_MULTI_ROW_COUNT: usize = 5;

/// Keep in sync with **`packages/slint-gallery/node/state/gallery-tree-view-list-models-bridge-shared.ts`**
const GALLERY_TREE_STRESS_CHILD_COUNT: usize = 1000;
const GALLERY_TREE_NESTED_SCROLL_CHILD_COUNT: usize = 100;

fn tree_view_row_leaf(
    id: SharedString,
    label: SharedString,
    dot_fill: &Image,
    file_icon: &Image,
) -> TreeViewRow {
    TreeViewRow {
        id,
        label,
        level: 2,
        has_children: false,
        expanded: false,
        current: false,
        leading_is_directory: false,
        has_leading_visual: true,
        trailing: TreeViewTrailingVisual::None,
        has_leading_action: false,
        show_leading_action_icon: false,
        leading_action_icon: dot_fill.clone(),
        leading_file_icon: file_icon.clone(),
        interactive: true,
        is_skeleton: false,
        has_secondary_actions: false,
        secondary_actions_badge: SharedString::new(),
        loading_children_badge: SharedString::new(),
    }
}

fn tree_view_row_stress_root(dot_fill: &Image, file_icon: &Image) -> TreeViewRow {
    TreeViewRow {
        id: SharedString::from("stress-root"),
        label: SharedString::from("stress-root"),
        level: 1,
        has_children: true,
        expanded: true,
        current: false,
        leading_is_directory: true,
        has_leading_visual: true,
        trailing: TreeViewTrailingVisual::None,
        has_leading_action: false,
        show_leading_action_icon: false,
        leading_action_icon: dot_fill.clone(),
        leading_file_icon: file_icon.clone(),
        interactive: true,
        is_skeleton: false,
        has_secondary_actions: false,
        secondary_actions_badge: SharedString::new(),
        loading_children_badge: SharedString::new(),
    }
}

fn tree_view_row_nested_root(dot_fill: &Image, file_icon: &Image) -> TreeViewRow {
    TreeViewRow {
        id: SharedString::from("nested-root"),
        label: SharedString::from("root"),
        level: 1,
        has_children: true,
        expanded: true,
        current: false,
        leading_is_directory: true,
        has_leading_visual: true,
        trailing: TreeViewTrailingVisual::None,
        has_leading_action: false,
        show_leading_action_icon: false,
        leading_action_icon: dot_fill.clone(),
        leading_file_icon: file_icon.clone(),
        interactive: true,
        is_skeleton: false,
        has_secondary_actions: false,
        secondary_actions_badge: SharedString::new(),
        loading_children_badge: SharedString::new(),
    }
}

fn gallery_tree_view_stress_rows(icons: &Icons) -> Vec<TreeViewRow> {
    let dot = icons.get_dot_fill();
    let file = icons.get_file();
    let mut rows = Vec::with_capacity(1 + GALLERY_TREE_STRESS_CHILD_COUNT);
    rows.push(tree_view_row_stress_root(&dot, &file));
    for i in 0..GALLERY_TREE_STRESS_CHILD_COUNT {
        rows.push(tree_view_row_leaf(
            SharedString::from(format!("stress-{i}")),
            SharedString::from(format!("row-{i}")),
            &dot,
            &file,
        ));
    }
    rows
}

fn gallery_tree_view_nested_scroll_rows(icons: &Icons) -> Vec<TreeViewRow> {
    let dot = icons.get_dot_fill();
    let file = icons.get_file();
    let mut rows = Vec::with_capacity(1 + GALLERY_TREE_NESTED_SCROLL_CHILD_COUNT);
    rows.push(tree_view_row_nested_root(&dot, &file));
    for i in 0..GALLERY_TREE_NESTED_SCROLL_CHILD_COUNT {
        rows.push(tree_view_row_leaf(
            SharedString::from(format!("nested-{i}")),
            SharedString::from(format!("item-{i}")),
            &dot,
            &file,
        ));
    }
    rows
}

fn fill_gallery_tree_view_list_models(window: &GalleryWindow) {
    let icons = window.global::<Icons>();
    let stress = gallery_tree_view_stress_rows(&icons);
    let nested = gallery_tree_view_nested_scroll_rows(&icons);
    let g = window.global::<GalleryTreeViewListModels>();
    g.set_stress_list_rows(ModelRc::new(VecModel::from(stress)));
    g.set_nested_scroll_list_rows(ModelRc::new(VecModel::from(nested)));
}

fn sidebar_nav_is_folder_id(id: &str) -> bool {
    GALLERY_SIDEBAR_NAV
        .iter()
        .any(|(folder_id, _, _)| *folder_id == id)
}

fn sidebar_nav_is_leaf_id(id: &str) -> bool {
    GALLERY_SIDEBAR_NAV
        .iter()
        .any(|(_, _, leaf_id)| *leaf_id == id)
}

fn tree_view_row_sidebar_folder(
    folder_id: &str,
    label: &str,
    expanded: bool,
    current: bool,
    dot_fill: &Image,
    file_icon: &Image,
) -> TreeViewRow {
    TreeViewRow {
        id: SharedString::from(folder_id),
        label: SharedString::from(label),
        level: 1,
        has_children: true,
        expanded,
        current,
        leading_is_directory: true,
        has_leading_visual: true,
        trailing: TreeViewTrailingVisual::None,
        has_leading_action: false,
        show_leading_action_icon: false,
        leading_action_icon: dot_fill.clone(),
        leading_file_icon: file_icon.clone(),
        interactive: true,
        is_skeleton: false,
        has_secondary_actions: false,
        secondary_actions_badge: SharedString::new(),
        loading_children_badge: SharedString::new(),
    }
}

fn tree_view_row_sidebar_playground_leaf(
    leaf_id: &str,
    current: bool,
    dot_fill: &Image,
    file_icon: &Image,
) -> TreeViewRow {
    TreeViewRow {
        id: SharedString::from(leaf_id),
        label: SharedString::from("Playground"),
        level: 2,
        has_children: false,
        expanded: false,
        current,
        leading_is_directory: false,
        has_leading_visual: true,
        trailing: TreeViewTrailingVisual::None,
        has_leading_action: false,
        show_leading_action_icon: false,
        leading_action_icon: dot_fill.clone(),
        leading_file_icon: file_icon.clone(),
        interactive: true,
        is_skeleton: false,
        has_secondary_actions: false,
        secondary_actions_badge: SharedString::new(),
        loading_children_badge: SharedString::new(),
    }
}

fn gallery_sidebar_visible_rows(
    selected_page_id: SharedString,
    expanded_folder_ids: &BTreeSet<String>,
    dot_fill: &Image,
    file_icon: &Image,
) -> Vec<TreeViewRow> {
    let mut rows = Vec::new();
    for (folder_id, label, leaf_id) in GALLERY_SIDEBAR_NAV.iter() {
        let is_open = expanded_folder_ids.contains(*folder_id);
        let selection_in_folder = selected_page_id.as_str() == *leaf_id;
        rows.push(tree_view_row_sidebar_folder(
            folder_id,
            label,
            is_open,
            selection_in_folder && !is_open,
            dot_fill,
            file_icon,
        ));
        if is_open {
            rows.push(tree_view_row_sidebar_playground_leaf(
                leaf_id,
                selection_in_folder,
                dot_fill,
                file_icon,
            ));
        }
    }
    rows
}

fn push_gallery_sidebar_nav_rows(window: &GalleryWindow, expanded: &RefCell<BTreeSet<String>>) {
    let state = window.global::<GalleryState>();
    let selected = state.get_selected_page_id();
    let icons = window.global::<Icons>();
    let dot = icons.get_dot_fill();
    let file = icons.get_file();
    let ex = expanded.borrow();
    let rows = gallery_sidebar_visible_rows(selected, &ex, &dot, &file);
    window
        .global::<GallerySidebarNav>()
        .set_rows(ModelRc::new(VecModel::from(rows)));
}

/// Keep in sync with **`wireGallerySidebarNav`** in **`gallery-sidebar-nav-bridge-shared.ts`**.
fn wire_gallery_sidebar_nav(window: &GalleryWindow) {
    let expanded = Rc::new(RefCell::new(BTreeSet::<String>::new()));
    let window_weak = window.as_weak();

    window
        .global::<GallerySidebarNav>()
        .on_row_toggle_requested({
            let expanded = Rc::clone(&expanded);
            let window_weak = window_weak.clone();
            move |id: SharedString| {
                let id = id.to_string();
                if !sidebar_nav_is_folder_id(&id) {
                    return;
                }
                {
                    let mut ex = expanded.borrow_mut();
                    if ex.contains(&id) {
                        ex.remove(&id);
                    } else {
                        ex.insert(id);
                    }
                }
                let Some(w) = window_weak.upgrade() else {
                    return;
                };
                push_gallery_sidebar_nav_rows(&w, expanded.as_ref());
            }
        });

    window
        .global::<GallerySidebarNav>()
        .on_row_current_requested({
            let expanded = Rc::clone(&expanded);
            let window_weak = window_weak.clone();
            move |id: SharedString| {
                if !sidebar_nav_is_leaf_id(id.as_str()) {
                    return;
                }
                let Some(w) = window_weak.upgrade() else {
                    return;
                };
                w.global::<GalleryState>()
                    .set_selected_page_id(id.clone());
                push_gallery_sidebar_nav_rows(&w, expanded.as_ref());
            }
        });

    window
        .global::<GallerySidebarNav>()
        .on_row_secondary_actions_requested(|_id, _ax, _ay, _aw, _ah| {});

    push_gallery_sidebar_nav_rows(window, expanded.as_ref());
}

fn row_checked_model(row_count: usize, selected: &BTreeSet<usize>) -> ModelRc<bool> {
    let v: Vec<bool> = (0..row_count).map(|i| selected.contains(&i)).collect();
    ModelRc::new(VecModel::from(v))
}

fn action_list_selection_summary(selected: &BTreeSet<usize>) -> SharedString {
    let names: Vec<&str> = (0..ACTION_LIST_ROW_LABELS.len())
        .filter(|i| selected.contains(i))
        .map(|i| ACTION_LIST_ROW_LABELS[i])
        .collect();
    SharedString::from(if names.is_empty() {
        "(none)".to_string()
    } else {
        names.join(", ")
    })
}

fn wire_gallery_action_list_multi_select(window: &GalleryWindow) {
    let row_count = ACTION_LIST_ROW_LABELS.len();
    let selected = Rc::new(RefCell::new(BTreeSet::from([0usize])));
    let window_weak = window.as_weak();

    window
        .global::<GalleryActionListMultiSelect>()
        .on_row_activated({
            let selected = Rc::clone(&selected);
            let window_weak = window_weak.clone();
            move |ix: i32| {
                let ix = ix as usize;
                if ix >= row_count {
                    return;
                }
                {
                    let mut s = selected.borrow_mut();
                    if s.contains(&ix) {
                        s.remove(&ix);
                    } else {
                        s.insert(ix);
                    }
                }
                let Some(w) = window_weak.upgrade() else {
                    return;
                };
                let g = w.global::<GalleryActionListMultiSelect>();
                let s = selected.borrow();
                g.set_row_checked(row_checked_model(row_count, &s));
                g.set_last_activated_label(SharedString::from(ACTION_LIST_ROW_LABELS[ix]));
                g.set_selection_summary(action_list_selection_summary(&s));
            }
        });

    let g = window.global::<GalleryActionListMultiSelect>();
    let s = selected.borrow();
    g.set_row_checked(row_checked_model(row_count, &s));
    g.set_last_activated_label(SharedString::from(""));
    g.set_selection_summary(action_list_selection_summary(&s));
}

fn wire_gallery_action_list_listbox_multi_select(window: &GalleryWindow) {
    let row_count = ACTION_LIST_ROW_LABELS.len();
    let selected = Rc::new(RefCell::new(BTreeSet::from([0usize])));
    let window_weak = window.as_weak();

    window
        .global::<GalleryActionListListboxMultiSelect>()
        .on_row_activated({
            let selected = Rc::clone(&selected);
            let window_weak = window_weak.clone();
            move |ix: i32| {
                let ix = ix as usize;
                if ix >= row_count {
                    return;
                }
                {
                    let mut s = selected.borrow_mut();
                    if s.contains(&ix) {
                        s.remove(&ix);
                    } else {
                        s.insert(ix);
                    }
                }
                let Some(w) = window_weak.upgrade() else {
                    return;
                };
                let g = w.global::<GalleryActionListListboxMultiSelect>();
                let s = selected.borrow();
                g.set_row_checked(row_checked_model(row_count, &s));
                g.set_last_activated_label(SharedString::from(ACTION_LIST_ROW_LABELS[ix]));
                g.set_selection_summary(action_list_selection_summary(&s));
            }
        });

    let g = window.global::<GalleryActionListListboxMultiSelect>();
    let s = selected.borrow();
    g.set_row_checked(row_checked_model(row_count, &s));
    g.set_last_activated_label(SharedString::from(""));
    g.set_selection_summary(action_list_selection_summary(&s));
}

const FILTERED_ACTION_LIST_DEFAULT_LABELS: [&str; 7] = [
    "enhancement",
    "bug",
    "good first issue",
    "design",
    "blocker",
    "backend",
    "frontend",
];

const FILTERED_ACTION_LIST_LONG_LABELS: [&str; 4] = [
    "enhancement with a very long label that might wrap. enhancement with a very long label that might wrap. enhancement with a very long label that might wrap. ",
    "bug with an excessively verbose description that goes on and on. bug with an excessively verbose description that goes on and on. bug with an excessively verbose description that goes on and on.",
    "good first issue that is intended to be approachable for newcomers",
    "design related task that involves multiple stakeholders and considerations",
];

fn filter_prefix_labels<'a>(labels: &[&'a str], filter: &str) -> Vec<&'a str> {
    let q = filter.trim().to_lowercase();
    labels
        .iter()
        .copied()
        .filter(|l| q.is_empty() || l.to_lowercase().starts_with(&q))
        .collect()
}

fn action_list_line_from_label(label: &str) -> ActionListLine {
    ActionListLine {
        kind: ActionListLineKind::Row,
        label: label.into(),
        row_variant: ActionListRowVariant::Default,
        disabled: false,
        has_leading_avatar: false,
        avatar_source: Default::default(),
        has_leading_visual: false,
        leading_icon: Default::default(),
        description: SharedString::new(),
        description_layout: ActionListDescriptionLayout::None,
        has_markdown: false,
        label_markdown: Default::default(),
        inactive_text: SharedString::new(),
        active: false,
        show_trailing_loading: false,
        has_trailing_visual: false,
        trailing_icon: Default::default(),
    }
}

fn action_list_lines_from_labels(labels: &[&str]) -> Vec<ActionListLine> {
    labels.iter().map(|&l| action_list_line_from_label(l)).collect()
}

fn wire_gallery_filtered_action_list_default(window: &GalleryWindow) {
    let window_weak = window.as_weak();
    window
        .global::<GalleryFilteredActionListDefault>()
        .on_filter_changed({
            let window_weak = window_weak.clone();
            move |filter: SharedString| {
                let picked = filter_prefix_labels(&FILTERED_ACTION_LIST_DEFAULT_LABELS, filter.as_str());
                let lines = action_list_lines_from_labels(&picked);
                let Some(w) = window_weak.upgrade() else {
                    return;
                };
                w.global::<GalleryFilteredActionListDefault>()
                    .set_lines(ModelRc::new(VecModel::from(lines)));
            }
        });
    let picked = filter_prefix_labels(&FILTERED_ACTION_LIST_DEFAULT_LABELS, "");
    let lines = action_list_lines_from_labels(&picked);
    window
        .global::<GalleryFilteredActionListDefault>()
        .set_lines(ModelRc::new(VecModel::from(lines)));
}

fn wire_gallery_filtered_action_list_long(window: &GalleryWindow) {
    let window_weak = window.as_weak();
    window
        .global::<GalleryFilteredActionListLong>()
        .on_filter_changed({
            let window_weak = window_weak.clone();
            move |filter: SharedString| {
                let picked = filter_prefix_labels(&FILTERED_ACTION_LIST_LONG_LABELS, filter.as_str());
                let lines = action_list_lines_from_labels(&picked);
                let Some(w) = window_weak.upgrade() else {
                    return;
                };
                w.global::<GalleryFilteredActionListLong>()
                    .set_lines(ModelRc::new(VecModel::from(lines)));
            }
        });
    let picked = filter_prefix_labels(&FILTERED_ACTION_LIST_LONG_LABELS, "");
    let lines = action_list_lines_from_labels(&picked);
    window
        .global::<GalleryFilteredActionListLong>()
        .set_lines(ModelRc::new(VecModel::from(lines)));
}

fn sync_gallery_filtered_action_list_select_all(
    window: &GalleryWindow,
    selected: &RefCell<BTreeSet<String>>,
    filter: &RefCell<String>,
) {
    let picked = filter_prefix_labels(&FILTERED_ACTION_LIST_DEFAULT_LABELS, filter.borrow().as_str());
    let sel = selected.borrow();
    let lines: Vec<ActionListLine> = picked
        .iter()
        .map(|&l| action_list_line_from_label(l))
        .collect();
    let multi: Vec<bool> = picked.iter().map(|l| sel.contains(*l)).collect();
    let all = !picked.is_empty() && picked.iter().all(|l| sel.contains(*l));
    let some = picked.iter().any(|l| sel.contains(*l));
    let indeterminate = !all && some;
    let g = window.global::<GalleryFilteredActionListSelectAll>();
    g.set_lines(ModelRc::new(VecModel::from(lines)));
    g.set_multi_selected(ModelRc::new(VecModel::from(multi)));
    g.set_select_all_checked(all);
    g.set_select_all_indeterminate(indeterminate);
}

fn wire_gallery_filtered_action_list_select_all(window: &GalleryWindow) {
    let selected = Rc::new(RefCell::new(BTreeSet::<String>::new()));
    let filter = Rc::new(RefCell::new(String::new()));
    let window_weak = window.as_weak();

    window
        .global::<GalleryFilteredActionListSelectAll>()
        .on_filter_changed({
            let selected = Rc::clone(&selected);
            let filter = Rc::clone(&filter);
            let window_weak = window_weak.clone();
            move |t: SharedString| {
                *filter.borrow_mut() = t.to_string();
                let Some(w) = window_weak.upgrade() else {
                    return;
                };
                sync_gallery_filtered_action_list_select_all(&w, &selected, &filter);
            }
        });

    window
        .global::<GalleryFilteredActionListSelectAll>()
        .on_item_activated({
            let selected = Rc::clone(&selected);
            let filter = Rc::clone(&filter);
            let window_weak = window_weak.clone();
            move |ix: i32| {
                let ix = ix as usize;
                let picked =
                    filter_prefix_labels(&FILTERED_ACTION_LIST_DEFAULT_LABELS, filter.borrow().as_str());
                if ix >= picked.len() {
                    return;
                }
                let label = picked[ix];
                {
                    let mut s = selected.borrow_mut();
                    if s.contains(label) {
                        s.remove(label);
                    } else {
                        s.insert(label.to_string());
                    }
                }
                let Some(w) = window_weak.upgrade() else {
                    return;
                };
                sync_gallery_filtered_action_list_select_all(&w, &selected, &filter);
            }
        });

    window
        .global::<GalleryFilteredActionListSelectAll>()
        .on_select_all_changed({
            let selected = Rc::clone(&selected);
            let filter = Rc::clone(&filter);
            let window_weak = window_weak.clone();
            move |on: bool| {
                let picked =
                    filter_prefix_labels(&FILTERED_ACTION_LIST_DEFAULT_LABELS, filter.borrow().as_str());
                let mut s = selected.borrow_mut();
                if on {
                    for l in picked {
                        s.insert(l.to_string());
                    }
                } else {
                    for l in picked {
                        s.remove(l);
                    }
                }
                drop(s);
                let Some(w) = window_weak.upgrade() else {
                    return;
                };
                sync_gallery_filtered_action_list_select_all(&w, &selected, &filter);
            }
        });

    sync_gallery_filtered_action_list_select_all(window, &selected, &filter);
}

fn wire_gallery_select_panel_multi(window: &GalleryWindow) {
    let selected = Rc::new(RefCell::new(BTreeSet::from([1usize, 2usize])));
    let window_weak = window.as_weak();

    window.global::<GallerySelectPanelMulti>().on_row_activated({
        let selected = Rc::clone(&selected);
        let window_weak = window_weak.clone();
        move |ix: i32| {
            let ix = ix as usize;
            if ix >= SELECT_PANEL_MULTI_ROW_COUNT {
                return;
            }
            {
                let mut s = selected.borrow_mut();
                if s.contains(&ix) {
                    s.remove(&ix);
                } else {
                    s.insert(ix);
                }
            }
            let Some(w) = window_weak.upgrade() else {
                return;
            };
            let g = w.global::<GallerySelectPanelMulti>();
            let s = selected.borrow();
            g.set_row_checked(row_checked_model(SELECT_PANEL_MULTI_ROW_COUNT, &s));
        }
    });

    let g = window.global::<GallerySelectPanelMulti>();
    let s = selected.borrow();
    g.set_row_checked(row_checked_model(SELECT_PANEL_MULTI_ROW_COUNT, &s));
}

/// Create the gallery window, wire demo globals, and run the event loop.
pub fn run_gallery() -> Result<(), slint::PlatformError> {
    let window = GalleryWindow::new()?;

    wire_gallery_action_list_multi_select(&window);
    wire_gallery_action_list_listbox_multi_select(&window);
    wire_gallery_select_panel_multi(&window);
    wire_gallery_filtered_action_list_default(&window);
    wire_gallery_filtered_action_list_long(&window);
    wire_gallery_filtered_action_list_select_all(&window);

    fill_gallery_tree_view_list_models(&window);
    wire_gallery_sidebar_nav(&window);

    window.run()
}

/// Web entry: call from JS after loading the wasm module (see `index.html` in a later PR).
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn start() {
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();
    run_gallery().expect("Primer Slint gallery failed to start");
}
