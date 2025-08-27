import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

// GET /api/lessons/slots?from=ISO&to=ISO
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const from = searchParams.get("from");
	const to = searchParams.get("to");

	const supabase = createClient();

	let query = supabase
		.from("lesson_slots")
		.select("id,start_at,end_at,max_capacity,location,status,joinable")
		.order("start_at", { ascending: true });

	if (from) query = query.gte("start_at", from);
	if (to) query = query.lte("end_at", to);

	const { data, error } = await query;
	if (error) {
		console.error("GET /api/lessons/slots error", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ slots: data ?? [] });
}
