"use strict";

// Loaded by slint-ui's rust-module.cjs when NAPI_RS_NATIVE_LIBRARY_PATH is set.
const path = process.env.NAPI_RS_NATIVE_LIBRARY_PATH;
if (!path) {
  throw new Error(
    "NAPI_RS_NATIVE_LIBRARY_PATH must be set before loading slint-ui",
  );
}
const mod = { exports: {} };
process.dlopen(mod, path);
module.exports = mod.exports;
