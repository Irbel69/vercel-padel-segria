import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import type { CreateBookingPayload } from "@/types/lessons";

export async function POST(request: Request) {
	const payload = (await request.json()) as CreateBookingPayload;
	const supabase = createClient();

	const {
		data: { user },
		error: userErr,
	} = await supabase.auth.getUser();

	if (userErr || !user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { data, error } = await supabase.rpc("book_lesson", {
		p: {
			...payload,
			user_id: user.id,
		},
	} as any);

	if (error) {
		console.error("POST /api/lessons/book error", error);
		return NextResponse.json({ error: error.message }, { status: 400 });
	}

	return NextResponse.json(data && data[0] ? data[0] : data);
}
