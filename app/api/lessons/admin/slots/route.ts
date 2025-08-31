import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

// Helper: ensure caller is admin
async function ensureAdmin(supabase: any) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return { ok: false, status: 401, message: "No autorizado" };
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.is_admin)
    return { ok: false, status: 403, message: "Accés no autoritzat" };
  return { ok: true };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = createClient();

  // Admin gate
  const admin = await ensureAdmin(supabase);
  if (!admin.ok) {
    return NextResponse.json(
      { error: admin.message },
      { status: admin.status }
    );
  }

  // Get slots with booking count
  let query = supabase
    .from("lesson_slots")
    .select(
      `
			*,
			lesson_bookings!left (
				id,
				status,
				group_size,
				allow_fill
			)
		`
    )
    .order("start_at");

  const toIso = (() => {
    if (!to) return undefined;
    if (to.length <= 10) {
      return new Date(to + "T23:59:59.999Z").toISOString();
    }
    const d = new Date(to);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  })();
  const fromIso = (() => {
    if (!from) return undefined;
    if (from.length <= 10) {
      return new Date(from + "T00:00:00Z").toISOString();
    }
    const d = new Date(from);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  })();

  if (fromIso) query = query.gte("start_at", fromIso);
  if (toIso) query = query.lte("end_at", toIso);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Process the data to include booking counts
  const processedSlots = (data || []).map((slot: any) => {
    const activeBookings =
      slot.lesson_bookings?.filter(
        (booking: any) => booking.status !== "cancelled"
      ) || [];

    const totalBooked = activeBookings.reduce(
      (sum: number, booking: any) => sum + (booking.group_size || 0),
      0
    );

    const anyLocker = activeBookings.some((b: any) => b.allow_fill === false);

    return {
      ...slot,
      booking_count: activeBookings.length,
      participants_count: totalBooked,
      joinable: !anyLocker,
      lesson_bookings: undefined, // Remove the raw bookings data
      // convenience: duration in minutes
      duration_minutes:
        slot.start_at && slot.end_at
          ? Math.round(
              (new Date(slot.end_at).getTime() -
                new Date(slot.start_at).getTime()) /
                60000
            )
          : undefined,
    };
  });

  return NextResponse.json({ slots: processedSlots });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const body = await request.json();
  // Whitelist allowed fields to avoid inserting client-only properties
  const allowed = [
    "start_at",
    "end_at",
    "max_capacity",
    "location",
    "status",
    "locked_by_booking_id",
  ];
  const insertPayload: any = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, k))
      insertPayload[k] = (body as any)[k];
  }
  const { data, error } = await supabase
    .from("lesson_slots")
    .insert(insertPayload)
    .select("*")
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ slot: data });
}
