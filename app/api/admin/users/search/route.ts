import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { withRateLimit } from "@/libs/rate-limiter-middleware";
import { z } from "zod";

// Validación de entrada con Zod
const searchSchema = z.object({
	search: z
		.string()
		.max(100, "Terme de cerca massa llarg") // Límite de 100 caracteres
		.regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]*$/, "Només es permeten lletres i espais") // Solo letras y espacios
		.optional()
		.default(""),
});

async function handleSearch(request: NextRequest) {
	try {
		const supabase = createClient();

		// Check if user is authenticated and is admin
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
		}

		const { data: userProfile } = await supabase
			.from("users")
			.select("is_admin")
			.eq("id", user.id)
			.single();

		if (!userProfile?.is_admin) {
			return NextResponse.json({ error: "Accés denegat" }, { status: 403 });
		}

		const url = new URL(request.url);
		const rawSearch = url.searchParams.get("search") || "";

		// Validar y sanitizar entrada
		const validationResult = searchSchema.safeParse({ search: rawSearch });
		
		if (!validationResult.success) {
			console.warn(`Invalid search input from user ${user.id}: ${rawSearch}`);
			return NextResponse.json(
				{ 
					error: "Paràmetres de cerca invàlids",
					details: validationResult.error.errors[0]?.message 
				}, 
				{ status: 400 }
			);
		}

		const { search } = validationResult.data;

		// Log búsquedas para monitoreo de seguridad
		if (search.length > 50) {
			console.warn(`Long search query from admin ${user.id}: ${search.substring(0, 50)}...`);
		}

		// Build query con parámetros seguros
		let query = supabase
			.from("users")
			.select("id, name, surname, avatar_url, score")
			.order("name", { ascending: true })
			.limit(50); // Límite de resultados para evitar sobrecarga

		// Add search filter if provided - Supabase maneja la sanitización SQL
		if (search.trim()) {
			query = query.or(`name.ilike.%${search}%,surname.ilike.%${search}%`);
		}

		const { data: users, error } = await query;

		if (error) {
			console.error("Error fetching users:", error);
			return NextResponse.json(
				{ error: "Error carregant els usuaris" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			users: users || [],
			totalFound: users?.length || 0,
		});
	} catch (error) {
		console.error("Error in GET /api/admin/users/search:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

// Aplicar rate limiting específico para búsquedas de admin
export const GET = withRateLimit('admin', handleSearch);
