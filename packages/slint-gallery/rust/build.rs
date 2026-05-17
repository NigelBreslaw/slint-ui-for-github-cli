fn main() {
    // Experimental builtins (e.g. `FlexboxLayout` in Dialog / SelectPanel footers) are enabled via
    // `SLINT_ENABLE_EXPERIMENTAL_FEATURES=1` in `.cargo/config.toml` (same as the Node gallery’s env).
    println!("cargo:rerun-if-env-changed=SLINT_ENABLE_EXPERIMENTAL_FEATURES");

    slint_build::compile("../ui/gallery-window.slint").unwrap();
}
