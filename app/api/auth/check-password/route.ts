import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "missing email" }, { status: 400 });

    const serviceSupabase = createServiceClient();

    // Query the auth.users table (requires service role) to inspect password_hash
    const { data, error } = await serviceSupabase
      .from("auth.users")
      .select("id, email, password_hash, raw_user_meta_data")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Error querying auth.users:", error);
      return NextResponse.json({ error: "query_error" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ exists: false, has_password: false });
    }

    const hasPassword = !!data.password_hash;

    return NextResponse.json({ exists: true, has_password: hasPassword });
  } catch (err) {
    console.error("Error in check-password route:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
