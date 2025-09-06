"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/libs/supabase/client";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Calendar, Users, Clock } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

interface Season {
	id: number;
	name: string;
	date_start: string;
	date_end: string;
	enrollments_open: boolean;
	timezone: string;
}
interface Entry {
	id: number;
	day_of_week: number;
	kind: string;
	start_time: string;
	end_time: string;
	capacity: number | null;
	location: string;
	note?: string | null;
	remaining_capacity?: number | null;
}
interface RequestPayload {
	season_id: number;
	group_size: number;
	allow_fill: boolean;
	payment_method: string;
	observations?: string;
	participants: { name: string; is_primary?: boolean }[];
	choices: number[];
	direct_debit?: {
		iban: string;
		holder_name: string;
		holder_address: string;
		holder_dni: string;
	};
}

const dayNames = ["Dg", "Dl", "Dt", "Dc", "Dj", "Dv", "Ds"];

export default function SeasonEnrollmentPage() {
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
	const [allowFill, setAllowFill] = useState(false);
	const [paymentMethod, setPaymentMethod] = useState("cash");
	const [observations, setObservations] = useState("");
	const [participants, setParticipants] = useState<string[]>([""]);
	const [directDebit, setDirectDebit] = useState({
		iban: "",
		holder_name: "",
		holder_address: "",
		holder_dni: "",
	});
	const [message, setMessage] = useState<string | null>(null);
	const [assignment, setAssignment] = useState<any | null>(null);

	useEffect(() => {
		load();
	}, []);

	async function load() {
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
			} else {
				const { data: asg2 } = await supabase
					.from("season_assignments")
					.select("*")
					.eq("season_id", seasonRows.id)
					.eq("user_id", profile?.id)
					.eq("status", "active")
					.maybeSingle();
				if (asg2) setAssignment(asg2);
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

	function updateParticipant(i: number, val: string) {
		setParticipants((p) => {
			const arr = [...p];
			arr[i] = val;
			return arr;
		});
	}

	useEffect(() => {
		if (groupSize > participants.length) {
			setParticipants((p) => [...p, ...Array(groupSize - p.length).fill("")]);
		} else if (groupSize < participants.length) {
			setParticipants((p) => p.slice(0, groupSize));
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
			const payload: RequestPayload = {
				season_id: season.id,
				group_size: groupSize,
				allow_fill: allowFill,
				payment_method: paymentMethod,
				observations: observations || undefined,
				participants: participants.map((n, i) => ({
					name: n || `Participant ${i + 1}`,
					is_primary: i === 0,
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

	if (loading)
		return (
			<div className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				Carregant...
			</div>
		);

	if (!season)
		return (
			<div className="p-6 text-sm">
				No hi ha cap temporada amb inscripcions obertes.
			</div>
		);

	if (assignment) {
		return (
			<div className="space-y-6 p-4 md:p-6">
				<Card className="border-padel-primary/30 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-padel-primary">
							Classe Assignada <Calendar className="h-5 w-5" />
						</CardTitle>
						<CardDescription>{season.name}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<p>Se t'ha assignat una classe de la temporada en curs.</p>
						<p className="text-xs text-muted-foreground">
							Mentre la temporada estigui activa veuràs aquesta informació aquí.
						</p>
						<Button variant="secondary" onClick={() => load()}>
							Refrescar
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (hasRequest) {
		return (
			<div className="p-6 space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>Sol·licitud enviada</CardTitle>
						<CardDescription>
							Estem revisant la teva sol·licitud per {season.name}. Rebràs una
							assignació quan estigui disponible.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={() => load()} size="sm" variant="outline">
							Refrescar
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-4 md:p-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">{season.name}</h1>
				<p className="text-sm text-muted-foreground">
					Selecciona les classes potencials i envia la teva sol·licitud.
				</p>
			</div>
			<div className="grid md:grid-cols-3 gap-6">
				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle>Horari Setmanal</CardTitle>
						<CardDescription>
							Marca totes les franges en les que podries assistir.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-7 gap-2 mb-2 text-[11px] font-medium text-muted-foreground">
							{dayNames.map((d) => (
								<div key={d} className="text-center">
									{d}
								</div>
							))}
						</div>
						<div className="grid grid-cols-7 gap-2 min-h-[320px]">
							{Array.from({ length: 7 }).map((_, day) => (
								<div key={day} className="space-y-2">
									{entries
										.filter((e) => e.day_of_week === day && e.kind === "class")
										.map((e) => {
											const active = selectedEntries.has(e.id);
											return (
												<button
													key={e.id}
													onClick={() => toggleEntry(e.id)}
													className={cn(
														"w-full text-left rounded-md border px-2 py-1.5 text-xs transition shadow-sm",
														active
															? "bg-padel-primary/80 text-black border-padel-primary"
															: "bg-white/5 hover:bg-white/10 border-white/10",
														"flex flex-col gap-0.5"
													)}>
													<span className="font-medium flex items-center gap-1">
														<Clock className="h-3 w-3" />
														{e.start_time.slice(0, 5)}-{e.end_time.slice(0, 5)}
													</span>
													<span className="flex items-center gap-1 text-[10px] text-muted-foreground">
														<Users className="h-3 w-3" />
														Cap: {e.capacity}
													</span>
													{typeof e.remaining_capacity === "number" && (
														<span className="text-[10px] text-muted-foreground">
															Disp: {e.remaining_capacity}
														</span>
													)}
												</button>
											);
										})}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Sol·licitud</CardTitle>
						<CardDescription>Dades necessàries</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<label className="text-xs font-medium">Mida del grup</label>
							<Input
								type="number"
								min={1}
								max={4}
								value={groupSize}
								onChange={(e) => setGroupSize(Number(e.target.value) || 1)}
							/>
						</div>
						{participants.map((p, i) => (
							<div key={i}>
								<label className="text-xs font-medium">
									Participant {i + 1}
								</label>
								<Input
									value={p}
									onChange={(e) => updateParticipant(i, e.target.value)}
									placeholder={i === 0 ? "Nom principal" : "Nom addicional"}
								/>
							</div>
						))}
						<div className="flex items-center space-x-2">
							<Checkbox
								id="allow_fill"
								checked={allowFill}
								onCheckedChange={(v) => setAllowFill(!!v)}
							/>
							<label htmlFor="allow_fill" className="text-xs">
								Permetre omplenar la classe amb altres persones
							</label>
						</div>
						<div>
							<label className="text-xs font-medium">Mètode de pagament</label>
							<select
								className="mt-1 w-full rounded-md bg-background border px-2 py-1.5 text-sm"
								value={paymentMethod}
								onChange={(e) => setPaymentMethod(e.target.value)}>
								<option value="cash">Efectiu</option>
								<option value="bizum">Bizum</option>
								<option value="direct_debit">Rebut bancari</option>
							</select>
						</div>
						{paymentMethod === "direct_debit" && (
							<div className="space-y-2 border rounded-md p-3">
								<div>
									<label className="text-[11px] font-medium">IBAN</label>
									<Input
										value={directDebit.iban}
										onChange={(e) =>
											setDirectDebit({ ...directDebit, iban: e.target.value })
										}
										placeholder="ES.."
									/>
								</div>
								<div>
									<label className="text-[11px] font-medium">Titular</label>
									<Input
										value={directDebit.holder_name}
										onChange={(e) =>
											setDirectDebit({
												...directDebit,
												holder_name: e.target.value,
											})
										}
									/>
								</div>
								<div>
									<label className="text-[11px] font-medium">Adreça</label>
									<Input
										value={directDebit.holder_address}
										onChange={(e) =>
											setDirectDebit({
												...directDebit,
												holder_address: e.target.value,
											})
										}
									/>
								</div>
								<div>
									<label className="text-[11px] font-medium">DNI</label>
									<Input
										value={directDebit.holder_dni}
										onChange={(e) =>
											setDirectDebit({
												...directDebit,
												holder_dni: e.target.value,
											})
										}
									/>
								</div>
								<div className="flex items-center gap-2 text-[11px] text-muted-foreground">
									<Checkbox checked onCheckedChange={() => {}} /> Autoritzo la
									domiciliació bancària
								</div>
							</div>
						)}
						<div>
							<label className="text-xs font-medium">Observacions</label>
							<Textarea
								value={observations}
								onChange={(e) => setObservations(e.target.value)}
								rows={3}
							/>
						</div>
						{message && (
							<div className="text-xs text-muted-foreground">{message}</div>
						)}
						<Button
							disabled={requesting}
							className="w-full"
							onClick={submitRequest}>
							{requesting ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Enviar sol·licitud"
							)}
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
