import type { MainWindowInstance } from "../../bridges/node/slint-interface.ts";
import { debounce } from "../utils/debounce.ts";
import { readWindowGeometryKv, writeWindowGeometryKv } from "./window-geometry-kv.ts";

const DEBOUNCE_MS = 350;

export function restoreMainWindowGeometry(window: MainWindowInstance): void {
  const saved = readWindowGeometryKv();
  if (saved === null) {
    return;
  }
  window.window.logicalSize = { width: saved.width, height: saved.height };
  window.window.maximized = saved.maximized;
}

type MainWindowGeometryPersister = {
  schedulePersist: () => void;
  persistNow: () => void;
  dispose: () => void;
};

export function createMainWindowGeometryPersister(
  window: MainWindowInstance,
): MainWindowGeometryPersister {
  const persist = debounce(() => {
    const { width, height } = window.window.logicalSize;
    writeWindowGeometryKv({
      width,
      height,
      maximized: window.window.maximized,
    });
  }, DEBOUNCE_MS);

  return {
    schedulePersist() {
      persist();
    },
    persistNow() {
      persist.flush();
    },
    dispose() {
      persist.cancel();
    },
  };
}
