import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only client using the Service Role key.
// Never import this in client-side code.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }
  if (!serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable (server-only)."
    );
  }

  return createSupabaseClient(url, serviceKey);
}
