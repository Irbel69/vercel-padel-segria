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
		console.log("[SEASONS ENROLL] body:", JSON.stringify(body));
		const {
			season_id,
			group_size,
			allow_fill,
			payment_method,
			observations,
			participants = [], // additional participants only: { name, dni, phone }
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

		// Participants (additional only - primary user is the authenticated user)
		if (participants.length) {
			console.log(
				"[SEASONS ENROLL] participants payload:",
				JSON.stringify(participants)
			);
			// expected participants length should be group_size - 1
			if (group_size - 1 !== participants.length) {
				return NextResponse.json(
					{
						error:
							"Participants count mismatch (expected group_size - 1 additional participants)",
					},
					{ status: 400 }
				);
			}

			const partRows = participants.map((p: any, i: number) => ({
				request_id: request.id,
				name: p.name || `Participant ${i + 2}`,
				dni: p.dni || null,
				phone: p.phone || null,
			}));
			console.log(
				"[SEASONS ENROLL] partRows to insert:",
				JSON.stringify(partRows)
			);
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

		// Fetch stored participants to return for verification
		const { data: storedParts } = await supabase
			.from("season_request_participants")
			.select("id, request_id, name, dni, phone")
			.eq("request_id", request.id);

		return NextResponse.json({ request, participants: storedParts || [] });
	} catch (e: any) {
		console.error(e);
		return NextResponse.json(
			{ error: e.message || "Server error" },
			{ status: 500 }
		);
	}
}
