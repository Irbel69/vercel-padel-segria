import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

// Create enrollment request with participants, choices and optional direct debit details
export async function POST(req: Request) {
	const supabase = createClient();
	try {
		const access = await supabase.auth.getUser();
		const user = access.data.user;
		if (!user)
			return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

		const body = await req.json();
		const {
			season_id,
			group_size,
			allow_fill,
			payment_method,
			observations,
			participants = [],
			choices = [],
			direct_debit,
		} = body;
		if (!season_id || !group_size || !choices.length)
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);

		if (group_size < 1 || group_size > 4)
			return NextResponse.json(
				{ error: "Invalid group size" },
				{ status: 400 }
			);

		// Insert request
		const { data: request, error: reqErr } = await supabase
			.from("season_enrollment_requests")
			.insert({
				season_id,
				user_id: user.id,
				group_size,
				allow_fill: !!allow_fill,
				payment_method,
				observations,
			})
			.select("*")
			.single();
		if (reqErr) throw reqErr;

		// Participants
		if (participants.length) {
			const partRows = participants.map((p: any, i: number) => ({
				request_id: request.id,
				name: p.name || `Participant ${i + 1}`,
				is_primary: !!p.is_primary,
			}));
			const { error: partErr } = await supabase
				.from("season_request_participants")
				.insert(partRows);
			if (partErr) throw partErr;
		}

		// Choices
		const choiceRows = choices.map((entry_id: number) => ({
			request_id: request.id,
			entry_id,
		}));
		const { error: choiceErr } = await supabase
			.from("season_request_choices")
			.insert(choiceRows);
		if (choiceErr) throw choiceErr;

		// Direct debit
		if (payment_method === "direct_debit" && direct_debit) {
			const { error: ddErr } = await supabase
				.from("season_direct_debit_details")
				.insert({
					request_id: request.id,
					iban: direct_debit.iban,
					holder_name: direct_debit.holder_name,
					holder_address: direct_debit.holder_address,
					holder_dni: direct_debit.holder_dni,
				});
			if (ddErr) throw ddErr;
		}

		return NextResponse.json({ request });
	} catch (e: any) {
		console.error(e);
		return NextResponse.json(
			{ error: e.message || "Server error" },
			{ status: 500 }
		);
	}
}
