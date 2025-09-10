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
import {
	Loader2,
	Calendar,
	Users,
	Clock,
	MapPin,
	CalendarPlus,
	Share2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
	participants: { name: string; dni?: string; phone?: string }[]; // only additional (excluding auth user)
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
	const [allowFill, setAllowFill] = useState(true); // default marked
	const [paymentMethod, setPaymentMethod] = useState("cash");
	const [observations, setObservations] = useState("");
	interface AdditionalParticipant {
		name: string;
		dni: string;
		phone: string;
	}
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

	function dayNameLong(day: number) {
		const ca = [
			"Diumenge",
			"Dilluns",
			"Dimarts",
			"Dimecres",
			"Dijous",
			"Divendres",
			"Dissabte",
		];
		return ca[day] || "";
	}

	function icsByDay(day: number) {
		const map = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
		return map[day] || "MO";
	}

	function nextOccurrence(day: number, startHHMM: string) {
		// Compute next date (local) for given weekday and start time HH:MM
		const now = new Date();
		const result = new Date(now);
		const [hh, mm] = startHHMM.split(":").map(Number);
		result.setHours(hh, mm, 0, 0);
		const delta = (day - result.getDay() + 7) % 7;
		if (delta === 0 && result <= now) {
			result.setDate(result.getDate() + 7);
		} else {
			result.setDate(result.getDate() + delta);
		}
		return result;
	}

	function pad(n: number) {
		return n < 10 ? `0${n}` : String(n);
	}

	function toIcsLocal(dt: Date) {
		// Floating local time (no timezone, let calendar assume local)
		return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(
			dt.getDate()
		)}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
	}

	function downloadCalendar() {
		if (!assignedEntry || !season) return;
		const start = nextOccurrence(
			assignedEntry.day_of_week,
			assignedEntry.start_time.slice(0, 5)
		);
		const end = nextOccurrence(
			assignedEntry.day_of_week,
			assignedEntry.end_time.slice(0, 5)
		);
		const uid = `season-${season.id}-entry-${assignedEntry.id}@padel-segria`;
		const summary = `Classe de pàdel (${season.name})`;
		const description = `Sessió setmanal ${dayNameLong(
			assignedEntry.day_of_week
		)} ${assignedEntry.start_time.slice(0, 5)}-${assignedEntry.end_time.slice(
			0,
			5
		)}. Lloc: ${assignedEntry.location}`;
		const until = season.date_end ? new Date(season.date_end) : null;
		const untilIcs = until
			? `${until.getUTCFullYear()}${pad(until.getUTCMonth() + 1)}${pad(
					until.getUTCDate()
			  )}T235959Z`
			: "";
		const rrule = `RRULE:FREQ=WEEKLY;BYDAY=${icsByDay(
			assignedEntry.day_of_week
		)}${untilIcs ? `;UNTIL=${untilIcs}` : ""}`;
		const ics = [
			"BEGIN:VCALENDAR",
			"VERSION:2.0",
			"PRODID:-//Padel Segria//Seasons//EN",
			"CALSCALE:GREGORIAN",
			"METHOD:PUBLISH",
			"BEGIN:VEVENT",
			`UID:${uid}`,
			`DTSTAMP:${toIcsLocal(new Date())}`,
			`DTSTART:${toIcsLocal(start)}`,
			`DTEND:${toIcsLocal(end)}`,
			`SUMMARY:${summary}`,
			`DESCRIPTION:${description}`,
			`LOCATION:${assignedEntry.location}`,
			rrule,
			"END:VEVENT",
			"END:VCALENDAR",
		].join("\r\n");
		const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `classe-${season.id}-${assignedEntry.id}.ics`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function shareAssignment() {
		try {
			if (!assignedEntry || !season) return;
			const title = `Classe de pàdel - ${season.name}`;
			const text = `${dayNameLong(
				assignedEntry.day_of_week
			)} ${assignedEntry.start_time.slice(0, 5)}-${assignedEntry.end_time.slice(
				0,
				5
			)} · ${assignedEntry.location}`;
			const url =
				typeof window !== "undefined" ? window.location.href : undefined;
			if ((navigator as any).share) {
				await (navigator as any).share({ title, text, url });
			} else if (url) {
				await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
				alert("Enllaç copiat al porta-retalls");
			}
		} catch (e) {}
	}

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
			const payload: RequestPayload = {
				season_id: season.id,
				group_size: groupSize,
				allow_fill: allowFill,
				payment_method: paymentMethod,
				observations: observations || undefined,
				participants: participants.map(
					(p: AdditionalParticipant, i: number) => ({
						name: p.name || `Participant ${i + 2}`,
						dni: p.dni || undefined,
						phone: normalizePhone(p.phone),
					})
				),
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
				<Card className="border border-padel-primary/30 bg-gradient-to-br from-[#0b0b0b] to-black/60 shadow-[0_0_40px_-20px_rgba(255,255,0,0.3)]">
					<CardHeader>
						<div className="flex items-center justify-between gap-3">
							<div>
								<CardTitle className="flex items-center gap-2 text-padel-primary">
									<Calendar className="h-5 w-5" /> Classe Assignada
								</CardTitle>
								<CardDescription className="mt-1 flex items-center gap-2 text-[13px]">
									<span className="text-foreground/80">{season.name}</span>
									{assignedEntry?.kind && (
										<Badge variant="secondary" className="ml-1">
											{assignedEntry.kind}
										</Badge>
									)}
								</CardDescription>
							</div>
							<div className="flex items-center gap-2">
								<Button size="sm" variant="secondary" onClick={() => load()}>
									Refrescar
								</Button>
								{assignedEntry?.location && (
									<a
										href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
											assignedEntry.location
										)}`}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1 text-xs underline text-muted-foreground hover:text-foreground">
										<MapPin className="h-3 w-3" /> Veure mapa
									</a>
								)}
								{assignedEntry && (
									<Button
										size="sm"
										variant="outline"
										onClick={downloadCalendar}
										className="gap-1">
										<CalendarPlus className="h-3 w-3" /> Afegir al calendari
									</Button>
								)}
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Schedule */}
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
							<div className="flex items-center gap-4">
								<Badge variant="outline" className="text-foreground/80">
									{assignedEntry ? dayNames[assignedEntry.day_of_week] : "--"}
								</Badge>
								<div className="flex items-center gap-2">
									<Clock className="h-5 w-5 text-muted-foreground" />
									<div className="leading-tight">
										<div className="text-2xl md:text-3xl font-semibold tracking-tight">
											{assignedEntry
												? `${assignedEntry.start_time.slice(
														0,
														5
												  )} - ${assignedEntry.end_time.slice(0, 5)}`
												: "--:--"}
										</div>
										{assignedEntry?.location && (
											<div className="flex items-center gap-1 text-xs text-muted-foreground">
												<MapPin className="h-4 w-4" /> {assignedEntry.location}
											</div>
										)}
									</div>
								</div>
							</div>
							{typeof assignedEntry?.remaining_capacity === "number" && (
								<div className="space-y-1">
									<div className="h-1.5 w-40 bg-white/10 rounded overflow-hidden">
										<div
											className="h-full bg-padel-primary"
											style={{
												width: `${Math.max(
													0,
													Math.min(
														100,
														(((assignedEntry.capacity || 0) -
															(assignedEntry.remaining_capacity || 0)) /
															(assignedEntry.capacity || 1)) *
															100
													)
												)}%`,
											}}
										/>
									</div>
									<div className="text-[11px] text-muted-foreground">
										Places disponibles: {assignedEntry.remaining_capacity} /{" "}
										{assignedEntry.capacity ?? "-"}
									</div>
								</div>
							)}
						</div>

						{/* Next session and meta */}
						{assignedEntry && (
							<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
								<div className="text-xs text-muted-foreground">
									<span className="font-medium text-foreground">
										Propera sessió:
									</span>{" "}
									{(() => {
										const d = nextOccurrence(
											assignedEntry.day_of_week,
											assignedEntry.start_time.slice(0, 5)
										);
										return `${d.toLocaleDateString("ca-ES", {
											weekday: "short",
											day: "2-digit",
											month: "short",
										})} · ${d.toLocaleTimeString("ca-ES", {
											hour: "2-digit",
											minute: "2-digit",
										})}`;
									})()}
								</div>
								<div className="flex items-center gap-2">
									{typeof assignment?.group_size === "number" && (
										<Badge variant="outline">
											Grup: {assignment.group_size}
										</Badge>
									)}
									{assignment?.payment_method && (
										<Badge variant="outline">
											Pagament:{" "}
											{assignment.payment_method === "direct_debit"
												? "Rebut"
												: assignment.payment_method}
										</Badge>
									)}
								</div>
							</div>
						)}

						{/* Optional note */}
						{assignedEntry?.note && (
							<div className="text-xs text-muted-foreground border border-white/10 rounded-md p-2">
								<span className="font-medium text-foreground">Nota: </span>
								{assignedEntry.note}
							</div>
						)}

						{/* Classmates */}
						<div>
							<div className="text-sm font-medium mb-2">Companys de classe</div>
							{classmates && classmates.length > 0 ? (
								<div className="flex flex-col gap-2">
									<div className="flex -space-x-2">
										{classmates.slice(0, 6).map((c, i) => {
											const initials =
												`${(c.name || "").charAt(0)}${(c.surname || "").charAt(
													0
												)}` || "?";
											return (
												<Avatar
													key={c.id || i}
													className="h-8 w-8 ring-2 ring-background">
													{c.avatar_url ? (
														<AvatarImage
															src={c.avatar_url}
															alt={`${c.name} ${c.surname}`}
														/>
													) : (
														<AvatarFallback className="text-[10px]">
															{initials}
														</AvatarFallback>
													)}
												</Avatar>
											);
										})}
										{classmates.length > 6 && (
											<div className="h-8 w-8 rounded-full bg-white/10 text-[11px] flex items-center justify-center ring-2 ring-background">
												+{classmates.length - 6}
											</div>
										)}
									</div>
									<div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
										{classmates.slice(0, 8).map((c, i) => (
											<span
												key={(c.id || i) + "-name"}
												className="bg-white/5 rounded px-1.5 py-0.5">
												{c.name} {c.surname}
											</span>
										))}
									</div>
								</div>
							) : (
								<div className="text-xs text-muted-foreground">
									{classmatesUnavailable
										? "No es pot mostrar la llista de companys per privacitat."
										: "Encara no hi ha companys assignats o estàs sol a la classe."}
								</div>
							)}
						</div>
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
					{currentStep === 1
						? "Selecciona les classes potencials."
						: "Introdueix les dades del grup i finalitza la sol·licitud."}
				</p>
			</div>
			{/* Steps indicator */}
			<div className="flex items-center gap-2 text-xs">
				<div
					className={cn(
						"flex-1 h-1 rounded",
						currentStep >= 1 ? "bg-padel-primary" : "bg-white/10"
					)}
				/>
				<div
					className={cn(
						"flex-1 h-1 rounded",
						currentStep >= 2 ? "bg-padel-primary" : "bg-white/10"
					)}
				/>
			</div>
			{currentStep === 1 && (
				<div className="space-y-6">
					<Card>
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
											.filter(
												(e) => e.day_of_week === day && e.kind === "class"
											)
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
															{e.start_time.slice(0, 5)}-
															{e.end_time.slice(0, 5)}
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
							<div className="mt-4 flex justify-end">
								<Button
									variant="secondary"
									disabled={!selectedEntries.size}
									onClick={() => setCurrentStep(2)}>
									Continuar
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
			{currentStep === 2 && (
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Dades del Grup</CardTitle>
							<CardDescription>
								Introdueix la informació necessària.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid md:grid-cols-4 gap-4">
								<div className="md:col-span-2">
									<label className="text-xs font-medium">Mida del grup</label>
									<Input
										type="number"
										min={1}
										max={4}
										value={groupSize}
										onChange={(e) => setGroupSize(Number(e.target.value) || 1)}
									/>
								</div>
								<div className="flex items-center space-x-2 md:col-span-2 pt-6">
									<Checkbox
										id="allow_fill"
										checked={allowFill}
										onCheckedChange={(v) => setAllowFill(!!v)}
									/>
									<label htmlFor="allow_fill" className="text-xs">
										Permetre omplenar la classe amb altres persones
									</label>
								</div>
							</div>
							<div className="space-y-3">
								{participants.map((p: AdditionalParticipant, i: number) => (
									<div
										key={i}
										className="grid grid-cols-1 sm:grid-cols-7 gap-2 items-end">
										<div className="sm:col-span-3">
											<label className="text-xs font-medium">
												Participant {i + 2}
											</label>
											<Input
												value={p.name}
												onChange={(e) =>
													updateParticipant(i, "name", e.target.value)
												}
												placeholder="Nom"
											/>
										</div>
										<div>
											<label className="text-xs font-medium">DNI</label>
											<Input
												value={p.dni}
												onChange={(e) =>
													updateParticipant(i, "dni", e.target.value)
												}
												placeholder="DNI"
											/>
										</div>
										<div className="sm:col-span-2">
											<label className="text-xs font-medium">
												Telèfon (+34)
											</label>
											<Input
												value={p.phone}
												onChange={(e) =>
													updateParticipant(i, "phone", e.target.value)
												}
												placeholder="600 000 000"
											/>
										</div>
									</div>
								))}
							</div>
							<div>
								<label className="text-xs font-medium">
									Mètode de pagament
								</label>
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
							<div className="flex gap-2 pt-2">
								<Button
									variant="outline"
									onClick={() => setCurrentStep(1)}
									disabled={requesting}>
									Enrere
								</Button>
								<Button
									className="flex-1"
									disabled={requesting}
									onClick={submitRequest}>
									{requesting ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										"Enviar sol·licitud"
									)}
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
