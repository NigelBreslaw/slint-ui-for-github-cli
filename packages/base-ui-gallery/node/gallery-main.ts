type GalleryWindowModule = {
  GalleryWindow: new () => {
    show(): void;
    hide(): void;
  };
};

export async function runGallery(galleryWindowPath: string): Promise<void> {
  const slint = await import("slint-ui");

  const ui = slint.loadFile(galleryWindowPath) as GalleryWindowModule;
  const window = new ui.GalleryWindow();

  window.show();
  await slint.runEventLoop();
  window.hide();
}
