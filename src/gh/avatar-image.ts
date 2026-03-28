import sharp from "sharp";

/** RGBA pixel buffer for Slint-node `image` properties (`width * height * 4` bytes). */
export type SlintRgbaImage = {
  width: number;
  height: number;
  data: Buffer;
};

const FETCH_TIMEOUT_MS = 15_000;

/**
 * Downloads an image URL and decodes to RGBA for Slint.
 * Returns `undefined` on network, timeout, or decode errors.
 */
export async function loadAvatarRgba(
  url: string,
): Promise<SlintRgbaImage | undefined> {
  if (url.length === 0) {
    return undefined;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, FETCH_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      return undefined;
    }
    const input = Buffer.from(await res.arrayBuffer());
    const { data, info } = await sharp(input)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    if (info.channels !== 4) {
      return undefined;
    }
    return {
      width: info.width,
      height: info.height,
      data,
    };
  } catch {
    return undefined;
  }
}
