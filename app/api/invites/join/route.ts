import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/libs/rate-limiter-middleware";
import { createClient } from "@/libs/supabase/server";

async function handler(request: NextRequest) {
  try {
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

    // Opportunistic cleanup: remove expired invites to reduce DB bloat
    try {
      const nowIso = new Date().toISOString();
      // Limit cleanup to invites where the current user is involved to satisfy RLS
      await supabase
        .from("pair_invites")
        .delete()
        .eq("status", "sent")
        .lt("expires_at", nowIso)
        .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}${user.email ? `,invitee_email.eq.${user.email}` : ""}`);
    } catch (cleanupErr) {
      console.warn("Cleanup expired invites (join) non-fatal", cleanupErr);
    }

    // Lookup invite by short code, ensure not expired or already finalized
    const { data: invite, error } = await supabase
      .from("pair_invites")
      .select("id, event_id, inviter_id, status, token, expires_at")
      .eq("short_code", short_code)
      .limit(1)
      .maybeSingle();

    // Generic response to avoid enumeration
    if (error || !invite) {
      return NextResponse.json({ message: "Aquest codi és incorrecte o ha expirat" });
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
