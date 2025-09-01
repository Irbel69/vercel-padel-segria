import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

// Server-initiated OAuth flow (fixes PKCE issues by storing verifier in cookies)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider");
  if (!provider) {
    return new NextResponse("Missing provider", { status: 400 });
  }

  const supabase = createClient();

  // Redirect back to server callback so exchange happens on server with cookie-stored verifier
  const redirectTo = `${url.origin}/api/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as any,
    options: { redirectTo },
  });

  if (error || !data?.url) {
    console.error("OAuth initiation error", error);
    return NextResponse.redirect(`${url.origin}/signin?error=oauth_init_failed`, {
      status: 303,
    });
  }

  // Redirect the user to the provider's auth page; cookies (PKCE verifier) are set on this response
  const res = NextResponse.redirect(data.url, { status: 303 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
