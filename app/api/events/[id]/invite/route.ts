import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/libs/rate-limiter-middleware";
import { createClient } from "@/libs/supabase/server";
import { sendEmail } from "@/libs/resend";
import { renderPairInviteEmail } from "@/libs/email/templates/pair-invite";
import config from "@/config";
import { randomBytes } from "node:crypto";

type Body = {
  email?: string; // invitee email (optional)
  generateCodeOnly?: boolean; // if true, skip email and just return a join code
  expiresInMinutes?: number; // optional override for expiry
};

// Robust token generator using Node crypto to avoid runtime differences
function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("hex");
}

function randomShortCode(length = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid 0/O/1/I
  let out = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * alphabet.length);
    out += alphabet[idx];
  }
  return out;
}

async function handler(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  // Expect: ["api","events","{id}","invite"]
  const idSegment = segments[2];
  const eventId = parseInt(idSegment || "");
    if (Number.isNaN(eventId)) {
      return NextResponse.json({ error: "Esdeveniment no vàlid" }, { status: 400 });
    }

  const body = (await request.json()) as Body;
    const inviteeEmail = body.email?.toLowerCase().trim();
    const generateCodeOnly = body.generateCodeOnly === true || !inviteeEmail;
    const expiresIn = Math.min(Math.max(body.expiresInMinutes ?? 60 * 24, 10), 60 * 24 * 7); // 10 minutes to 7 days

    // Validate event exists and open, and capacity/deadline
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, date, max_participants, registration_deadline, status")
      .eq("id", eventId)
      .single();
    if (eventError || !event) {
      return NextResponse.json({ error: "Esdeveniment no trobat" }, { status: 404 });
    }
    if (event.status === "closed") {
      return NextResponse.json({ error: "Inscripcions tancades" }, { status: 400 });
    }
    const now = new Date();
    if (new Date(event.registration_deadline) <= now) {
      return NextResponse.json({ error: "La data límit ha passat" }, { status: 400 });
    }

    // Check inviter isn't already registered
    const { data: existingReg } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .limit(1)
      .single();
    if (existingReg) {
      return NextResponse.json({ error: "Ja estàs inscrit" }, { status: 400 });
    }

    // Check capacity
    const { count: currentParticipants } = await supabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "confirmed");
    if (currentParticipants && currentParticipants >= event.max_participants) {
      return NextResponse.json({ error: "Límit de participants assolit" }, { status: 400 });
    }

    // Opportunistic cleanup: delete expired SENT invites for this inviter & event
    try {
      const nowIso = new Date().toISOString();
      await supabase
        .from("pair_invites")
        .delete()
        .eq("inviter_id", user.id)
        .eq("event_id", eventId)
        .eq("status", "sent")
        .lt("expires_at", nowIso);
    } catch (cleanupErr) {
      console.warn("Cleanup of expired invites failed (non-fatal)", cleanupErr);
    }

    // Reuse: if there's an active code already, return it instead of generating a new one
    const { data: existingActive, error: existingActiveErr } = await supabase
      .from("pair_invites")
      .select("id, short_code, token, invitee_email, invitee_id, expires_at, status")
      .eq("inviter_id", user.id)
      .eq("event_id", eventId)
      .eq("status", "sent")
      .gt("expires_at", new Date().toISOString())
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingActiveErr) {
      console.warn("Error checking existing active invite (ignored)", existingActiveErr);
    }

    if (existingActive && existingActive.short_code) {
      // Optionally, if caller provided an email but existing invite has none, we could update it.
      // Keep it simple to avoid side-effects; just return the current active code.
      return NextResponse.json({
        message: "Ja tens un codi actiu",
        data: { short_code: existingActive.short_code },
      });
    }

    // Create invite row
    const token = randomToken(24);
    const short_code = randomShortCode(6);
    const expires_at = new Date(Date.now() + expiresIn * 60_000).toISOString();

    // Mask privacy: do not leak whether email exists; we set invitee_id if email maps to existing user (server-side lookup)
    let invitee_id: string | null = null;
    if (inviteeEmail) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .ilike("email", inviteeEmail)
        .limit(1)
        .maybeSingle();
      invitee_id = existingUser?.id ?? null;
    }

    const { data: invite, error: inviteError } = await supabase
      .from("pair_invites")
      .insert([
        {
          event_id: eventId,
          inviter_id: user.id,
          invitee_id,
          invitee_email: inviteeEmail ?? null,
          status: "sent",
          token,
          short_code,
          expires_at,
        },
      ])
      .select("id, short_code, token")
      .single();

    if (inviteError || !invite) {
      // Log detailed error server-side for debugging
      console.error("Error creating invite", {
        message: (inviteError as any)?.message,
        details: (inviteError as any)?.details,
        hint: (inviteError as any)?.hint,
        code: (inviteError as any)?.code,
      });
      return NextResponse.json({ error: "Error creant la invitació" }, { status: 500 });
    }

    // If email provided and not generateCodeOnly, send email (best-effort)
    if (inviteeEmail && !generateCodeOnly) {
      try {
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || `https://${config.domainName}`}/invite/accept?token=${invite.token}`;
  const { subject, text, html } = renderPairInviteEmail({ eventTitle: event.title, acceptUrl });
  await sendEmail({ to: inviteeEmail, subject, text, html });
      } catch (e) {
        console.warn("Failed to send invite email", e);
        // Do not leak email state; still return success with code
      }
    }

    // Return generic success without confirming email existence
    return NextResponse.json({
      message: "Invitació creada",
      data: {
        short_code: invite.short_code,
        // token is only for email links; not returned in API response
      },
    });
  } catch (err) {
    console.error("Error in POST /api/events/[id]/invite", err);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}

export const POST = withRateLimit("invites", handler);
