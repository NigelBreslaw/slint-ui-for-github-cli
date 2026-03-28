import sharp from "sharp";
import {
  readCachedAvatarFile,
  removeCachedAvatarFile,
  writeCachedAvatarFile,
} from "./avatar-cache-fs.ts";

/** RGBA pixel buffer for Slint-node `image` properties (`width * height * 4` bytes). */
export type SlintRgbaImage = {
  width: number;
  height: number;
  data: Buffer;
};

/** 1×1 transparent RGBA. Slint-node rejects `undefined` for `image` bindings; use this to clear. */
export const emptyTransparentAvatarImage: SlintRgbaImage = {
  width: 1,
  height: 1,
  data: Buffer.from([0, 0, 0, 0]),
};

const FETCH_TIMEOUT_MS = 15_000;

async function bufferToRgba(input: Buffer): Promise<SlintRgbaImage | undefined> {
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
}

async function fetchAvatarBytes(
  url: string,
): Promise<{ bytes: Buffer; contentType: string | null } | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      return undefined;
    }
    const contentType = res.headers.get("content-type");
    return {
      bytes: Buffer.from(await res.arrayBuffer()),
      contentType,
    };
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Loads avatar image: filesystem cache (under `./.data/avatars`), else network, then decodes to RGBA for Slint.
 */
export async function loadAvatarRgba(url: string): Promise<SlintRgbaImage | undefined> {
  if (url.length === 0) {
    return undefined;
  }

  const cached = readCachedAvatarFile(url);
  if (cached !== undefined) {
    try {
      const decoded = await bufferToRgba(cached);
      if (decoded !== undefined) {
        return decoded;
      }
    } catch {
      /* corrupt cache */
    }
    removeCachedAvatarFile(url);
  }

  const downloaded = await fetchAvatarBytes(url);
  if (downloaded === undefined) {
    return undefined;
  }

  try {
    writeCachedAvatarFile(url, downloaded.bytes, downloaded.contentType);
  } catch {
    /* still try to decode if disk write fails */
  }

  try {
    return await bufferToRgba(downloaded.bytes);
  } catch {
    return undefined;
  }
}
