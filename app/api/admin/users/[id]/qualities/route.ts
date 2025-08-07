import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

// PUT - Actualizar las cualidades de un usuario
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
		const { qualityIds } = await req.json();

		// Validate input - must be an array of exactly 3 quality IDs (some can be null)
		if (!Array.isArray(qualityIds) || qualityIds.length !== 3) {
			return NextResponse.json(
				{ error: "S'han de proporcionar exactament 3 qualitats" },
				{ status: 400 }
			);
		}

		// Filter out null values and validate quality IDs
		const validQualityIds = qualityIds.filter((id) => id !== null);
		for (const qualityId of validQualityIds) {
			if (!Number.isInteger(qualityId) || qualityId <= 0) {
				return NextResponse.json(
					{ error: "IDs de qualitat no vàlids" },
					{ status: 400 }
				);
			}
		}

		// Verify that all provided quality IDs exist
		if (validQualityIds.length > 0) {
			const { data: existingQualities, error: qualitiesError } = await supabase
				.from("qualities")
				.select("id")
				.in("id", validQualityIds);

			if (
				qualitiesError ||
				existingQualities.length !== validQualityIds.length
			) {
				return NextResponse.json(
					{ error: "Alguna de les qualitats especificades no existeix" },
					{ status: 400 }
				);
			}
		}

		// Check if target user exists
		const { data: targetUser, error: userError } = await supabase
			.from("users")
			.select("id")
			.eq("id", userId)
			.single();

		if (userError || !targetUser) {
			return NextResponse.json({ error: "Usuari no trobat" }, { status: 404 });
		}

		// Start transaction by first deleting existing qualities
		const { error: deleteError } = await supabase
			.from("user_qualities")
			.delete()
			.eq("user_id", userId);

		if (deleteError) {
			console.error("Error deleting existing qualities:", deleteError);
			return NextResponse.json(
				{ error: "Error eliminant les qualitats existents" },
				{ status: 500 }
			);
		}

		// Insert new qualities (only non-null ones)
		if (validQualityIds.length > 0) {
			const insertData = validQualityIds.map((qualityId) => ({
				user_id: userId,
				quality_id: qualityId,
				assigned_at: new Date().toISOString(),
			}));

			const { error: insertError } = await supabase
				.from("user_qualities")
				.insert(insertData);

			if (insertError) {
				console.error("Error inserting new qualities:", insertError);
				return NextResponse.json(
					{ error: "Error assignant les noves qualitats" },
					{ status: 500 }
				);
			}
		}

		// Fetch and return updated user data with qualities
		const { data: updatedUserData, error: fetchError } = await supabase
			.from("users")
			.select(
				`
				id,
				email,
				name,
				surname,
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

		if (fetchError) {
			console.error("Error fetching updated user:", fetchError);
			return NextResponse.json(
				{ error: "Error obtenint la informació actualitzada" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			user: updatedUserData,
			message: "Qualitats actualitzades correctament",
		});
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}
