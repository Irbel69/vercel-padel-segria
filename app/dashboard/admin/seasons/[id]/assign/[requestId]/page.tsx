"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import RequestDetails, {
	type RequestRowDetails,
} from "@/components/seasons-admin/RequestDetails";
import { Clock, Users, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Entry {
	id: number;
	day_of_week: number;
	kind: string;
	start_time: string;
	end_time: string;
	capacity: number | null;
	location: string;
	remaining_capacity?: number | null;
}
interface RequestRow extends RequestRowDetails {
	id: number;
	user_id: string;
	choices?: { entry_id: number }[];
}
interface Assignment {
	id: number;
	entry_id: number;
	group_size: number;
	allow_fill: boolean; // Added to evaluate fill compatibility
	request_id?: number;
}

const dayNames = ["Dg", "Dl", "Dt", "Dc", "Dj", "Dv", "Ds"];
const dayOrder = [1, 2, 3, 4, 5, 6, 0];

export default function AssignRequestPage() {
	const params = useParams();
	const seasonId = Number(params?.id);
	const requestId = Number(params?.requestId);
	const search = useSearchParams();
	const isEdit = search?.get("edit") === "1";
	const router = useRouter();
	const supabase = createClient();
	const [request, setRequest] = useState<RequestRow | null>(null);
	const [entries, setEntries] = useState<Entry[]>([]);
	const [assignments, setAssignments] = useState<Assignment[]>([]);
	const [loading, setLoading] = useState(true);
	const [assigning, setAssigning] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	const choiceSet = useMemo(
		() => new Set((request?.choices || []).map((c) => c.entry_id)),
		[request]
	);

	function paymentMethodLabel(pm?: string | null) {
		switch (pm) {
			case "direct_debit":
				return "Domiciliació";
			case "cash":
				return "Efectiu";
			case "bizum":
				return "Bizum";
			default:
				return pm || "-";
		}
	}

	function allowFillLabel(allow: boolean) {
		return allow ? "Admet omplir" : "No admet omplir";
	}

	const load = useCallback(async () => {
		if (!seasonId || !requestId) return;
		setLoading(true);
		setMessage(null);
		try {
			// reuse API for bulk data
			const res = await fetch(`/api/seasons/${seasonId}/assignments`);
			const json = await res.json();
			if (res.ok) {
				setEntries(
					(json.entries || []).filter(
						(e: Entry) => e.kind === "class" || !e.kind
					)
				);
				setAssignments(json.assignments || []);
				// find specific request (may not be in list if already assigned) -> fetch directly
				const req = (json.requests || []).find(
					(r: RequestRow) => r.id === requestId
				);
				if (req) {
					// ensure we have direct debit details
					setRequest(req);
					try {
						const { data: dd } = await supabase
							.from("season_direct_debit_details")
							.select("iban,holder_name,holder_address,holder_dni")
							.eq("request_id", requestId)
							.maybeSingle();
						if (dd) setRequest((r) => (r ? { ...r, direct_debit: dd } : r));
					} catch (e) {
						// ignore
					}
				} else {
					// fallback direct fetch
					const single = await supabase
						.from("season_enrollment_requests")
						.select(
							"id,group_size,allow_fill,observations,payment_method,user:users(name,surname,email,phone),participants:season_request_participants(id,name,dni,phone),choices:season_request_choices(entry_id),direct_debit:season_direct_debit_details(iban,holder_name,holder_address,holder_dni)"
						)
						.eq("id", requestId)
						.maybeSingle();
					if (single.data) {
						const d = single.data as any;
						// normalize direct_debit property name if nested
						if (d.direct_debit) d.direct_debit = d.direct_debit;
						setRequest(d);
					}
				}
			} else {
				setMessage(json.error || "Error carregant");
			}
		} catch (e: any) {
			setMessage(e.message);
		}
		setLoading(false);
	}, [seasonId, requestId, supabase]);

	useEffect(() => {
		load();
	}, [load]);

	function capacityInfo(entry: Entry) {
		const used = assignments
			.filter((a) => a.entry_id === entry.id)
			.reduce((s, a) => s + a.group_size, 0);
		return {
			used,
			total: entry.capacity,
			remaining: entry.capacity != null ? entry.capacity - used : null,
		};
	}

	async function assign(entry: Entry) {
		if (!request) return;

		// Warn if the selected entry is not one of the request's preferred choices
		const isNonPreferred = !choiceSet.has(entry.id);
		let overrideChoice = false;
		if (isNonPreferred) {
			const ok = window.confirm(
				"Atenció: aquest horari no és una de les opcions marcades per l'usuari. Vols continuar d'igual manera?"
			);
			if (!ok) return;
			overrideChoice = true;
		}
		if (entry.capacity != null) {
			const { used, remaining } = capacityInfo(entry);
			if (remaining != null && remaining < request.group_size) {
				return;
			}
		}

		// Determine fill compatibility warnings
		const existingForEntry = assignments.filter((a) => a.entry_id === entry.id);
		const existingHasNoFill = existingForEntry.some(
			(a) => a.allow_fill === false
		);
		let proceed = true;
		// Case 1: existing class has someone who requested no fill
		if (existingHasNoFill) {
			proceed = window.confirm(
				"Atenció, les persones ja inscrites en aquesta classe han sol·licitat no omplir-la amb més gent. Estàs segur que vols continuar?"
			);
		} else if (
			// Case 2: existing participants allow fill but incoming request wants exclusivity
			request.allow_fill === false &&
			existingForEntry.length > 0
		) {
			proceed = window.confirm(
				"Atenció, les persones que estàs intentant inscriure han sol·licitat fer la classe soles. Estàs segur que vols afegir-les a una classe amb més participants?"
			);
		}
		if (!proceed) return;
		setAssigning(true);
		setMessage(null);
		try {
			const res = await fetch(`/api/seasons/${seasonId}/assignments`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					request_id: request.id,
					entry_id: entry.id,
					edit: isEdit,
					override_choice: overrideChoice,
				}),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Error creant assignació");
			router.push(`/dashboard/admin/seasons/${seasonId}?tab=assignments`);
		} catch (e: any) {
			setMessage(e.message);
		}
		setAssigning(false);
	}

	const startTimes = useMemo(() => {
		const set = new Set(entries.map((e) => e.start_time.slice(0, 5)));
		return Array.from(set).sort();
	}, [entries]);

	return (
		<div className="p-4 md:p-6 space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="sm" onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-xl font-semibold">
					Assignar sol·licitud #{requestId}
				</h1>
				<div className="ml-auto flex gap-2">
					<Button variant="outline" size="sm" onClick={load}>
						Refrescar
					</Button>
				</div>
			</div>
			{message && <div className="text-xs text-red-500">{message}</div>}
			{request && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Detalls sol·licitud</CardTitle>
						<CardDescription className="text-xs">
							Preferències i dades del titular
						</CardDescription>
					</CardHeader>
					<CardContent className="text-xs space-y-3">
						<RequestDetails req={request} />
					</CardContent>
				</Card>
			)}
			<Card className="overflow-x-auto">
				<CardHeader>
					<CardTitle className="text-base">Calendari</CardTitle>
					<CardDescription className="text-xs">
						Fes click sobre una classe per assignar.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading && <div className="text-xs">Carregant...</div>}
					{!loading && (
						<div className="min-w-[840px]">
							<div
								className="grid"
								style={{ gridTemplateColumns: "80px repeat(7,1fr)" }}>
								<div></div>
								{dayOrder.map((d) => (
									<div
										key={d}
										className="text-xs font-semibold text-center pb-2">
										{dayNames[d]}
									</div>
								))}
								{startTimes.map((time) => (
									<>
										<div
											key={"time-" + time}
											className="text-[10px] font-mono pr-2 py-1 text-muted-foreground">
											{time}
										</div>
										{dayOrder.map((dayIdx) => {
											const entry = entries.find(
												(e) =>
													e.day_of_week === dayIdx &&
													e.start_time.slice(0, 5) === time
											);
											if (!entry)
												return <div key={dayIdx + time} className="p-1" />;
											const capacity = capacityInfo(entry);
											const highlight = choiceSet.has(entry.id);
											const insufficient =
												capacity.remaining != null &&
												request &&
												capacity.remaining < request.group_size;
											return (
												<button
													key={entry.id}
													disabled={assigning || insufficient}
													onClick={() => assign(entry)}
													className={cn(
														"relative rounded border p-2 text-[11px] text-left shadow-sm group w-full h-full transition",
														entry.kind === "class"
															? "bg-emerald-500/10 border-emerald-500/30"
															: "bg-amber-500/10 border-amber-500/30",
														highlight && "ring-2 ring-padel-primary",
														insufficient && "opacity-40 cursor-not-allowed"
													)}>
													<div className="flex justify-between mb-1">
														<span className="font-medium flex items-center gap-1">
															<Clock className="h-3 w-3" />
															{entry.start_time.slice(0, 5)}-
															{entry.end_time.slice(0, 5)}
														</span>
														{highlight && (
															<Check className="h-3 w-3 text-padel-primary" />
														)}
													</div>
													<div className="flex justify-between items-end">
														<span className="inline-flex items-center gap-1 text-muted-foreground">
															<Users className="h-3 w-3" />
															{capacity.used}/{entry.capacity ?? "—"}
														</span>
													</div>
												</button>
											);
										})}
									</>
								))}
								<div></div>
								{dayOrder.map((d) => (
									<div key={"footer-" + d}></div>
								))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
