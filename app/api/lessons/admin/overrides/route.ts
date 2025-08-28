import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET() {
	const supabase = createClient();
	const { data, error } = await supabase
		.from("lesson_availability_overrides")
		.select("*")
		.order("date", { ascending: true });
	if (error)
		return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ overrides: data ?? [] });
}

export async function POST(request: Request) {
	const supabase = createClient();
	const body = await request.json();
	// Whitelist allowed fields to avoid inserting client-only properties
	const allowed = [
		"date",
		"time_start",
		"time_end",
		"kind",
		"reason",
		"location",
	];
	const insertPayload: any = {};
	for (const k of allowed) {
		if (Object.prototype.hasOwnProperty.call(body, k))
			insertPayload[k] = (body as any)[k];
	}
	const { data, error } = await supabase
		.from("lesson_availability_overrides")
		.insert(insertPayload)
		.select("*")
		.single();
	if (error)
		return NextResponse.json({ error: error.message }, { status: 400 });
	return NextResponse.json({ override: data });
}
