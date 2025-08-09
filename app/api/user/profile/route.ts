import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	try {
		const supabase = createClient();

		// Get the current user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "No autorizado" }, { status: 401 });
		}

		// Get user profile
		const { data: userProfile, error: profileError } = await supabase
			.from("users")
			.select("*")
			.eq("id", user.id)
			.single();

		if (profileError) {
			console.error("Error fetching user profile:", profileError);
			if (profileError.code === "PGRST116") {
				// User profile not found
				return NextResponse.json(
					{ error: "Perfil no encontrado" },
					{ status: 404 }
				);
			}
			return NextResponse.json(
				{ error: "Error obteniendo el perfil" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ profile: userProfile });
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

export async function PUT(req: NextRequest) {
	try {
		const supabase = createClient();

		// Get the current user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "No autorizado" }, { status: 401 });
		}

		// Parse request body
		const body = await req.json();

		// Update user profile
		const { data: updatedProfile, error: updateError } = await supabase
			.from("users")
			.update(body)
			.eq("id", user.id)
			.select()
			.single();

		if (updateError) {
			console.error("Error updating user profile:", updateError);
			return NextResponse.json(
				{ error: "Error actualizando el perfil" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ profile: updatedProfile });
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}