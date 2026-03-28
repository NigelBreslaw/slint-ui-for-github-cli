import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { appDataRoot } from "../paths/app-data-root.ts";

function avatarCacheDir(): string {
  return join(appDataRoot(), "avatars");
}

function urlHash(url: string): string {
  return createHash("sha256").update(url, "utf8").digest("hex");
}

/** Leading dot; default `.bin` when unknown. */
function contentTypeToExt(contentType: string | null): string {
  if (contentType === null || contentType.length === 0) {
    return ".bin";
  }
  const base = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
  };
  return map[base] ?? ".bin";
}

function listCachedFilesForUrl(url: string): string[] {
  const hash = urlHash(url);
  const prefix = `${hash}.`;
  const dir = avatarCacheDir();
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch (e: unknown) {
    if (e !== null && typeof e === "object" && "code" in e && e.code === "ENOENT") {
      return [];
    }
    throw e;
  }
  return names.filter((n) => n.startsWith(prefix) && n.length > prefix.length);
}

export function readCachedAvatarFile(url: string): Buffer | undefined {
  if (url.length === 0) {
    return undefined;
  }
  const matches = listCachedFilesForUrl(url);
  if (matches.length === 0) {
    return undefined;
  }
  if (matches.length > 1) {
    for (const name of matches) {
      unlinkSync(join(avatarCacheDir(), name));
    }
    return undefined;
  }
  try {
    return readFileSync(join(avatarCacheDir(), matches[0]!));
  } catch (e: unknown) {
    if (e !== null && typeof e === "object" && "code" in e && e.code === "ENOENT") {
      return undefined;
    }
    throw e;
  }
}

export function writeCachedAvatarFile(
  url: string,
  bytes: Buffer,
  contentType: string | null,
): void {
  if (url.length === 0) {
    return;
  }
  const hash = urlHash(url);
  const ext = contentTypeToExt(contentType);
  const dir = avatarCacheDir();
  mkdirSync(dir, { recursive: true });
  removeCachedAvatarFilesForUrl(url);
  writeFileSync(join(dir, `${hash}${ext}`), bytes);
}

/** Removes every `avatars/{sha256(url)}.*` file for this URL. */
export function removeCachedAvatarFile(url: string): void {
  removeCachedAvatarFilesForUrl(url);
}

function removeCachedFilesByHash(hash: string): void {
  const prefix = `${hash}.`;
  const dir = avatarCacheDir();
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch (e: unknown) {
    if (e !== null && typeof e === "object" && "code" in e && e.code === "ENOENT") {
      return;
    }
    throw e;
  }
  for (const name of names) {
    if (name.startsWith(prefix) && name.length > prefix.length) {
      try {
        unlinkSync(join(dir, name));
      } catch (e: unknown) {
        if (e !== null && typeof e === "object" && "code" in e && e.code === "ENOENT") {
          continue;
        }
        throw e;
      }
    }
  }
}

function removeCachedAvatarFilesForUrl(url: string): void {
  if (url.length === 0) {
    return;
  }
  removeCachedFilesByHash(urlHash(url));
}
