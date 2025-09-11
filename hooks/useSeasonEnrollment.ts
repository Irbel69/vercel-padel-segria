"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { useUser } from "@/hooks/use-user";
import type { Season, Entry } from "@/components/seasons/types";

interface RequestPayload {
	season_id: number;
	group_size: number;
	allow_fill: boolean;
	payment_method: string;
	observations?: string;
	participants: { name: string; dni?: string; phone?: string }[]; // only additional (excluding auth user)
	choices: number[];
	direct_debit?: {
		iban: string;
		holder_name: string;
		holder_address: string;
		holder_dni: string;
	};
}

export interface AdditionalParticipant {
	name: string;
	dni: string;
	phone: string;
}

export function useSeasonEnrollment() {
	const supabase = createClient();
	const { profile } = useUser();
	const [loading, setLoading] = useState(true);
	const [season, setSeason] = useState<Season | null>(null);
	const [entries, setEntries] = useState<Entry[]>([]);
	const [requesting, setRequesting] = useState(false);
	const [hasRequest, setHasRequest] = useState(false);
	const [selectedEntries, setSelectedEntries] = useState<Set<number>>(
		new Set()
	);
	const [groupSize, setGroupSize] = useState(1);
	const [allowFill, setAllowFill] = useState(true); // default marked
	const [paymentMethod, setPaymentMethod] = useState("cash");
	const [observations, setObservations] = useState("");
	const [participants, setParticipants] = useState<AdditionalParticipant[]>([]); // additional only (group_size - 1)
	const [currentStep, setCurrentStep] = useState<1 | 2>(1);
	const [directDebit, setDirectDebit] = useState({
		iban: "",
		holder_name: "",
		holder_address: "",
		holder_dni: "",
	});
	const [message, setMessage] = useState<string | null>(null);
	const [assignment, setAssignment] = useState<any | null>(null);
	const [assignedEntry, setAssignedEntry] = useState<Entry | null>(null);
	const [classmates, setClassmates] = useState<
		{
			id?: number;
			name?: string | null;
			surname?: string | null;
			avatar_url?: string | null;
		}[]
	>([]);
	const [classmatesUnavailable, setClassmatesUnavailable] = useState(false);

	useEffect(() => {
		load();
	}, [profile]);

	async function load() {
		if (!profile) return;
		setLoading(true);
		// open season
		const { data: seasonRows } = await supabase
			.from("open_enrollment_season")
			.select("*")
			.limit(1)
			.maybeSingle();
		if (seasonRows) {
			setSeason(seasonRows as Season);
		}
		if (seasonRows) {
			const { data: entryData } = await supabase
				.from("season_entry_load")
				.select("*")
				.eq("season_id", seasonRows.id)
				.order("day_of_week")
				.order("start_time");
			setEntries(entryData || []);
			// existing request
			const { data: req } = await supabase
				.from("season_enrollment_requests")
				.select("*")
				.eq("season_id", seasonRows.id)
				.in("status", ["pending", "approved"])
				.maybeSingle();
			setHasRequest(!!req);
			if (req) {
				const { data: asg } = await supabase
					.from("season_assignments")
					.select("*")
					.eq("season_id", seasonRows.id)
					.eq("user_id", req.user_id)
					.eq("status", "active")
					.maybeSingle();
				if (asg) setAssignment(asg);
				// fetch assigned entry details and classmates
				if (asg && asg.entry_id) {
					const { data: entryRow } = await supabase
						.from("season_entry_load")
						.select("*")
						.eq("id", asg.entry_id)
						.maybeSingle();
					if (entryRow) setAssignedEntry(entryRow as Entry);
					// try to fetch classmates - select limited profile fields
					const { data: mates, error } = await supabase
						.from("season_assignments")
						.select("user(id, name, surname, avatar_url)")
						.eq("season_id", seasonRows.id)
						.eq("entry_id", asg.entry_id)
						.eq("status", "active");
					if (!error && Array.isArray(mates)) {
						setClassmates((mates as any[]).map((r) => r.user).filter(Boolean));
						setClassmatesUnavailable(false);
					} else {
						setClassmatesUnavailable(true);
					}
				}
			} else {
				const { data: asg2 } = await supabase
					.from("season_assignments")
					.select("*")
					.eq("season_id", seasonRows.id)
					.eq("user_id", profile?.id)
					.eq("status", "active")
					.maybeSingle();
				if (asg2) setAssignment(asg2);
				if (asg2 && asg2.entry_id) {
					const { data: entryRow } = await supabase
						.from("season_entry_load")
						.select("*")
						.eq("id", asg2.entry_id)
						.maybeSingle();
					if (entryRow) setAssignedEntry(entryRow as Entry);
					const { data: mates, error } = await supabase
						.from("season_assignments")
						.select("user(id, name, surname, avatar_url)")
						.eq("season_id", seasonRows.id)
						.eq("entry_id", asg2.entry_id)
						.eq("status", "active");
					if (!error && Array.isArray(mates)) {
						setClassmates((mates as any[]).map((r) => r.user).filter(Boolean));
						setClassmatesUnavailable(false);
					} else {
						setClassmatesUnavailable(true);
					}
				}
			}
		}
		setLoading(false);
	}

	function toggleEntry(id: number) {
		setSelectedEntries((prev) => {
			const n = new Set(prev);
			if (n.has(id)) n.delete(id);
			else n.add(id);
			return n;
		});
	}

	function formatPhoneInput(raw: string) {
		const digits = raw.replace(/\D/g, "");
		let num = digits;
		if (num.startsWith("34")) num = num.slice(2);
		if (num.startsWith("0")) num = num.slice(1);
		num = num.slice(0, 9);
		const parts: string[] = [];
		if (num.length > 0) parts.push(num.slice(0, 3));
		if (num.length > 3) parts.push(num.slice(3, 6));
		if (num.length > 6) parts.push(num.slice(6, 9));
		return parts.join(" ");
	}

	function normalizePhone(raw: string) {
		if (!raw) return undefined;
		const digits = raw.replace(/\D/g, "");
		let num = digits;
		if (num.startsWith("34")) num = num.slice(2);
		if (num.startsWith("0")) num = num.slice(1);
		return "+34" + num.slice(0, 9);
	}

	function updateParticipant(
		i: number,
		field: "name" | "dni" | "phone",
		val: string
	) {
		if (field === "phone") {
			val = formatPhoneInput(val);
		}
		setParticipants((p: AdditionalParticipant[]) => {
			const arr = [...p];
			arr[i] = { ...arr[i], [field]: val };
			return arr;
		});
	}

	useEffect(() => {
		const needed = Math.max(0, groupSize - 1); // exclude auth user
		if (needed > participants.length) {
			setParticipants((p: AdditionalParticipant[]) => [
				...p,
				...Array(needed - p.length)
					.fill(0)
					.map(() => ({ name: "", dni: "", phone: "" })),
			]);
		} else if (needed < participants.length) {
			setParticipants((p: AdditionalParticipant[]) => p.slice(0, needed));
		}
	}, [groupSize]);

	async function submitRequest() {
		if (!season) return;
		setRequesting(true);
		setMessage(null);
		try {
			if (selectedEntries.size === 0) {
				throw new Error("Selecciona al menys una classe potencial.");
			}

			// Ensure authenticated user has a surname (required)
			if (!profile || !profile.surname || !profile.surname.trim()) {
				throw new Error(
					"Si us plau, completa el teu cognom al perfil abans d'enviar la sol·licitud."
				);
			}

			// Validate additional participants: require name and DNI
			for (let i = 0; i < participants.length; i++) {
				const p = participants[i];
				if (!p.name || !p.name.trim()) {
					throw new Error(`Introdueix el nom del participant ${i + 2}.`);
				}
				if (!p.dni || !p.dni.trim()) {
					throw new Error(`Introdueix el DNI del participant ${i + 2}.`);
				}
			}

			// Validate payment selection
			if (!paymentMethod || !paymentMethod.trim()) {
				throw new Error("Si us plau, selecciona un mètode de pagament.");
			}

			// If direct debit selected, require IBAN, holder name and holder DNI
			if (paymentMethod === "direct_debit") {
				if (!directDebit || !directDebit.iban || !directDebit.iban.trim()) {
					throw new Error("Introdueix l'IBAN per a la domiciliació bancària.");
				}
				if (!directDebit.holder_name || !directDebit.holder_name.trim()) {
					throw new Error(
						"Introdueix el nom del titular per a la domiciliació."
					);
				}
				if (!directDebit.holder_dni || !directDebit.holder_dni.trim()) {
					throw new Error(
						"Introdueix el DNI del titular per a la domiciliació."
					);
				}
			}
			const payload: RequestPayload = {
				season_id: season.id,
				group_size: groupSize,
				allow_fill: allowFill,
				payment_method: paymentMethod,
				observations: observations || undefined,
				participants: participants.map((p: AdditionalParticipant) => ({
					name: p.name,
					dni: p.dni,
					phone: normalizePhone(p.phone),
				})),
				choices: Array.from(selectedEntries),
				direct_debit:
					paymentMethod === "direct_debit" ? directDebit : undefined,
			};
			const res = await fetch("/api/seasons/enroll", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Error");
			setMessage("Sol·licitud enviada correctament.");
			setHasRequest(true);
		} catch (e: any) {
			setMessage(e.message);
		}
		setRequesting(false);
	}

	return {
		loading,
		season,
		entries,
		requesting,
		hasRequest,
		selectedEntries,
		groupSize,
		allowFill,
		paymentMethod,
		observations,
		participants,
		currentStep,
		directDebit,
		message,
		assignment,
		assignedEntry,
		classmates,
		classmatesUnavailable,
		setGroupSize,
		setAllowFill,
		setPaymentMethod,
		setObservations,
		setParticipants,
		setCurrentStep,
		setDirectDebit,
		toggleEntry,
		updateParticipant,
		submitRequest,
	};
}
