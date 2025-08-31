import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

// Helper to ensure the caller is an authenticated admin
async function ensureAdmin(supabase: any) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, status: 401, message: "No autorizado" };
  }
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.is_admin) {
    return { ok: false, status: 403, message: "Accés no autoritzat" };
  }
  return { ok: true };
}

// GET /api/lessons/admin/slots/[id]/bookings
export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  const supabase = createClient();

  // Enforce admin access
  const admin = await ensureAdmin(supabase);
  if (!admin.ok) {
    return NextResponse.json(
      { error: admin.message },
      { status: admin.status }
    );
  }
  const slotId = Number(context.params.id);
  if (!slotId || Number.isNaN(slotId)) {
    return NextResponse.json({ error: "Invalid slot id" }, { status: 400 });
  }

  // Fetch bookings for this slot with user info and participants
  const { data, error } = await supabase
    .from("lesson_bookings")
    .select(
      `
        id,
        user_id,
        group_size,
        status,
        created_at,
		payment_type,
        users!inner ( id, name, email, phone ),
		lesson_booking_participants!left ( id, name, is_primary ),
		direct_debit_details!left ( iban, holder_name, holder_address, holder_dni, is_authorized )
      `
    )
    .eq("slot_id", slotId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("GET admin slot bookings error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bookings = (data || []).map((b: any) => ({
    id: b.id,
    user: b.users,
    group_size: b.group_size,
    status: b.status,
    created_at: b.created_at,
    payment_type: b.payment_type,
    participants: (b.lesson_booking_participants || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      is_primary: p.is_primary,
    })),
    direct_debit:
      b.payment_type === "direct_debit" && b.direct_debit_details
        ? {
            iban: b.direct_debit_details.iban || null,
            holder_name: b.direct_debit_details.holder_name || null,
            holder_address: b.direct_debit_details.holder_address || null,
            holder_dni: b.direct_debit_details.holder_dni || null,
            is_authorized: !!b.direct_debit_details.is_authorized,
          }
        : null,
  }));

  // Aggregate participants count for convenience
  const participants_count = bookings.reduce(
    (sum, b) => sum + (b.group_size || 0),
    0
  );

  return NextResponse.json({ bookings, participants_count });
}
