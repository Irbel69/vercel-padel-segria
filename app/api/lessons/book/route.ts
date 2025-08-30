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

	// Fetch profile from DB to derive primary name server-side, ignoring client-sent primary_name
	const { data: profileData, error: profileErr } = await supabase
		.from("users")
		.select("name, surname")
		.eq("id", user.id)
		.single();

	if (profileErr || !profileData) {
		console.error("Could not fetch user profile for booking", profileErr);
		return NextResponse.json(
			{ error: "User profile not found" },
			{ status: 400 }
		);
	}

	const serverDerivedPrimary = `${profileData.name ?? ""} ${
		profileData.surname ?? ""
	}`.trim();

	const { data, error } = await supabase.rpc("book_lesson", {
		p: {
			...payload,
			user_id: user.id,
			// Ensure primary_name is set server-side
			primary_name: serverDerivedPrimary || undefined,
		},
	} as any);

	if (error) {
		console.error("POST /api/lessons/book error", error);
		return NextResponse.json({ error: error.message }, { status: 400 });
	}

	return NextResponse.json(data && data[0] ? data[0] : data);
}
