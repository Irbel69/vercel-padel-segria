import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/libs/rate-limiter-middleware";
import { createClient, createServiceClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

async function handler(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG] Starting invite accept handler");
    console.log("🔍 [DEBUG] Request URL:", request.url);
    console.log("🔍 [DEBUG] Request method:", request.method);
    console.log("🔍 [DEBUG] Request headers:", Object.fromEntries(request.headers.entries()));
    
    // Check for cookies
    const cookies = request.headers.get('cookie');
    console.log("🔍 [DEBUG] Request cookies:", cookies ? cookies.substring(0, 200) + '...' : 'No cookies');
    
    // First, verify user is authenticated using normal client
    console.log("🔍 [DEBUG] Creating Supabase client...");
    const supabase = createClient();
    
    console.log("🔍 [DEBUG] Getting user from Supabase...");
    const { data: auth, error: authError } = await supabase.auth.getUser();
    
    console.log("🔍 [DEBUG] Auth result:", {
      user: auth?.user ? { id: auth.user.id, email: auth.user.email } : null,
      error: authError
    });
    
    const user = auth?.user;
    if (!user) {
      console.log("❌ [DEBUG] No authenticated user found, returning 401");
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }
    
    console.log("✅ [DEBUG] User authenticated:", user.id);

    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    console.log("🔍 [DEBUG] URL segments:", segments);
    
    // Expect: ["api","invites","{token}","accept"]
    const token = segments[2];
    console.log("🔍 [DEBUG] Extracted token:", token);
    
    if (!token || token.length < 10) {
      console.log("❌ [DEBUG] Invalid token length:", token?.length || 0);
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
    // Use serviceSupabase here because RLS will prevent the current user from
    // seeing another user's registration. We already validated permissions above.
    const { data: existingInviterReg } = await serviceSupabase
      .from("registrations")
      .select("id")
      .eq("event_id", event.id)
      .eq("user_id", invite.inviter_id)
      .limit(1)
      .maybeSingle();

    // Capacity check (for potentially two new registrations if inviter is not registered)
    // Count current confirmed participants using service role so we get a
    // complete view (RLS could hide rows from the anon/auth client).
    const { count: currentParticipants } = await serviceSupabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("status", "confirmed");
      
    const newRegistrations = existingInviterReg ? 1 : 2; // invitee + maybe inviter
    if (currentParticipants && currentParticipants + newRegistrations > event.max_participants) {
      return NextResponse.json({ error: "No hi ha prou places per a la parella" }, { status: 400 });
    }

    // Use DB RPC to perform the accept atomically and with proper RLS bypass
    // Pass the user ID explicitly since JWT claims might not be available in server context
    console.log("🔍 [DEBUG] Calling accept_pair_invite RPC with token:", token, "and user:", user.id);
    const { data: rpcRes, error: rpcErr } = await supabase.rpc("accept_pair_invite", { 
      token_text: token,
      actor_user_id: user.id,
      actor_email: user.email
    });
    
    console.log("🔍 [DEBUG] RPC result:", { data: rpcRes, error: rpcErr });
    
    if (rpcErr) {
      console.error("❌ [DEBUG] RPC accept_pair_invite error", rpcErr);
      return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
    }

    // rpcRes is expected to be jsonb { ok: true/false, message/error, pair_id }
    console.log("🔍 [DEBUG] Raw RPC response:", JSON.stringify(rpcRes, null, 2));
    
    const ok = rpcRes?.ok ?? false;
    console.log("🔍 [DEBUG] RPC ok status:", ok);
    
    if (!ok) {
      const errMsg = rpcRes?.error || "Error acceptant la invitació";
      console.log("❌ [DEBUG] RPC returned error:", errMsg);
      
      // Map DB errors to HTTP status codes conservatively
      const statusMap: Record<string, number> = {
        missing_auth: 401,
        invite_not_found_or_not_sent: 404,
        invite_expired: 400,
        not_invitee: 403,
        invite_invalid_no_target: 400,
        email_mismatch: 403,
        event_not_found: 404,
        event_closed: 400,
        registration_deadline_passed: 400,
        invitee_already_registered: 400,
        not_enough_capacity: 400,
        internal_error: 500,
      };
      const status = statusMap[errMsg] || 400;
      console.log("🔍 [DEBUG] Mapped status code:", status, "for error:", errMsg);
      return NextResponse.json({ error: errMsg }, { status });
    }

    console.log("✅ [DEBUG] Successfully processed invite acceptance");
    return NextResponse.json({ message: "Inscripció en parella confirmada", pair_id: rpcRes.pair_id });
  } catch (err) {
    console.error("❌ [DEBUG] Error in POST /api/invites/[token]/accept", err);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}

export const POST = withRateLimit("invites_action", handler);
