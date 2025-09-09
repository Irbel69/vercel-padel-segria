import { createClient } from "@/libs/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "images"; // Single images bucket used for events and prizes

export async function uploadEventCover(file: File, eventId: number) {
  if (!file) throw new Error("No file provided");
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Format no suportat. Utilitza JPEG, PNG o WEBP.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("La imatge supera el límit de 5MB.");
  }

  const supabase = createClient();

  // UUID v4 generator with Safari-safe fallbacks
  function safeUuidV4(): string {
    try {
      // Modern browsers
      if (typeof globalThis !== "undefined" && (globalThis as any).crypto?.randomUUID) {
        return (globalThis as any).crypto.randomUUID();
      }
      // Use getRandomValues when available
      const cryptoObj: Crypto | undefined = (typeof globalThis !== "undefined" ? (globalThis as any).crypto : undefined) as Crypto | undefined;
      if (cryptoObj?.getRandomValues) {
        const bytes = new Uint8Array(16);
        cryptoObj.getRandomValues(bytes);
        // Per RFC 4122 section 4.4
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
        const hex: string[] = [];
        for (let i = 0; i < bytes.length; i++) {
          hex.push((bytes[i] + 0x100).toString(16).substring(1));
        }
        return (
          hex[0] + hex[1] + hex[2] + hex[3] + "-" +
          hex[4] + hex[5] + "-" +
          hex[6] + hex[7] + "-" +
          hex[8] + hex[9] + "-" +
          hex[10] + hex[11] + hex[12] + hex[13] + hex[14] + hex[15]
        );
      }
    } catch {
      // ignore and fallback to Math.random
    }
    // Last resort (lower entropy, but avoids runtime crash)
    const rnd = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
    return (
      rnd().slice(0, 8) + "-" +
      rnd().slice(0, 4) + "-4" + rnd().slice(0, 3) + "-" +
      ((8 + Math.floor(Math.random() * 4)).toString(16)) + rnd().slice(0, 3) + "-" +
      rnd() + rnd().slice(0, 4)
    );
  }

  // Infer extension from mime type
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const uuid = safeUuidV4();
  const path = `covers/${eventId}/${uuid}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    // Enrich error with more diagnostics
    const status = (uploadError as unknown as { status?: number }).status;
    const details = [
      uploadError.name ? `name=${uploadError.name}` : null,
      uploadError.message ? `message=${uploadError.message}` : null,
      typeof status !== "undefined" ? `status=${status}` : null,
      `bucket=${BUCKET}`,
      `path=${path}`,
    ]
      .filter(Boolean)
      .join(" ");
    console.warn("[uploadEventCover] Upload failed:", details);
    throw new Error(uploadError.message || "Error pujant la imatge (revisa bucket i polítiques)");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl;
  return { publicUrl, path } as const;
}

export async function uploadPrizeImage(file: File, prizeId?: number) {
  if (!file) throw new Error("No file provided");
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Format no suportat. Utilitza JPEG, PNG o WEBP.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("La imatge supera el límit de 5MB.");
  }

  const supabase = createClient();

  // Reuse safe UUID generator from above
  function safeUuidV4(): string {
    try {
      if (typeof globalThis !== "undefined" && (globalThis as any).crypto?.randomUUID) {
        return (globalThis as any).crypto.randomUUID();
      }
      const cryptoObj: Crypto | undefined = (typeof globalThis !== "undefined" ? (globalThis as any).crypto : undefined) as Crypto | undefined;
      if (cryptoObj?.getRandomValues) {
        const bytes = new Uint8Array(16);
        cryptoObj.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex: string[] = [];
        for (let i = 0; i < bytes.length; i++) {
          hex.push((bytes[i] + 0x100).toString(16).substring(1));
        }
        return (
          hex[0] + hex[1] + hex[2] + hex[3] + "-" +
          hex[4] + hex[5] + "-" +
          hex[6] + hex[7] + "-" +
          hex[8] + hex[9] + "-" +
          hex[10] + hex[11] + hex[12] + hex[13] + hex[14] + hex[15]
        );
      }
    } catch {
      // ignore and fallback
    }
    const rnd = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
    return (
      rnd().slice(0, 8) + "-" +
      rnd().slice(0, 4) + "-4" + rnd().slice(0, 3) + "-" +
      ((8 + Math.floor(Math.random() * 4)).toString(16)) + rnd().slice(0, 3) + "-" +
      rnd() + rnd().slice(0, 4)
    );
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const uuid = safeUuidV4();
  const idSegment = typeof prizeId !== "undefined" ? String(prizeId) : "unassigned";
  const path = `prizes/${idSegment}/${uuid}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    const status = (uploadError as unknown as { status?: number }).status;
    const message = uploadError.message || String(uploadError);
    const details = [
      uploadError.name ? `name=${uploadError.name}` : null,
      message ? `message=${message}` : null,
      typeof status !== "undefined" ? `status=${status}` : null,
      `bucket=${BUCKET}`,
      `path=${path}`,
    ]
      .filter(Boolean)
      .join(" ");
  console.warn("[uploadPrizeImage] Upload to images bucket failed:", details);

  // Common cause: the `images` bucket does not exist or has RLS preventing anonymous uploads
    // Attempt a safe fallback to the existing event-images bucket so the UI remains usable.
    try {
      console.warn("[uploadPrizeImage] Attempting fallback upload to existing bucket:", BUCKET);
      const { error: fallbackErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (!fallbackErr) {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        return { publicUrl: data.publicUrl, path } as const;
      }
      console.warn("[uploadPrizeImage] Fallback upload also failed:", fallbackErr);
    } catch (e) {
      console.warn("[uploadPrizeImage] Fallback attempt threw:", e);
    }

    // If fallback didn't succeed, throw an enriched error to help debugging/setup
    throw new Error(
      `${message} — upload to bucket '${BUCKET}' failed. Ensure the bucket exists and allows uploads (or create a public bucket named '${BUCKET}').`
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl;
  return { publicUrl, path } as const;
}

/**
 * Upload both original and cropped versions of a prize image.
 * The original is stored under prizes/originals and the cropped (display) under prizes/.
 * Returns both public URLs so the frontend can persist original_image_url for future re-crops.
 */
export async function uploadPrizeImageWithOriginal(params: { originalFile: File; croppedFile: File; prizeId?: number }) {
  const { originalFile, croppedFile, prizeId } = params;
  const supabase = createClient();

  // Reuse validations for cropped file (size/type) and assume original respects same limits.
  [originalFile, croppedFile].forEach((f) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      throw new Error("Format no suportat. Utilitza JPEG, PNG o WEBP.");
    }
    if (f.size > MAX_FILE_SIZE) {
      throw new Error("La imatge supera el límit de 5MB.");
    }
  });

  function extFor(file: File) {
    return file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  }

  // Simple uuid reuse per pair so we can correlate
  function safeUuidV4(): string {
    try {
      if (typeof globalThis !== "undefined" && (globalThis as any).crypto?.randomUUID) {
        return (globalThis as any).crypto.randomUUID();
      }
      const cryptoObj: Crypto | undefined = (typeof globalThis !== "undefined" ? (globalThis as any).crypto : undefined) as Crypto | undefined;
      if (cryptoObj?.getRandomValues) {
        const bytes = new Uint8Array(16);
        cryptoObj.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex: string[] = [];
        for (let i = 0; i < bytes.length; i++) hex.push((bytes[i] + 0x100).toString(16).substring(1));
        return (
          hex[0] + hex[1] + hex[2] + hex[3] + "-" +
          hex[4] + hex[5] + "-" +
          hex[6] + hex[7] + "-" +
          hex[8] + hex[9] + "-" +
          hex[10] + hex[11] + hex[12] + hex[13] + hex[14] + hex[15]
        );
      }
    } catch {}
    const rnd = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
    return (
      rnd().slice(0, 8) + "-" +
      rnd().slice(0, 4) + "-4" + rnd().slice(0, 3) + "-" +
      ((8 + Math.floor(Math.random() * 4)).toString(16)) + rnd().slice(0, 3) + "-" +
      rnd() + rnd().slice(0, 4)
    );
  }

  const uuid = safeUuidV4();
  const idSegment = typeof prizeId !== "undefined" ? String(prizeId) : "unassigned";
  const originalPath = `prizes/${idSegment}/originals/${uuid}.${extFor(originalFile)}`;
  const croppedPath = `prizes/${idSegment}/${uuid}.${extFor(croppedFile)}`;

  // Upload original
  const { error: origErr } = await supabase.storage.from(BUCKET).upload(originalPath, originalFile, {
    contentType: originalFile.type,
    upsert: false,
  });
  if (origErr) {
    throw new Error(origErr.message || 'Error pujant la imatge original');
  }

  // Upload cropped
  const { error: cropErr } = await supabase.storage.from(BUCKET).upload(croppedPath, croppedFile, {
    contentType: croppedFile.type,
    upsert: false,
  });
  if (cropErr) {
    // Best-effort: do not delete original; surface error
    throw new Error(cropErr.message || 'Error pujant la imatge retallada');
  }

  const { data: oData } = supabase.storage.from(BUCKET).getPublicUrl(originalPath);
  const { data: cData } = supabase.storage.from(BUCKET).getPublicUrl(croppedPath);

  return { originalUrl: oData.publicUrl, originalPath, publicUrl: cData.publicUrl, path: croppedPath } as const;
}

