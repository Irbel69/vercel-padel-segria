import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const from = searchParams.get("from");
	const to = searchParams.get("to");

	const supabase = createClient();
	let query = supabase.from("lesson_slots").select("*").order("start_at");
	if (from) query = query.gte("start_at", from);
	if (to) query = query.lte("end_at", to);
	const { data, error } = await query;
	if (error)
		return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ slots: data ?? [] });
}

export async function POST(request: Request) {
	const supabase = createClient();
	const body = await request.json();
	const { data, error } = await supabase
		.from("lesson_slots")
		.insert(body)
		.select("*")
		.single();
	if (error)
		return NextResponse.json({ error: error.message }, { status: 400 });
	return NextResponse.json({ slot: data });
}
