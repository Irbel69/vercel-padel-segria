import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function POST(request: NextRequest) {
	try {
		const supabase = createClient();

		// Get authenticated user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const { prize_id } = await request.json();

		if (!prize_id) {
			return NextResponse.json(
				{ error: "Prize ID is required" },
				{ status: 400 }
			);
		}

		// Call secure RPC; RLS checks ensure: user owns row, prize active, enough points
		const { data: claimedRow, error: claimErr } = await supabase
			.rpc("claim_battle_pass_prize", { p_prize_id: prize_id });

		if (claimErr) {
			// Map common errors to friendly messages
			const message =
				claimErr.message?.includes("violates row-level security policy")
					? "No pots reclamar aquest premi encara"
					: claimErr.message || "No s'ha pogut reclamar el premi";
			return NextResponse.json({ error: message }, { status: 400 });
		}

		// Fetch prize details for response (from view or base table)
		let prize: any = null;
		const { data: fromView } = await supabase
			.from("available_battle_pass_prizes")
			.select("*")
			.eq("id", prize_id)
			.maybeSingle();
		if (fromView) {
			prize = fromView;
		} else {
			const { data: fromTable } = await supabase
				.from("battle_pass_prizes")
				.select("*")
				.eq("id", prize_id)
				.maybeSingle();
			prize = fromTable;
		}

		return NextResponse.json({
			success: true,
			message: `Successfully claimed "${prize?.title ?? "Premi"}"!`,
			prize: prize
				? {
						id: prize.id,
						title: prize.title,
						description: prize.description,
						points_required: prize.points_required,
						image_url: prize.image_url,
				  }
				: { id: prize_id, title: "Premi", description: null, points_required: 0, image_url: null },
			claimed: claimedRow,
		});
	} catch (error) {
		console.error("Battle Pass claim API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}