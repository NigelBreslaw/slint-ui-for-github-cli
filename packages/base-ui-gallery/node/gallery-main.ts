import type { ImageData } from "slint-ui";
import {
  wireGallerySidebarNav,
  type GallerySidebarNavHandle,
  type GalleryStubContentHandle,
} from "./state/gallery-sidebar-nav-bridge-shared.ts";

type GalleryWindowModule = {
  GalleryWindow: new () => {
    show(): void;
    hide(): void;
    GalleryState: {
      selected_page_id: string;
    };
    GallerySidebarNav: GallerySidebarNavHandle;
    GalleryStubContent: GalleryStubContentHandle;
    Icons: {
      dot_fill: ImageData;
      file: ImageData;
    };
  };
};

export async function runGallery(galleryWindowPath: string): Promise<void> {
  const slint = await import("slint-ui");

  const ui = slint.loadFile(galleryWindowPath) as GalleryWindowModule;
  const window = new ui.GalleryWindow();

  wireGallerySidebarNav(
    window.GallerySidebarNav,
    window.GalleryState,
    window.GalleryStubContent,
    window.Icons.dot_fill,
    window.Icons.file,
  );

  window.show();
  await slint.runEventLoop();
  window.hide();
}