/**
 * Delete a prize image from storage.
 * Accepts either a storage path (e.g. "prizes/123/uuid.jpg") or a public URL
 * previously returned by getPublicUrl. Attempts to extract bucket and path
 * from the URL when necessary and calls Supabase Storage remove().
 */
export async function deletePrizeImage(publicUrlOrPath: string) {
  if (!publicUrlOrPath) throw new Error("No path or URL provided");

  const supabase = createClient();

  // Try to parse a public URL to derive bucket and path. Supabase public URLs
  // typically contain "/storage/v1/object/public/<bucket>/<path>".
  let bucket = BUCKET;
  let path = publicUrlOrPath;

  try {
    const url = new URL(publicUrlOrPath);
      const STORAGE_MARKER = "/storage/v1/object/public/";
    const idx = url.pathname.indexOf(STORAGE_MARKER);
    if (idx !== -1) {
      const after = url.pathname.substring(idx + STORAGE_MARKER.length); // bucket/..path
      const firstSlash = after.indexOf("/");
      if (firstSlash > 0) {
          bucket = after.substring(0, firstSlash);
        path = after.substring(firstSlash + 1);
      } else {
        // Unexpected shape; treat remainder as path
        path = after;
      }
    } else {
      // Not a Supabase storage public URL - if it looks like bucket/path, try to detect
      // a leading bucket segment separated by '/'. Otherwise assume default prizes bucket.
      if (publicUrlOrPath.startsWith("prizes/") || publicUrlOrPath.startsWith("covers/")) {
        path = publicUrlOrPath;
        bucket = BUCKET;
      }
    }
  } catch (e) {
    // Not a valid URL, assume it's a path relative to the prizes bucket
    path = publicUrlOrPath;
    bucket = BUCKET;
  }

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    const status = (error as any)?.status;
    const message = (error as any)?.message || String(error);
    console.warn("[deletePrizeImage] remove failed:", { status, message, bucket, path });
    throw new Error(message || "Failed to delete image from storage");
  }

  return { bucket, path } as const;
}
