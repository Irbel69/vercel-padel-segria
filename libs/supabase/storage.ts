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

  // Infer extension from mime type
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const uuid = crypto.randomUUID();
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
