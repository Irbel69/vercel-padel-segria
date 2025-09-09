import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET(request: NextRequest) {
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

		// Get user's current points
		const { data: userProfile, error: profileError } = await supabase
			.from("users")
			.select("score")
			.eq("id", user.id)
			.single();

		if (profileError) {
			console.error("Error fetching user profile:", profileError);
			return NextResponse.json(
				{ error: "Failed to fetch user profile" },
				{ status: 500 }
			);
		}

		const userPoints = userProfile?.score || 0;

		// Get all available battle pass prizes (active) ordered by points required
		// Prefer view if present, fallback to base table
		let prizes: any[] | null = null;
		let prizesError: any = null;
		const { data: prizesFromView, error: viewErr } = await supabase
			.from("available_battle_pass_prizes")
			.select("*")
			.order("points_required", { ascending: true });
		if (!viewErr && prizesFromView) {
			prizes = prizesFromView as any[];
		} else {
			const { data: prizesFromTable, error: tableErr } = await supabase
				.from("battle_pass_prizes")
				.select("*")
				.eq("is_active", true)
				.order("points_required", { ascending: true });
			prizes = prizesFromTable as any[];
			prizesError = tableErr;
		}

		if (prizesError) {
			console.error("Error fetching battle pass prizes:", prizesError);
			return NextResponse.json(
				{ error: "Failed to fetch battle pass prizes" },
				{ status: 500 }
			);
		}

		// Fetch claimed prize ids for this user
		const { data: claimedRows, error: claimedErr } = await supabase
			.from("battle_pass_user_prizes")
			.select("prize_id")
			.eq("user_id", user.id);

		if (claimedErr) {
			console.error("Error fetching claimed prizes:", claimedErr);
		}

		const claimedSet = new Set((claimedRows || []).map((r: any) => r.prize_id));

		// Calculate progress for each prize, including claimed status
		const prizesWithProgress = (prizes || []).map((prize: any) => ({
			id: prize.id,
			title: prize.title,
			description: prize.description,
			points_required: prize.points_required,
			image_url: prize.image_url,
			display_order: prize.display_order ?? 0,
			can_claim: userPoints >= prize.points_required,
			progress_percentage: Math.min(
				100,
				Math.round((userPoints / prize.points_required) * 100)
			),
			is_claimed: claimedSet.has(prize.id),
		}));

		const completedCount = prizesWithProgress.filter(p => p.is_claimed).length;
		return NextResponse.json({
			user_points: userPoints,
			prizes: prizesWithProgress,
			total_prizes: prizesWithProgress.length,
			completed_prizes: completedCount,
		});
	} catch (error) {
		console.error("Battle Pass progress API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}