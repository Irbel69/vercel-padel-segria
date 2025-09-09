import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/libs/supabase/server";
import type { } from "@/types";

// Helper function to validate admin access (duplicate of admin handler - consider centralizing)
async function validateAdminAccess(supabase: any) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "No autoritzat", status: 401 };
  }

  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !userProfile?.is_admin) {
    return { error: "Accés denegat. Només administradors.", status: 403 };
  }

  return { user };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Allow a dev-only public fetch using service role when explicitly requested
    const allowPublic = process.env.ALLOW_PUBLIC_ADMIN_CLAIMERS === "true" && request.nextUrl.searchParams.get("public") === "1";

    // Use the request-scoped client to validate the current user is an admin.
    const requestClient = createClient();
    const adminCheck = await validateAdminAccess(requestClient);
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    // For the actual data fetch, prefer the service-role client which bypasses RLS
    // This keeps permission-checking on the user, but avoids RLS hiding rows
    // from the admin when reading joined tables.
    const supabase = allowPublic ? createServiceClient() : createServiceClient();

    const prizeId = Number(params.id);
    if (!prizeId || Number.isNaN(prizeId)) {
      return NextResponse.json({ error: "Invalid prize id" }, { status: 400 });
    }

    // Join battle_pass_user_prizes with users
    const { data, error } = await supabase
      .from("battle_pass_user_prizes")
      .select("user_id, claimed_at, users(id, email, name, surname)")
      .eq("prize_id", prizeId)
      .order("claimed_at", { ascending: true });

    if (error) {
      console.error("Error fetching claimers for prize:", error);
      return NextResponse.json({ error: "Failed to fetch claimers" }, { status: 500 });
    }

    // Map to a friendly shape
    const mapped = (data || []).map((row: any) => ({
      user_id: row.user_id,
      claimed_at: row.claimed_at,
      email: row.users?.email || null,
      name: row.users?.name || null,
      surname: row.users?.surname || null,
    }));

    return NextResponse.json({ claimers: mapped });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
