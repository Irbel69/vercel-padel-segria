import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

// GET: Return enrollment requests + assignments + weekly entries for a season (admin only)
export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	const supabase = createClient();
	try {
		const seasonId = Number(params.id);
		if (!seasonId) {
			return NextResponse.json({ error: "Invalid season id" }, { status: 400 });
		}

		const { data: auth } = await supabase.auth.getUser();
		const user = auth.user;
		if (!user)
			return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

		// Check admin
		const { data: me, error: meErr } = await supabase
			.from("users")
			.select("id,is_admin")
			.eq("id", user.id)
			.maybeSingle();
		if (meErr) throw meErr;
		if (!me?.is_admin) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Requests (pending or approved and not fully assigned yet)
		const { data: requests, error: reqErr } = await supabase
			.from("season_enrollment_requests")
			.select(
				`id, season_id, user_id, group_size, allow_fill, payment_method, observations, status, created_at,
		 user:users(id,name,surname,email,phone),
		 participants:season_request_participants(id,name,dni,phone),
		 choices:season_request_choices(entry_id),
		 direct_debit:season_direct_debit_details(iban,holder_name,holder_address,holder_dni)`
			)
			.eq("season_id", seasonId)
			.in("status", ["pending", "approved"])
			.order("created_at", { ascending: true });
		if (reqErr) throw reqErr;

		// Assignments (active only)
		const { data: assignments, error: asgErr } = await supabase
			.from("season_assignments")
			.select(
				`id, season_id, entry_id, request_id, user_id, group_size, allow_fill, payment_method, status, assigned_at, created_at,
         user:users(id,name,surname,email,phone),
         entry:season_week_entries(id, day_of_week, start_time, end_time, location, capacity)`
			)
			.eq("season_id", seasonId)
			.eq("status", "active")
			.order("created_at", { ascending: true });
		if (asgErr) throw asgErr;

		// Weekly entries (classes) for capacity / selection UI
		// Use the view with remaining capacity if available, fallback to raw table
		const { data: entryLoad } = await supabase
			.from("season_entry_load")
			.select("*")
			.eq("season_id", seasonId)
			.order("day_of_week")
			.order("start_time");
		// Fallback to base table if view not present / returns null
		let entries = entryLoad;
		if (!entries || !entries.length) {
			const { data: baseEntries } = await supabase
				.from("season_week_entries")
				.select(
					"id,season_id,day_of_week,kind,start_time,end_time,capacity,location"
				)
				.eq("season_id", seasonId)
				.order("day_of_week")
				.order("start_time");
			entries = baseEntries || [];
		}

		return NextResponse.json({
			requests: requests || [],
			assignments: assignments || [],
			entries: entries || [],
		});
	} catch (e: any) {
		console.error("[ASSIGNMENTS GET]", e);
		return NextResponse.json(
			{ error: e.message || "Server error" },
			{ status: 500 }
		);
	}
}

interface PostBody {
	request_id: number;
	entry_id: number;
	edit?: boolean;
	override_choice?: boolean;
}

