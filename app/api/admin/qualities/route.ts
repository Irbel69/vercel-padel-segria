import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

// Helper function to check if user is admin
async function checkAdminAuth(supabase: any) {
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return { error: "No autorizado", status: 401 };
	}

	const { data: userProfile, error: profileError } = await supabase
		.from("users")
		.select("is_admin")
		.eq("id", user.id)
		.single();

	if (profileError || !userProfile?.is_admin) {
		return { error: "Accés no autoritzat", status: 403 };
	}

	return { user };
}

export async function GET(request: NextRequest) {
	try {
		const supabase = createClient();

		const authResult = await checkAdminAuth(supabase);
		if (authResult.error) {
			return NextResponse.json(
				{ error: authResult.error },
				{ status: authResult.status }
			);
		}

		// Get all qualities
		const { data: qualities, error } = await supabase
			.from("qualities")
			.select("*")
			.order("name");

		if (error) {
			console.error("Error fetching qualities:", error);
			return NextResponse.json(
				{ error: "Error carregant les qualitats" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ qualities });
	} catch (error) {
		console.error("Error in GET /api/admin/qualities:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const supabase = createClient();

		const authResult = await checkAdminAuth(supabase);
		if (authResult.error) {
			return NextResponse.json(
				{ error: authResult.error },
				{ status: authResult.status }
			);
		}

		const body = await request.json();
		const { name, icon } = body;

		if (!name || !icon) {
			return NextResponse.json(
				{ error: "El nom i l'icona són obligatoris" },
				{ status: 400 }
			);
		}

		// Check if quality name already exists
		const { data: existingQuality } = await supabase
			.from("qualities")
			.select("id")
			.eq("name", name)
			.single();

		if (existingQuality) {
			return NextResponse.json(
				{ error: "Ja existeix una qualitat amb aquest nom" },
				{ status: 409 }
			);
		}

		// Create new quality
		const { data: newQuality, error } = await supabase
			.from("qualities")
			.insert({ name, icon })
			.select()
			.single();

		if (error) {
			console.error("Error creating quality:", error);
			return NextResponse.json(
				{ error: "Error creant la qualitat" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ quality: newQuality }, { status: 201 });
	} catch (error) {
		console.error("Error in POST /api/admin/qualities:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const supabase = createClient();

		const authResult = await checkAdminAuth(supabase);
		if (authResult.error) {
			return NextResponse.json(
				{ error: authResult.error },
				{ status: authResult.status }
			);
		}

		const body = await request.json();
		const { id, name, icon } = body;

		if (!id || !name || !icon) {
			return NextResponse.json(
				{ error: "L'ID, nom i icona són obligatoris" },
				{ status: 400 }
			);
		}

		// Check if quality name already exists (excluding current quality)
		const { data: existingQuality } = await supabase
			.from("qualities")
			.select("id")
			.eq("name", name)
			.neq("id", id)
			.single();

		if (existingQuality) {
			return NextResponse.json(
				{ error: "Ja existeix una qualitat amb aquest nom" },
				{ status: 409 }
			);
		}

		// Update quality
		const { data: updatedQuality, error } = await supabase
			.from("qualities")
			.update({ name, icon })
			.eq("id", id)
			.select()
			.single();

		if (error) {
			console.error("Error updating quality:", error);
			return NextResponse.json(
				{ error: "Error actualitzant la qualitat" },
				{ status: 500 }
			);
		}

		if (!updatedQuality) {
			return NextResponse.json(
				{ error: "Qualitat no trobada" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ quality: updatedQuality });
	} catch (error) {
		console.error("Error in PUT /api/admin/qualities:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const supabase = createClient();

		const authResult = await checkAdminAuth(supabase);
		if (authResult.error) {
			return NextResponse.json(
				{ error: authResult.error },
				{ status: authResult.status }
			);
		}

		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");
		const force = searchParams.get("force") === "true";

		if (!id) {
			return NextResponse.json(
				{ error: "L'ID de la qualitat és obligatori" },
				{ status: 400 }
			);
		}

		// Check if quality is assigned to any users (only if not forcing)
		if (!force) {
			const { data: assignedUsers, error: checkError } = await supabase
				.from("user_qualities")
				.select("user_id")
				.eq("quality_id", id);

			if (checkError) {
				console.error("Error checking quality assignments:", checkError);
				return NextResponse.json(
					{ error: "Error verificant les assignacions de la qualitat" },
					{ status: 500 }
				);
			}

			// If quality is assigned to users, return warning
			if (assignedUsers && assignedUsers.length > 0) {
				return NextResponse.json({
					warning: `Aquesta qualitat està assignada a ${assignedUsers.length} usuari(s). L'eliminació desassociarà aquests usuaris.`,
					assignedUsersCount: assignedUsers.length,
				});
			}
		}

		// Delete quality (this will cascade delete user_qualities due to foreign key)
		const { error: deleteError } = await supabase
			.from("qualities")
			.delete()
			.eq("id", id);

		if (deleteError) {
			console.error("Error deleting quality:", deleteError);
			return NextResponse.json(
				{ error: "Error eliminant la qualitat" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error in DELETE /api/admin/qualities:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}
