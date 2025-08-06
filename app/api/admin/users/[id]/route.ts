import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

// GET - Obtener información detallada de un usuario específico
export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const supabase = createClient();
		const userId = params.id;

		// Get the current user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "No autorizado" }, { status: 401 });
		}

		// Check if user is admin
		const { data: userProfile, error: profileError } = await supabase
			.from("users")
			.select("is_admin")
			.eq("id", user.id)
			.single();

		if (profileError || !userProfile?.is_admin) {
			return NextResponse.json(
				{
					error:
						"Accés denegat. Només els administradors poden accedir a aquesta informació.",
				},
				{ status: 403 }
			);
		}

		// Validate UUID format
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(userId)) {
			return NextResponse.json(
				{ error: "Format d'identificador d'usuari no vàlid" },
				{ status: 400 }
			);
		}

		// Get user details with their qualities
		const { data: userData, error: userError } = await supabase
			.from("users")
			.select(
				`
				id,
				email,
				name,
				surname,
				phone,
				avatar_url,
				is_admin,
				score,
				matches_played,
				skill_level,
				trend,
				observations,
				image_rights_accepted,
				privacy_policy_accepted,
				created_at,
				updated_at,
				user_qualities (
					quality_id,
					assigned_at,
					qualities (
						id,
						name
					)
				)
			`
			)
			.eq("id", userId)
			.single();

		if (userError) {
			if (userError.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Usuari no trobat" },
					{ status: 404 }
				);
			}
			console.error("Error fetching user:", userError);
			return NextResponse.json(
				{ error: "Error obtenint la informació de l'usuari" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ user: userData });
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

// PUT - Actualizar información de un usuario específico
export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const supabase = createClient();
		const userId = params.id;

		// Get the current user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "No autorizado" }, { status: 401 });
		}

		// Check if user is admin
		const { data: userProfile, error: profileError } = await supabase
			.from("users")
			.select("is_admin")
			.eq("id", user.id)
			.single();

		if (profileError || !userProfile?.is_admin) {
			return NextResponse.json(
				{
					error:
						"Accés denegat. Només els administradors poden modificar aquesta informació.",
				},
				{ status: 403 }
			);
		}

		// Validate UUID format
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(userId)) {
			return NextResponse.json(
				{ error: "Format d'identificador d'usuari no vàlid" },
				{ status: 400 }
			);
		}

		// Parse request body
		const updates = await req.json();

		// Validate and sanitize input
		const allowedFields = [
			"name",
			"surname",
			"phone",
			"is_admin",
			"score",
			"matches_played",
			"skill_level",
			"trend",
			"observations",
			"image_rights_accepted",
			"privacy_policy_accepted",
		];

		const filteredUpdates: any = {};
		for (const [key, value] of Object.entries(updates)) {
			if (allowedFields.includes(key)) {
				filteredUpdates[key] = value;
			}
		}

		// Add updated timestamp
		filteredUpdates.updated_at = new Date().toISOString();

		// Validate required fields and types
		if (filteredUpdates.name && typeof filteredUpdates.name !== "string") {
			return NextResponse.json(
				{ error: "El nom ha de ser un text vàlid" },
				{ status: 400 }
			);
		}

		if (
			filteredUpdates.surname &&
			typeof filteredUpdates.surname !== "string"
		) {
			return NextResponse.json(
				{ error: "El cognom ha de ser un text vàlid" },
				{ status: 400 }
			);
		}

		if (filteredUpdates.score && typeof filteredUpdates.score !== "number") {
			return NextResponse.json(
				{ error: "La puntuació ha de ser un número vàlid" },
				{ status: 400 }
			);
		}

		if (
			filteredUpdates.matches_played &&
			typeof filteredUpdates.matches_played !== "number"
		) {
			return NextResponse.json(
				{ error: "Els partits jugats han de ser un número vàlid" },
				{ status: 400 }
			);
		}

		if (
			filteredUpdates.skill_level &&
			(typeof filteredUpdates.skill_level !== "number" ||
				filteredUpdates.skill_level < 0 ||
				filteredUpdates.skill_level > 10)
		) {
			return NextResponse.json(
				{ error: "El nivell d'habilitat ha de ser un número entre 0 i 10" },
				{ status: 400 }
			);
		}

		if (
			filteredUpdates.trend &&
			!["up", "down", "same"].includes(filteredUpdates.trend)
		) {
			return NextResponse.json(
				{ error: "La tendència ha de ser 'up', 'down' o 'same'" },
				{ status: 400 }
			);
		}

		// Update user in database
		const { data: updatedUser, error: updateError } = await supabase
			.from("users")
			.update(filteredUpdates)
			.eq("id", userId)
			.select()
			.single();

		if (updateError) {
			console.error("Error updating user:", updateError);
			return NextResponse.json(
				{ error: "Error actualitzant la informació de l'usuari" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			user: updatedUser,
			message: "Informació de l'usuari actualitzada correctament",
		});
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}