// POST: create new assignment from request -> entry (admin only)
export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	const supabase = createClient();
	try {
		const seasonId = Number(params.id);
		if (!seasonId)
			return NextResponse.json({ error: "Invalid season id" }, { status: 400 });
		const { data: auth } = await supabase.auth.getUser();
		const user = auth.user;
		if (!user)
			return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

		const { data: me, error: meErr } = await supabase
			.from("users")
			.select("id,is_admin")
			.eq("id", user.id)
			.maybeSingle();
		if (meErr) throw meErr;
		if (!me?.is_admin)
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });

		const body: PostBody = await req.json();
		if (!body.request_id || !body.entry_id)
			return NextResponse.json({ error: "Missing fields" }, { status: 400 });

		// Load request
		const { data: requestRow, error: rErr } = await supabase
			.from("season_enrollment_requests")
			.select("*, user:users(id)")
			.eq("id", body.request_id)
			.eq("season_id", seasonId)
			.maybeSingle();
		if (rErr) throw rErr;
		if (!requestRow)
			return NextResponse.json({ error: "Request not found" }, { status: 404 });

		// Load entry
		const { data: entryRow, error: eErr } = await supabase
			.from("season_week_entries")
			.select(
				"id,season_id,day_of_week,start_time,end_time,capacity,location,kind"
			)
			.eq("id", body.entry_id)
			.eq("season_id", seasonId)
			.maybeSingle();
		if (eErr) throw eErr;
		if (!entryRow)
			return NextResponse.json({ error: "Entry not found" }, { status: 404 });
		if (entryRow.kind !== "class") {
			return NextResponse.json(
				{ error: "Entry is not a class" },
				{ status: 400 }
			);
		}

		// Validate/prepare request choices vs selected entry
		const { data: reqChoices, error: chErr } = await supabase
			.from("season_request_choices")
			.select("entry_id")
			.eq("request_id", body.request_id);
		if (chErr) throw chErr;
		const choiceIds = (reqChoices || []).map((c: any) => c.entry_id);

		// If the request specified choices and the selected entry is not among them,
		// require explicit override from the client (`override_choice` true) to proceed.
		if (
			choiceIds.length > 0 &&
			!choiceIds.includes(entryRow.id) &&
			!body.override_choice
		) {
			return NextResponse.json(
				{
					error: `La entrada ${entryRow.id} no figura entre las elecciones del request ${body.request_id}`,
				},
				{ status: 400 }
			);
		}

		// If override requested and the choice is missing, insert it so DB trigger allows the assignment
		if (
			choiceIds.length > 0 &&
			!choiceIds.includes(entryRow.id) &&
			body.override_choice
		) {
			const { error: insChoiceErr } = await supabase
				.from("season_request_choices")
				.insert({ request_id: body.request_id, entry_id: entryRow.id });
			if (insChoiceErr) throw insChoiceErr;
		}

		// Check for existing active assignment for this request
		const { data: existingForRequest } = await supabase
			.from("season_assignments")
			.select("id, entry_id")
			.eq("request_id", body.request_id)
			.eq("status", "active")
			.maybeSingle();

		// When editing, update the existing assignment instead of failing
		if (existingForRequest && body.edit) {
			// If entry is unchanged, return current assignment (no-op)
			if (existingForRequest.entry_id === entryRow.id) {
				const { data: current, error: curErr } = await supabase
					.from("season_assignments")
					.select(
						`id, season_id, entry_id, request_id, user_id, group_size, allow_fill, payment_method, status, assigned_at, created_at,
		 user:users(id,name,surname,email,phone),
		 entry:season_week_entries(id, day_of_week, start_time, end_time, location, capacity)`
					)
					.eq("id", existingForRequest.id)
					.single();
				if (curErr) throw curErr;
				return NextResponse.json({ assignment: current });
			}

			// Capacity check for the new target entry
			if (entryRow.capacity != null) {
				const { data: existingAssignments, error: capErr } = await supabase
					.from("season_assignments")
					.select("group_size")
					.eq("entry_id", entryRow.id)
					.eq("status", "active");
				if (capErr) throw capErr;
				const used = (existingAssignments || []).reduce(
					(s, a) => s + (a.group_size || 0),
					0
				);
				if (used + requestRow.group_size > entryRow.capacity) {
					return NextResponse.json(
						{ error: "Capacity exceeded" },
						{ status: 409 }
					);
				}
			}

			// Perform the update (move assignment to another entry)
			const { data: updated, error: updErr } = await supabase
				.from("season_assignments")
				.update({
					entry_id: entryRow.id,
					group_size: requestRow.group_size,
					allow_fill: requestRow.allow_fill,
					payment_method: requestRow.payment_method,
				})
				.eq("id", existingForRequest.id)
				.select(
					`id, season_id, entry_id, request_id, user_id, group_size, allow_fill, payment_method, status, assigned_at, created_at,
		 user:users(id,name,surname,email,phone),
		 entry:season_week_entries(id, day_of_week, start_time, end_time, location, capacity)`
				)
				.single();
			if (updErr) throw updErr;
			return NextResponse.json({ assignment: updated });
		}

		// If not editing, prevent duplicate assignment for request
		if (existingForRequest && !body.edit) {
			return NextResponse.json(
				{ error: "Request already assigned" },
				{ status: 409 }
			);
		}

		// Capacity check
		if (entryRow.capacity != null) {
			const { data: existingAssignments, error: capErr } = await supabase
				.from("season_assignments")
				.select("group_size")
				.eq("entry_id", entryRow.id)
				.eq("status", "active");
			if (capErr) throw capErr;
			const used = (existingAssignments || []).reduce(
				(s, a) => s + (a.group_size || 0),
				0
			);
			if (used + requestRow.group_size > entryRow.capacity) {
				return NextResponse.json(
					{ error: "Capacity exceeded" },
					{ status: 409 }
				);
			}
		}

		// Insert assignment
		const payload = {
			season_id: seasonId,
			entry_id: entryRow.id,
			request_id: requestRow.id,
			user_id: requestRow.user_id,
			group_size: requestRow.group_size,
			allow_fill: requestRow.allow_fill,
			payment_method: requestRow.payment_method,
			status: "active" as const,
		};

		const { data: newAssignment, error: insErr } = await supabase
			.from("season_assignments")
			.insert(payload)
			.select(
				`id, season_id, entry_id, request_id, user_id, group_size, allow_fill, payment_method, status, assigned_at, created_at,
         user:users(id,name,surname,email,phone),
         entry:season_week_entries(id, day_of_week, start_time, end_time, location, capacity)`
			)
			.single();
		if (insErr) throw insErr;

		// Update request status => approved (if still pending)
		if (requestRow.status === "pending") {
			await supabase
				.from("season_enrollment_requests")
				.update({ status: "approved" })
				.eq("id", requestRow.id);
		}

		return NextResponse.json({ assignment: newAssignment });
	} catch (e: any) {
		console.error("[ASSIGNMENTS POST]", e);
		return NextResponse.json(
			{ error: e.message || "Server error" },
			{ status: 500 }
		);
	}
}
