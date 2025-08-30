import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

		const {
			name,
			surname,
			phone,
			observations,
			imageRightsAccepted,
			privacyPolicyAccepted,
		} = await req.json();

		// Validate input
		if (!name || !surname) {
			return NextResponse.json(
				{ error: "El nom i cognoms són obligatoris" },
				{ status: 400 }
			);
		}

		// Validate phone format: accept any international phone by normalizing
		// spaces and checking a general E.164-like pattern (+ and 6-15 digits).
		if (phone) {
			const phoneStr = String(phone).trim();
			// Remove common separators (spaces, dashes, parentheses)
			const normalized = phoneStr.replace(/[\s\-()\.]/g, "");
			const e164General = /^\+\d{6,15}$/;
			if (!e164General.test(normalized)) {
				return NextResponse.json(
					{
						error: "El format del telèfon no és vàlid. Prova amb un format internacional, per exemple: +34123456789",
					},
					{ status: 400 }
				);
			}
		}

		// Only the privacy policy acceptance is required server-side.
		if (!privacyPolicyAccepted) {
			return NextResponse.json(
				{
					error: "Has d'acceptar les polítiques d'ús i privacitat",
				},
				{ status: 400 }
			);
		}

		// Check if user already exists in users table
		const { data: existingUser, error: existingUserError } = await supabase
			.from("users")
			.select("id, name, surname")
			.eq("id", user.id)
			.single();

		if (existingUserError && existingUserError.code !== "PGRST116") {
			console.error("Error checking existing user:", existingUserError);
			return NextResponse.json(
				{ error: "Error verificant l'usuari existent" },
				{ status: 500 }
			);
		}

		if (existingUser) {
			// User already has profile, update it
			const { error: updateError } = await supabase
				.from("users")
				.update({
					name: name.trim(),
					surname: surname.trim(),
					phone: phone?.trim() || null,
					observations: observations?.trim() || null,
					image_rights_accepted: imageRightsAccepted,
					privacy_policy_accepted: privacyPolicyAccepted,
					updated_at: new Date().toISOString(),
				})
				.eq("id", user.id);

			if (updateError) {
				console.error("Error updating user profile:", updateError);
				return NextResponse.json(
					{ error: "Error actualitzant el perfil" },
					{ status: 500 }
				);
			}
		} else {
			// Create new user profile
			const { error: insertError } = await supabase.from("users").insert({
				id: user.id,
				email: user.email!,
				name: name.trim(),
				surname: surname.trim(),
				phone: phone?.trim() || null,
				observations: observations?.trim() || null,
				image_rights_accepted: imageRightsAccepted,
				privacy_policy_accepted: privacyPolicyAccepted,
			});

			if (insertError) {
				console.error("Error creating user profile:", insertError);
				// If the error is duplicate key, it means the user was created in the meantime
				if (insertError.code === "23505") {
					// Try to update instead
					const { error: fallbackUpdateError } = await supabase
						.from("users")
						.update({
							name: name.trim(),
							surname: surname.trim(),
							phone: phone?.trim() || null,
							observations: observations?.trim() || null,
							image_rights_accepted: imageRightsAccepted,
							privacy_policy_accepted: privacyPolicyAccepted,
							updated_at: new Date().toISOString(),
						})
						.eq("id", user.id);

					if (fallbackUpdateError) {
						console.error("Error in fallback update:", fallbackUpdateError);
						return NextResponse.json(
							{ error: "Error actualitzant el perfil" },
							{ status: 500 }
						);
					}
				} else {
					return NextResponse.json(
						{ error: "Error creant el perfil" },
						{ status: 500 }
					);
				}
			}
		}

		return NextResponse.json(
			{ message: "Perfil completat correctament" },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json(
			{ error: "Error intern del servidor" },
			{ status: 500 }
		);
	}
}
