import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET() {
	const supabase = createClient();
	const { data, error } = await supabase
		.from("lesson_availability_rules")
		.select("*")
		.order("created_at", { ascending: false });
	if (error)
		return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ rules: data ?? [] });
}

export async function POST(request: Request) {
	const supabase = createClient();
	const body = await request.json();
	const { data, error } = await supabase
		.from("lesson_availability_rules")
		.insert(body)
		.select("*")
		.single();
	if (error)
		return NextResponse.json({ error: error.message }, { status: 400 });
	return NextResponse.json({ rule: data });
}
