fn main() {
    // Same as Node gallery (`packages/slint-gallery/node/package.json` + `node/gallery-main.ts`):
    // `cross-env SLINT_ENABLE_EXPERIMENTAL_FEATURES=1` — enables experimental builtins
    // (e.g. `FlexboxLayout` in Dialog / SelectPanel footers).
    std::env::set_var("SLINT_ENABLE_EXPERIMENTAL_FEATURES", "1");
    println!("cargo:rerun-if-env-changed=SLINT_ENABLE_EXPERIMENTAL_FEATURES");

    slint_build::compile("../ui/gallery-window.slint").unwrap();
}
