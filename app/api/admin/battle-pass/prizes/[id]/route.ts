import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { withRateLimit } from "@/libs/rate-limiter-middleware";
import type { BattlePassPrize, UpdateBattlePassPrizeData } from "@/types";

export const dynamic = "force-dynamic";

// Helper function to validate admin access
async function validateAdminAccess(supabase: any) {
	// Verificar autenticación
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return { error: "No autoritzat", status: 401 };
	}

	// Verificar si es administrador
	const { data: userProfile, error: profileError } = await supabase
		.from("users")
		.select("is_admin")
		.eq("id", user.id)
		.single();

	if (profileError || !userProfile?.is_admin) {
		return { error: "Accés denegat. Només administradors.", status: 403 };
	}

	return { user };
}

// Helper function to validate prize ID
function validatePrizeId(id: string): { valid: boolean; error?: string; numericId?: number } {
	// Validate that ID is a positive integer
	const numericId = parseInt(id);
	if (isNaN(numericId) || numericId <= 0 || !Number.isInteger(numericId)) {
		return { valid: false, error: "ID del premi no vàlid" };
	}
	return { valid: true, numericId };
}

// PUT /api/admin/battle-pass/prizes/[id] - Actualizar premio específico (solo administradores)
async function putHandler(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const supabase = createClient();
		const prizeId = params.id;

		// Validar acceso de administrador
		const adminCheck = await validateAdminAccess(supabase);
		if (adminCheck.error) {
			return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
		}

		// Validar ID del premio
		const idValidation = validatePrizeId(prizeId);
		if (!idValidation.valid) {
			return NextResponse.json(
				{ error: idValidation.error },
				{ status: 400 }
			);
		}

		// Verificar que el premio existe
		const { data: existingPrize, error: fetchError } = await supabase
			.from("battle_pass_prizes")
			.select("*")
			.eq("id", idValidation.numericId)
			.single();

		if (fetchError) {
			if (fetchError.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Premi del battle pass no trobat" },
					{ status: 404 }
				);
			}
			console.error("Error fetching battle pass prize:", fetchError);
			return NextResponse.json(
				{ error: "Error obtenint la informació del premi" },
				{ status: 500 }
			);
		}

		// Parsear datos de actualización
		const updates: UpdateBattlePassPrizeData = await req.json();

		// Validar y sanear datos de entrada
		const allowedFields = [
			"title",
			"description",
			"points_required",
			"image_url",
			"original_image_url",
			"is_active",
			"display_order",
		];

		const filteredUpdates: any = {};

		for (const [key, value] of Object.entries(updates)) {
			if (allowedFields.includes(key)) {
				// Validar cada campo
				switch (key) {
					case "title":
						if (value !== undefined) {
							if (typeof value !== "string" || value.trim().length === 0) {
								return NextResponse.json(
									{ error: "El títol ha de ser un text vàlid i no pot estar buit" },
									{ status: 400 }
								);
							}
							filteredUpdates[key] = value.trim();
						}
						break;

					case "description":
						if (value !== undefined) {
							if (value !== null && typeof value !== "string") {
								return NextResponse.json(
									{ error: "La descripció ha de ser un text vàlid o null" },
									{ status: 400 }
								);
							}
							filteredUpdates[key] = value === null ? null : value.trim();
						}
						break;

					case "points_required":
						if (value !== undefined) {
							if (typeof value !== "number" || value < 0 || !Number.isInteger(value)) {
								return NextResponse.json(
									{ error: "Els punts requerits han de ser un número enter positiu o zero" },
									{ status: 400 }
								);
							}
							filteredUpdates[key] = value;
						}
						break;

					case "image_url":
						if (value !== undefined) {
							if (value !== null && typeof value !== "string") {
								return NextResponse.json(
									{ error: "La URL de la imatge ha de ser un text vàlid o null" },
									{ status: 400 }
								);
							}
							filteredUpdates[key] = value === null ? null : value.trim();
						}
						break;

					case "original_image_url":
						if (value !== undefined) {
							if (value !== null && typeof value !== "string") {
								return NextResponse.json(
									{ error: "La URL de la imatge original ha de ser un text vàlid o null" },
									{ status: 400 }
								);
							}
							filteredUpdates[key] = value === null ? null : value.trim();
						}
						break;

					case "is_active":
						if (value !== undefined) {
							if (typeof value !== "boolean") {
								return NextResponse.json(
									{ error: "L'estat actiu ha de ser un valor booleà" },
									{ status: 400 }
								);
							}
							filteredUpdates[key] = value;
						}
						break;

					case "display_order":
						if (value !== undefined) {
							if (typeof value !== "number" || value < 0 || !Number.isInteger(value)) {
								return NextResponse.json(
									{ error: "L'ordre de visualització ha de ser un número enter positiu o zero" },
									{ status: 400 }
								);
							}
							filteredUpdates[key] = value;
						}
						break;
				}
			}
		}

		// Verificar que se proporcionó al menos un campo válido para actualizar
		if (Object.keys(filteredUpdates).length === 0) {
			return NextResponse.json(
				{ error: "No s'han proporcionat dades vàlides per actualitzar" },
				{ status: 400 }
			);
		}

		// Añadir timestamp de actualización
		filteredUpdates.updated_at = new Date().toISOString();

		// Actualizar premio en la base de datos
		const { data: updatedPrize, error: updateError } = await supabase
			.from("battle_pass_prizes")
			.update(filteredUpdates)
			.eq("id", idValidation.numericId)
			.select()
			.single();

		if (updateError) {
			console.error("Error updating battle pass prize:", updateError);
			
			// Handle unique constraint violation for display_order
			if (updateError.code === "23505" && updateError.message.includes("uq_battle_pass_prizes_active_display_order")) {
				return NextResponse.json(
					{ error: "Ja existeix un premi actiu amb aquest ordre de visualització" },
					{ status: 409 }
				);
			}

			return NextResponse.json(
				{ error: "Error actualitzant el premi del battle pass" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			message: "Premi del battle pass actualitzat correctament",
			data: updatedPrize,
		});
	} catch (error) {
		console.error("Error in PUT /api/admin/battle-pass/prizes/[id]:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

// DELETE /api/admin/battle-pass/prizes/[id] - Eliminar premio específico (solo administradores)
async function deleteHandler(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const supabase = createClient();
		const prizeId = params.id;

		// Validar acceso de administrador
		const adminCheck = await validateAdminAccess(supabase);
		if (adminCheck.error) {
			return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
		}

		// Validar ID del premio
		const idValidation = validatePrizeId(prizeId);
		if (!idValidation.valid) {
			return NextResponse.json(
				{ error: idValidation.error },
				{ status: 400 }
			);
		}

		// Verificar que el premio existe antes de eliminarlo
		const { data: existingPrize, error: fetchError } = await supabase
			.from("battle_pass_prizes")
			.select("title")
			.eq("id", idValidation.numericId)
			.single();

		if (fetchError) {
			if (fetchError.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Premi del battle pass no trobat" },
					{ status: 404 }
				);
			}
			console.error("Error fetching battle pass prize for deletion:", fetchError);
			return NextResponse.json(
				{ error: "Error verificant l'existència del premi" },
				{ status: 500 }
			);
		}

		// Eliminar el premio
		const { error: deleteError } = await supabase
			.from("battle_pass_prizes")
			.delete()
			.eq("id", idValidation.numericId);

		if (deleteError) {
			console.error("Error deleting battle pass prize:", deleteError);
			return NextResponse.json(
				{ error: "Error eliminant el premi del battle pass" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			message: `Premi "${existingPrize.title}" eliminat correctament`,
		});
	} catch (error) {
		console.error("Error in DELETE /api/admin/battle-pass/prizes/[id]:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

// GET /api/admin/battle-pass/prizes/[id] - Obtener premio específico (solo administradores)
async function getHandler(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const supabase = createClient();
		const prizeId = params.id;

		// Validar acceso de administrador
		const adminCheck = await validateAdminAccess(supabase);
		if (adminCheck.error) {
			return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
		}

		// Validar ID del premio
		const idValidation = validatePrizeId(prizeId);
		if (!idValidation.valid) {
			return NextResponse.json(
				{ error: idValidation.error },
				{ status: 400 }
			);
		}

		// Obtener el premio
		const { data: prize, error: fetchError } = await supabase
			.from("battle_pass_prizes")
			.select("*")
			.eq("id", idValidation.numericId)
			.single();

		if (fetchError) {
			if (fetchError.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Premi del battle pass no trobat" },
					{ status: 404 }
				);
			}
			console.error("Error fetching battle pass prize:", fetchError);
			return NextResponse.json(
				{ error: "Error obtenint la informació del premi" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ data: prize });
	} catch (error) {
		console.error("Error in GET /api/admin/battle-pass/prizes/[id]:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

// Export handlers directly (rate limiting is handled at middleware level)
export { getHandler as GET, putHandler as PUT, deleteHandler as DELETE };