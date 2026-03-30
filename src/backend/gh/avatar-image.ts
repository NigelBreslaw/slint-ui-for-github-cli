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

/** True for the 1×1 transparent placeholder used when no avatar is shown. */
export function isPlaceholderAvatarImage(img: SlintRgbaImage): boolean {
  return (
    img.width === emptyTransparentAvatarImage.width &&
    img.height === emptyTransparentAvatarImage.height &&
    img.data.equals(emptyTransparentAvatarImage.data)
  );
}

const FETCH_TIMEOUT_MS = 15_000;
/** Avatars larger than this (on either axis) are resized before cache write. */
const AVATAR_CACHE_SIZE = 128;

function debugAvatar(message: string, url: string, startedAt: number): void {
  if (process.env.GH_DEBUG_AVATAR !== "1") {
    return;
  }
  const preview = url.length > 120 ? `${url.slice(0, 117)}...` : url;
  const ms = (performance.now() - startedAt).toFixed(1);
  console.error(`[avatar] ${message} (${ms}ms) ${preview}`);
}

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

/**
 * If the image exceeds {@link AVATAR_CACHE_SIZE} on width or height, resize to
 * AVATAR_CACHE_SIZE×AVATAR_CACHE_SIZE (cover) and re-encode as PNG for cache + decode.
 */
async function downscaleAvatarForCacheIfNeeded(
  bytes: Buffer,
  contentType: string | null,
): Promise<{ bytes: Buffer; contentType: string | null }> {
  const meta = await sharp(bytes).metadata();
  const w = meta.width;
  const h = meta.height;
  if (w <= AVATAR_CACHE_SIZE && h <= AVATAR_CACHE_SIZE) {
    return { bytes, contentType };
  }
  const resized = await sharp(bytes)
    .resize(AVATAR_CACHE_SIZE, AVATAR_CACHE_SIZE, { fit: "cover" })
    .jpeg()
    .toBuffer();
  return { bytes: resized, contentType: "image/jpeg" };
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

  const startedAt = performance.now();

  const cached = readCachedAvatarFile(url);
  if (cached !== undefined) {
    try {
      const decoded = await bufferToRgba(cached);
      if (decoded !== undefined) {
        debugAvatar("source=filesystem (cache hit), image ready", url, startedAt);
        return decoded;
      }
    } catch {
      /* corrupt cache */
    }
    debugAvatar("source=filesystem invalid, clearing cache", url, startedAt);
    removeCachedAvatarFile(url);
  }

  const downloaded = await fetchAvatarBytes(url);
  if (downloaded === undefined) {
    debugAvatar("source=network (fetch failed), no image", url, startedAt);
    return undefined;
  }

  let toStore = downloaded;
  try {
    toStore = await downscaleAvatarForCacheIfNeeded(downloaded.bytes, downloaded.contentType);
  } catch {
    /* if resize/metadata fails, fall back to original bytes */
  }

  try {
    writeCachedAvatarFile(url, toStore.bytes, toStore.contentType);
  } catch {
    /* still try to decode if disk write fails */
  }

  try {
    const decoded = await bufferToRgba(toStore.bytes);
    if (decoded !== undefined) {
      debugAvatar("source=network (downloaded), image ready", url, startedAt);
    } else {
      debugAvatar("source=network (decode failed after download), no image", url, startedAt);
    }
    return decoded;
  } catch {
    debugAvatar("source=network (decode error after download), no image", url, startedAt);
    return undefined;
  }
}
