import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { createServiceClient as createAdminClient } from "@/libs/supabase/service";

// Helper to ensure the caller is an authenticated admin
async function ensureAdmin(supabase: any) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, status: 401, message: "No autoritzat" } as const;
  }
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.is_admin) {
    return { ok: false, status: 403, message: "Accés no autoritzat" } as const;
  }
  return { ok: true } as const;
}

export const dynamic = "force-dynamic";

// DELETE /api/lessons/admin/bookings/[id]
// Cancels any booking (admin only), and recomputes slot locking/status.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const adminSupabase = createAdminClient();

  // Enforce admin access
  const admin = await ensureAdmin(supabase);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.message }, { status: admin.status });
  }

  const bookingId = parseInt(params.id, 10);
  if (!Number.isFinite(bookingId)) {
    return NextResponse.json({ error: "ID no vàlid" }, { status: 400 });
  }

  // Fetch the booking to get slot info
  const { data: booking, error: fetchErr } = await supabase
    .from("lesson_bookings")
    .select("id, slot_id, status, allow_fill")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) {
    return NextResponse.json({ error: "Reserva no trobada" }, { status: 404 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ message: "Ja estava cancel·lada" });
  }

  // 1) Mark booking as cancelled
  const { error: cancelErr } = await adminSupabase
    .from("lesson_bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (cancelErr) {
    console.error("[ADMIN DELETE] cancel error", cancelErr);
    return NextResponse.json({ error: cancelErr.message }, { status: 500 });
  }

  // 2) Recompute slot lock based on remaining bookings for the slot
  const { data: locker, error: lockErr } = await supabase
    .from("lesson_bookings")
    .select("id")
    .eq("slot_id", booking.slot_id)
    .neq("status", "cancelled")
    .eq("allow_fill", false)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (lockErr) {
    console.warn("[ADMIN DELETE] Could not recompute slot lock", lockErr);
  } else {
    const newLockedId = locker?.id ?? null;
    const { error: updErr } = await adminSupabase
      .from("lesson_slots")
      .update({ locked_by_booking_id: newLockedId })
      .eq("id", booking.slot_id);
    if (updErr) {
      console.warn("[ADMIN DELETE] Could not update slot lock", updErr);
    }
  }

  // 3) Recompute slot status (open/full) based on confirmed bookings only
  try {
    const { data: slot, error: slotErr } = await adminSupabase
      .from("lesson_slots")
      .select("id, max_capacity, status")
      .eq("id", booking.slot_id)
      .single();
    if (!slot || slotErr) {
      console.warn("[ADMIN DELETE] Could not fetch slot to recompute status", slotErr);
    } else if (slot.status === "open" || slot.status === "full") {
      const { data: confirmedBookings, error: sumErr } = await supabase
        .from("lesson_bookings")
        .select("group_size")
        .eq("slot_id", slot.id)
        .eq("status", "confirmed");
      if (sumErr) {
        console.warn("[ADMIN DELETE] Could not list confirmed bookings", sumErr);
      } else {
        const confirmedCount = (confirmedBookings || []).reduce(
          (sum: number, b: any) => sum + (b.group_size || 0),
          0
        );
        const newStatus = confirmedCount >= (slot.max_capacity || 0) ? "full" : "open";
        if (newStatus !== slot.status) {
          const { error: updStatusErr } = await adminSupabase
            .from("lesson_slots")
            .update({ status: newStatus })
            .eq("id", slot.id);
          if (updStatusErr) {
            console.warn("[ADMIN DELETE] Could not update slot status", updStatusErr);
          }
        }
      }
    }
  } catch (e) {
    console.warn("[ADMIN DELETE] Unexpected error recomputing slot status", e);
  }

  return NextResponse.json({ message: "Reserva cancel·lada" });
}
