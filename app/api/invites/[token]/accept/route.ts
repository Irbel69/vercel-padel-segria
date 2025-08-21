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

    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    // Expect: ["api","invites","{token}","accept"]
    const token = segments[2];
    if (!token || token.length < 10) {
      return NextResponse.json({ error: "Token no vàlid" }, { status: 400 });
    }

    // Use Service Role client to access invite data (bypasses RLS)
    // This is safe because:
    // 1. User is already authenticated
    // 2. We validate invite permissions below
    // 3. Rate limiting is active
    const serviceSupabase = createServiceClient();

    // Fetch invite
    const { data: invite, error: inviteError } = await serviceSupabase
      .from("pair_invites")
      .select("id, event_id, inviter_id, invitee_id, status, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invitació no trobada" }, { status: 404 });
    }

    const now = new Date();
    if (invite.expires_at && new Date(invite.expires_at) < now) {
      return NextResponse.json({ error: "La invitació ha expirat" }, { status: 400 });
    }
    if (invite.status !== "sent") {
      return NextResponse.json({ error: "La invitació no és vàlida" }, { status: 400 });
    }

    // Ensure accepting user is either the intended invitee (if set) or acceptable by email-only invite
    // We don't have email here; RLS protects visibility. We allow any authenticated user to accept if invitee_id is null.
    if (invite.invitee_id && invite.invitee_id !== user.id) {
      return NextResponse.json({ error: "No tens permís per acceptar" }, { status: 403 });
    }

    // Fetch event and capacity/deadline checks
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, date, max_participants, registration_deadline, status")
      .eq("id", invite.event_id)
      .single();
    if (eventError || !event) {
      return NextResponse.json({ error: "Esdeveniment no trobat" }, { status: 404 });
    }
    if (event.status === "closed") {
      return NextResponse.json({ error: "Inscripcions tancades" }, { status: 400 });
    }
    if (new Date(event.registration_deadline) <= new Date()) {
      return NextResponse.json({ error: "La data límit ha passat" }, { status: 400 });
    }

    // Check invitee already registered (we tolerate inviter state due to RLS constraints)
    const { data: existingInviteeReg } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", event.id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (existingInviteeReg) {
      return NextResponse.json({ error: "Ja estàs inscrit" }, { status: 400 });
    }

    // Check if inviter is already registered
    const { data: existingInviterReg } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", event.id)
      .eq("user_id", invite.inviter_id)
      .limit(1)
      .maybeSingle();

    // Capacity check (for potentially two new registrations if inviter is not registered)
    const { count: currentParticipants } = await supabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("status", "confirmed");
      
    const newRegistrations = existingInviterReg ? 1 : 2; // invitee + maybe inviter
    if (currentParticipants && currentParticipants + newRegistrations > event.max_participants) {
      return NextResponse.json({ error: "No hi ha prou places per a la parella" }, { status: 400 });
    }

    // Create a shared pair_id and create/update registrations for both users
    const pair_id = crypto.randomUUID();

    // Helper to detect unique violation
    const isUniqueViolation = (err: any) => err && typeof err === "object" && err.code === "23505";

    // For the inviter, ensure they have a registration with the pair_id
    if (!existingInviterReg) {
      const { error: reg1Err } = await supabase
        .from("registrations")
        .insert({ user_id: invite.inviter_id, event_id: event.id, status: "confirmed", pair_id });
      if (reg1Err && !isUniqueViolation(reg1Err)) {
        console.error("Error creating inviter registration", reg1Err);
        return NextResponse.json({ error: "Error creant la inscripció de l'invitador" }, { status: 500 });
      }
    } else {
      // Update existing inviter registration with pair_id
      const { error: updateErr } = await supabase
        .from("registrations")
        .update({ pair_id })
        .eq("id", existingInviterReg.id);
      if (updateErr) {
        console.warn("Error updating inviter registration with pair_id", updateErr);
      }
    }

    // For the invitee (current user), upsert to ensure pair_id is set even if a row exists already
    const { error: reg2Err } = await supabase
      .from("registrations")
      .upsert(
        { user_id: user.id, event_id: event.id, status: "confirmed", pair_id },
        { onConflict: "user_id,event_id" }
      );
    if (reg2Err) {
      console.error("Error creating/updating invitee registration", reg2Err);
      return NextResponse.json({ error: "Error creant la inscripció" }, { status: 500 });
    }

    // Mark invite accepted using Service Role client
    const { error: updErr } = await serviceSupabase
      .from("pair_invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id);
    if (updErr) {
      console.warn("Failed updating invite status to accepted", updErr);
    }

    return NextResponse.json({ message: "Inscripció en parella confirmada" });
  } catch (err) {
    console.error("Error in POST /api/invites/[token]/accept", err);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}

export const POST = withRateLimit("invites_action", handler);
