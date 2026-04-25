//! Primer gallery — Rust entry (mirrors `packages/slint-gallery/gallery-main.ts` wiring).

use slint::{ComponentHandle, ModelRc, SharedString, VecModel};
use std::cell::RefCell;
use std::collections::BTreeSet;
use std::rc::Rc;

slint::include_modules!();

const ACTION_LIST_ROW_LABELS: [&str; 4] = [
    "Primer Backlog",
    "Accessibility",
    "Octicons",
    "Primer React",
];

const SELECT_PANEL_MULTI_ROW_COUNT: usize = 5;

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

fn main() -> Result<(), slint::PlatformError> {
    let window = GalleryWindow::new()?;

    window.global::<GalleryState>().set_selected_group_index(0);

    wire_gallery_action_list_multi_select(&window);
    wire_gallery_action_list_listbox_multi_select(&window);
    wire_gallery_select_panel_multi(&window);

    window.run()
}
