import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import type { CreateBookingPayload } from "@/types/lessons";

// Minimal IBAN normalization and checksum validation
function normalizeIban(value: string) {
	return (value || "").replace(/\s+/g, "").toUpperCase();
}
function isValidIban(value: string) {
	const iban = normalizeIban(value);
	if (!iban) return false;
	if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
	const rearranged = iban.slice(4) + iban.slice(0, 4);
	let remainder = 0;
	for (let i = 0; i < rearranged.length; i++) {
		const ch = rearranged[i];
		const code =
			ch >= "A" && ch <= "Z" ? (ch.charCodeAt(0) - 55).toString() : ch;
		for (let j = 0; j < code.length; j++) {
			remainder = (remainder * 10 + (code.charCodeAt(j) - 48)) % 97;
		}
	}
	return remainder === 1;
}

export async function POST(request: Request) {
	const payload = (await request.json()) as CreateBookingPayload;
	const supabase = createClient();

	const {
		data: { user },
		error: userErr,
	} = await supabase.auth.getUser();

	if (userErr || !user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Server-side guard: require authorization when using direct debit
	if (payload.payment_type === "direct_debit") {
		const dd = payload.direct_debit;
		if (!dd || dd.is_authorized !== true) {
			return NextResponse.json(
				{ error: "Cal acceptar l'autorització de domiciliació bancària" },
				{ status: 400 }
			);
		}
		if (
			!dd.iban?.trim() ||
			!dd.holder_name?.trim() ||
			!dd.holder_address?.trim() ||
			!dd.holder_dni?.trim()
		) {
			return NextResponse.json(
				{
					error:
						"Cal completar IBAN, Nom del titular, Adreça i DNI per al rebut bancari",
				},
				{ status: 400 }
			);
		}
		if (!isValidIban(dd.iban)) {
			return NextResponse.json({ error: "IBAN no vàlid" }, { status: 400 });
		}
		// Normalize IBAN before proceeding
		payload.direct_debit!.iban = normalizeIban(dd.iban);
	}

	// Fetch profile from DB to derive primary name server-side, ignoring client-sent primary_name
	const { data: profileData, error: profileErr } = await supabase
		.from("users")
		.select("name, surname")
		.eq("id", user.id)
		.single();

	if (profileErr || !profileData) {
		console.error("Could not fetch user profile for booking", profileErr);
		return NextResponse.json(
			{ error: "User profile not found" },
			{ status: 400 }
		);
	}

	const serverDerivedPrimary = `${profileData.name ?? ""} ${
		profileData.surname ?? ""
	}`.trim();

	const { data, error } = await supabase.rpc("book_lesson", {
		p: {
			...payload,
			user_id: user.id,
			// Ensure primary_name is set server-side
			primary_name: serverDerivedPrimary || undefined,
		},
	} as any);

	if (error) {
		console.error("POST /api/lessons/book error", error);
		return NextResponse.json({ error: error.message }, { status: 400 });
	}

	return NextResponse.json(data && data[0] ? data[0] : data);
}
