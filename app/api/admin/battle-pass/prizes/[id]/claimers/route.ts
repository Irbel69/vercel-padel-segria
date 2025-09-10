import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/libs/supabase/server";
import type { 
  PrizeClaimersResponse, 
  PrizeClaimer, 
  UpdateDeliveryStatusRequest, 
  UpdateDeliveryStatusResponse, 
  DeliveryStatus 
} from "@/types";

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

    // Parse query parameters for filtering
    const status = request.nextUrl.searchParams.get("status") as DeliveryStatus | null;
    const search = request.nextUrl.searchParams.get("search") || "";

    // Validate status parameter if provided
    if (status && !["pending_delivery", "delivered", "delivery_failed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status parameter" }, { status: 400 });
    }

    // Build the query
    let query = supabase
      .from("battle_pass_user_prizes")
      .select(`
        id,
        user_id, 
        claimed_at, 
        delivery_status, 
        delivered_at,
        users(id, email, name, surname, phone, shirt_size)
      `)
      .eq("prize_id", prizeId);

    // Apply status filter if provided
    if (status) {
      query = query.eq("delivery_status", status);
    }

    // Execute query
    const { data, error } = await query.order("claimed_at", { ascending: true });

    if (error) {
      console.error("Error fetching claimers for prize:", error);
      return NextResponse.json({ error: "Failed to fetch claimers" }, { status: 500 });
    }

    // Map to a friendly shape and apply search filter if needed
    let mapped: PrizeClaimer[] = (data || []).map((row: any) => ({
      id: row.id, // Include the claim ID for delivery status updates
      user_id: row.user_id,
      claimed_at: row.claimed_at,
      delivery_status: row.delivery_status,
      delivered_at: row.delivered_at,
      email: row.users?.email || null,
      name: row.users?.name || null,
      surname: row.users?.surname || null,
      phone: row.users?.phone || null,
      shirt_size: row.users?.shirt_size || null,
    }));

    // Apply search filter on mapped data
    if (search) {
      const searchLower = search.toLowerCase();
      mapped = mapped.filter((claimer) => {
        const name = `${claimer.name || ""} ${claimer.surname || ""}`.toLowerCase();
        const email = (claimer.email || "").toLowerCase();
        const phone = (claimer.phone || "").toLowerCase();
        return name.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower);
      });
    }

    const response: PrizeClaimersResponse = {
      claimers: mapped
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Use the request-scoped client to validate the current user is an admin.
    const requestClient = createClient();
    const adminCheck = await validateAdminAccess(requestClient);
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const prizeId = Number(params.id);
    if (!prizeId || Number.isNaN(prizeId)) {
      return NextResponse.json({ error: "Invalid prize id" }, { status: 400 });
    }

    // Parse request body
    let body: UpdateDeliveryStatusRequest & { claim_id?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { delivery_status, delivered_at, claim_id } = body;

    // Validate required fields
    if (!delivery_status) {
      return NextResponse.json({ error: "delivery_status is required" }, { status: 400 });
    }

    if (!claim_id) {
      return NextResponse.json({ error: "claim_id is required" }, { status: 400 });
    }

    // Validate delivery status
    if (!["pending_delivery", "delivered", "delivery_failed"].includes(delivery_status)) {
      return NextResponse.json({ error: "Invalid delivery status" }, { status: 400 });
    }

    // Use the request-scoped client for the RPC so auth.uid() inside the DB function
    // resolves to the current user. The request-scoped client uses cookies/session.
    const supabase = createClient();

    // Call the database function to update delivery status using the request client
    const { data: updatedClaim, error } = await supabase.rpc(
      "update_prize_delivery_status",
      {
        p_claim_id: claim_id,
        p_delivery_status: delivery_status,
        p_delivered_at: delivered_at || (delivery_status === "delivered" ? new Date().toISOString() : null)
      }
    );

    if (error) {
      console.error("Error updating delivery status:", error);
      
      // Handle specific error cases
      if (error.message?.includes("does not exist") || error.message?.includes("not found")) {
        return NextResponse.json({ error: "Prize claim not found" }, { status: 404 });
      }
      if (error.message?.includes("permission") || error.message?.includes("admin")) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
      
      return NextResponse.json({ error: "Failed to update delivery status" }, { status: 500 });
    }

    if (!updatedClaim || updatedClaim.length === 0) {
      return NextResponse.json({ error: "Prize claim not found" }, { status: 404 });
    }

    const result = Array.isArray(updatedClaim) ? updatedClaim[0] : updatedClaim;

    const response: UpdateDeliveryStatusResponse = {
      success: true,
      data: {
        id: result.id,
        delivery_status: result.delivery_status,
        delivered_at: result.delivered_at,
        updated_at: new Date().toISOString()
      }
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("PUT /claimers error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}