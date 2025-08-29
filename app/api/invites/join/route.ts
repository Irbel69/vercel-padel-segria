import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/libs/rate-limiter-middleware";
import { createClient, createServiceClient } from "@/libs/supabase/server";

async function handler(request: NextRequest) {
  try {
    // First, verify user is authenticated using normal client
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const { code } = (await request.json()) as { code?: string };
    const short_code = (code || "").toUpperCase().trim();
    if (!short_code || short_code.length < 4) {
      return NextResponse.json({ error: "Codi no vàlid" }, { status: 400 });
    }

    // Use Service Role client only for invite code lookup (bypasses RLS)
    // This is safe because:
    // 1. User is already authenticated
    // 2. We only search by short_code (no sensitive data exposure)
    // 3. We only return minimal data needed (token)
    // 4. Rate limiting is active
    const serviceSupabase = createServiceClient();

    // Opportunistic cleanup: remove expired invites to reduce DB bloat
    try {
      const nowIso = new Date().toISOString();
      await serviceSupabase
        .from("pair_invites")
        .delete()
        .eq("status", "sent")
        .lt("expires_at", nowIso);
    } catch (cleanupErr) {
      console.warn("Cleanup expired invites (join) non-fatal", cleanupErr);
    }

    // Lookup invite by short code using Service Role (bypasses RLS)
    const { data: invite, error } = await serviceSupabase
      .from("pair_invites")
      .select("id, event_id, inviter_id, status, token, expires_at")
      .eq("short_code", short_code)
      .limit(1)
      .maybeSingle();

    // Generic response to avoid enumeration
    if (error || !invite) {
      return NextResponse.json({ message: "Aquest codi és incorrecte o ha expirat" }, { status: 400 });
    }

    const now = new Date();
    if (invite.expires_at && new Date(invite.expires_at) < now) {
      return NextResponse.json({ message: "La invitació ha expirat" }, { status: 400 });
    }
    if (invite.status !== "sent") {
      return NextResponse.json({ message: "La invitació no està disponible" }, { status: 400 });
    }

    // At this point, we can respond with masked info and the token to continue on accept page
    return NextResponse.json({
      message: "Codi vàlid",
      data: {
        token: invite.token, // token is needed for accept/decline
      },
    });
  } catch (err) {
    console.error("Error in POST /api/invites/join", err);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}

export const POST = withRateLimit("invites_join", handler);
