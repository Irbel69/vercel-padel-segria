import { createClient } from "@/libs/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "event-images"; // Ensure this bucket exists in Supabase Storage

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
