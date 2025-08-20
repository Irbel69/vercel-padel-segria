import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/libs/rate-limiter-middleware";
import { createClient } from "@/libs/supabase/server";

async function handler(request: NextRequest) {
  const supabase = createClient();

  try {
    // Require auth to reduce token enumeration. We can relax later if needed.
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    // Expect: ["api","invites","{token}","preview"]
    const token = segments[2];

    if (!token || token.length < 10) {
      // Use generic message to avoid enumeration
      return NextResponse.json({ error: "Token no vàlid" }, { status: 400 });
    }

    // Look up invite and join inviter profile
  const { data: invite, error: inviteError } = await supabase
      .from("pair_invites")
      .select(
        `id, status, expires_at, inviter:inviter_id ( id, name, surname, avatar_url )`
      )
      .eq("token", token)
      .maybeSingle();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "No trobat" }, { status: 404 });
    }

    // Validate status and expiry without exposing details
    const now = new Date();
    if (invite.expires_at && new Date(invite.expires_at) < now) {
      return NextResponse.json({ error: "No disponible" }, { status: 400 });
    }
    if (invite.status !== "sent") {
      return NextResponse.json({ error: "No disponible" }, { status: 400 });
    }

    const inviter = (invite as any)?.inviter as
      | { id?: string; name?: string | null; surname?: string | null; avatar_url?: string | null }
      | null
      | undefined;
    const fullName = [inviter?.name, inviter?.surname].filter(Boolean).join(" ") || null;

    return NextResponse.json({
      inviter: {
  id: inviter?.id || null,
        name: fullName,
  avatar_url: inviter?.avatar_url || null,
      },
    });
  } catch (err) {
    console.error("Error in GET /api/invites/[token]/preview", err);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}

export const GET = withRateLimit("invites_preview", handler);
