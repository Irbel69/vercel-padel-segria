import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET() {
	const supabase = createClient();
	const { data, error } = await supabase
		.from("lesson_slot_batches")
		.select("*")
		.order("created_at", { ascending: false });
	if (error)
		return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ batches: data ?? [] });
}
