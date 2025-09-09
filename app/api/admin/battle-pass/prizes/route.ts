import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { withRateLimit } from "@/libs/rate-limiter-middleware";
import type { 
	BattlePassPrize, 
	CreateBattlePassPrizeData, 
	BattlePassPrizesListResponse 
} from "@/types";

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

// GET /api/admin/battle-pass/prizes - Lista todos los premios del battle pass (solo administradores)
async function getHandler(request: NextRequest) {
	try {
		const supabase = createClient();

		// Validar acceso de administrador
		const adminCheck = await validateAdminAccess(supabase);
		if (adminCheck.error) {
			return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
		}

		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get("page") || "1");
		const limit = parseInt(url.searchParams.get("limit") || "10");
		const search = url.searchParams.get("search") || "";
		const activeOnly = url.searchParams.get("active") === "true";

		// Validar parámetros de paginación
		if (page < 1 || limit < 1 || limit > 100) {
			return NextResponse.json(
				{ error: "Paràmetres de paginació no vàlids" },
				{ status: 400 }
			);
		}

		const offset = (page - 1) * limit;

		// Construir query base
		let query = supabase.from("battle_pass_prizes").select("*", { count: "exact" });

		// Añadir filtro de búsqueda si existe
		if (search) {
			query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
		}

		// Filtrar solo premios activos si se solicita
		if (activeOnly) {
			query = query.eq("is_active", true);
		}

		// Aplicar paginación y ordenamiento
		query = query.order("display_order", { ascending: true }).order("points_required", { ascending: true });

		// We can't directly request a joined count via the supabase-js client easily while keeping pagination count,
		// so fetch the page of prizes first, then fetch counts for those prize ids.
		query = query.range(offset, offset + limit - 1);

		const { data: prizes, error, count } = await query;

		if (error) {
			console.error("Error fetching battle pass prizes:", error);
			return NextResponse.json(
				{ error: "Error carregant els premis del battle pass" },
				{ status: 500 }
			);
		}

		const totalPrizes = count || 0;
		const totalPages = Math.ceil(totalPrizes / limit);
		const hasMore = page < totalPages;

		// If we have prizes, fetch claimed counts per prize for the current page
		let prizesWithCounts = prizes || [];
		if ((prizesWithCounts || []).length > 0) {
			const prizeIds = (prizesWithCounts || []).map((p: any) => p.id);
			const { data: counts, error: countsErr } = await supabase
				.from("battle_pass_user_prizes")
				.select("prize_id, count:count(*)", { head: false });

			// Prefer an aggregated query using RPC for clarity
			const { data: aggr, error: aggrErr } = await supabase.rpc(
				"get_claim_counts_for_prizes",
				{ p_prize_ids: prizeIds }
			);

			if (aggr && Array.isArray(aggr)) {
				const map = new Map<number, number>();
				aggr.forEach((r: any) => map.set(Number(r.prize_id), Number(r.claimed_count)));
				prizesWithCounts = (prizesWithCounts || []).map((p: any) => ({
					...p,
					claimed_count: map.get(p.id) || 0,
				}));
			} else {
				// Fallback: zero counts
				prizesWithCounts = (prizesWithCounts || []).map((p: any) => ({ ...p, claimed_count: 0 }));
			}
		}

		const response: BattlePassPrizesListResponse = {
			prizes: prizesWithCounts,
			pagination: {
				currentPage: page,
				totalPages,
				totalPrizes,
				hasMore,
				limit,
			},
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("Error in GET /api/admin/battle-pass/prizes:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

// POST /api/admin/battle-pass/prizes - Crear nuevo premio del battle pass (solo administradores)
async function postHandler(request: NextRequest) {
	try {
		const supabase = createClient();

		// Validar acceso de administrador
		const adminCheck = await validateAdminAccess(supabase);
		if (adminCheck.error) {
			return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
		}

		const body: CreateBattlePassPrizeData = await request.json();

		// Validar datos requeridos
		if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
			return NextResponse.json(
				{ error: "El títol és obligatori i ha de ser un text vàlid" },
				{ status: 400 }
			);
		}

		if (typeof body.points_required !== "number" || body.points_required < 0) {
			return NextResponse.json(
				{ error: "Els punts requerits han de ser un número positiu o zero" },
				{ status: 400 }
			);
		}

		// Validar campos opcionales
		if (body.description !== undefined && (typeof body.description !== "string" && body.description !== null)) {
			return NextResponse.json(
				{ error: "La descripció ha de ser un text vàlid" },
				{ status: 400 }
			);
		}

		if (body.image_url !== undefined && (typeof body.image_url !== "string" && body.image_url !== null)) {
			return NextResponse.json(
				{ error: "La URL de la imatge ha de ser un text vàlid" },
				{ status: 400 }
			);
		}

		// Validate optional original_image_url
		if ((body as any).original_image_url !== undefined && (typeof (body as any).original_image_url !== "string" && (body as any).original_image_url !== null)) {
			return NextResponse.json(
				{ error: "La URL de la imatge original ha de ser un text vàlid" },
				{ status: 400 }
			);
		}

		if (body.is_active !== undefined && typeof body.is_active !== "boolean") {
			return NextResponse.json(
				{ error: "L'estat actiu ha de ser un valor booleà" },
				{ status: 400 }
			);
		}

		if (body.display_order !== undefined && (typeof body.display_order !== "number" || body.display_order < 0)) {
			return NextResponse.json(
				{ error: "L'ordre de visualització ha de ser un número positiu o zero" },
				{ status: 400 }
			);
		}

		// Si no se especifica display_order, obtener el siguiente disponible
		let displayOrder = body.display_order;
		if (displayOrder === undefined) {
			const { data: maxOrderData, error: maxOrderError } = await supabase
				.from("battle_pass_prizes")
				.select("display_order")
				.order("display_order", { ascending: false })
				.limit(1)
				.single();

			if (maxOrderError && maxOrderError.code !== "PGRST116") {
				console.error("Error getting max display order:", maxOrderError);
				return NextResponse.json(
					{ error: "Error determinant l'ordre de visualització" },
					{ status: 500 }
				);
			}

			displayOrder = (maxOrderData?.display_order || 0) + 1;
		}

		// Preparar datos para insertar
		const insertData: any = {
			title: body.title.trim(),
			description: body.description?.trim() || null,
			points_required: body.points_required,
			image_url: body.image_url?.trim() || null,
			is_active: body.is_active !== undefined ? body.is_active : true,
			display_order: displayOrder,
			created_by: adminCheck.user.id,
		};
		if ((body as any).original_image_url) insertData.original_image_url = (body as any).original_image_url.trim();

		// Crear el premio
		const { data: newPrize, error: insertError } = await supabase
			.from("battle_pass_prizes")
			.insert([insertData])
			.select()
			.single();

		if (insertError) {
			console.error("Error creating battle pass prize:", insertError);
			
			// Handle unique constraint violation for display_order
			if (insertError.code === "23505" && insertError.message.includes("uq_battle_pass_prizes_active_display_order")) {
				return NextResponse.json(
					{ error: "Ja existeix un premi actiu amb aquest ordre de visualització" },
					{ status: 409 }
				);
			}

			return NextResponse.json(
				{ error: "Error creant el premi del battle pass" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			message: "Premi del battle pass creat amb èxit",
			data: newPrize,
		});
	} catch (error) {
		console.error("Error in POST /api/admin/battle-pass/prizes:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}

// Apply rate limiting and export handlers
export const GET = withRateLimit("admin", getHandler);
export const POST = withRateLimit("admin", postHandler);