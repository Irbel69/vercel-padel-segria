import { NextResponse } from "next/server";
import { createPublicClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createPublicClient();

    // Call the helper function that returns enum values
    const { data, error } = await supabase.rpc("get_shirt_size_enum");

    if (error) {
      console.error("Error fetching shirt sizes:", error);
      return NextResponse.json({ error: "Error obtenint les talles" }, { status: 500 });
    }

    // The function returns an array of enum values
    return NextResponse.json({ sizes: data || [] });
  } catch (err) {
    console.error("Unexpected error fetching shirt sizes:", err);
    return NextResponse.json({ error: "Error intern" }, { status: 500 });
  }
}
