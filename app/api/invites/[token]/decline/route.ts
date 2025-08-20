import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/libs/rate-limiter-middleware";
import { createClient } from "@/libs/supabase/server";

async function handler(request: NextRequest) {
  const supabase = createClient();
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    // Expect: ["api","invites","{token}","decline"]
    const token = segments[2];
    if (!token || token.length < 10) {
      return NextResponse.json({ error: "Token no vàlid" }, { status: 400 });
    }

    const { data: invite, error: inviteError } = await supabase
      .from("pair_invites")
      .select("id, invitee_id, status")
      .eq("token", token)
      .maybeSingle();

    if (inviteError || !invite) {
      return NextResponse.json({ message: "Invitació cancel·lada" });
    }

    if (invite.status !== "sent") {
      return NextResponse.json({ message: "La invitació no està activa" });
    }

    if (invite.invitee_id && invite.invitee_id !== user.id) {
      return NextResponse.json({ error: "No tens permís per rebutjar" }, { status: 403 });
    }

    const { error: updErr } = await supabase
      .from("pair_invites")
      .update({ status: "declined", declined_at: new Date().toISOString() })
      .eq("id", invite.id);
    if (updErr) {
      console.warn("Failed updating invite status to declined", updErr);
    }

    return NextResponse.json({ message: "Has rebutjat la invitació" });
  } catch (err) {
    console.error("Error in POST /api/invites/[token]/decline", err);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}

export const POST = withRateLimit("invites_action", handler);
