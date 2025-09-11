import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, CalendarPlus } from "lucide-react";
import type { Season, Entry } from "@/components/seasons/types";

const dayNames = ["Dg", "Dl", "Dt", "Dc", "Dj", "Dv", "Ds"];

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
	return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(
		dt.getDate()
	)}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function downloadCalendar(assignedEntry: Entry, season: Season) {
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

interface AssignedClassCardProps {
	season: Season;
	assignment: any;
	assignedEntry: Entry;
	classmates: {
		id?: number;
		name?: string | null;
		surname?: string | null;
		avatar_url?: string | null;
	}[];
	classmatesUnavailable: boolean;
}

export function AssignedClassCard({
	season,
	assignment,
	assignedEntry,
	classmates,
	classmatesUnavailable,
}: AssignedClassCardProps) {
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
									onClick={() => downloadCalendar(assignedEntry, season)}
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
									<Badge variant="outline">Grup: {assignment.group_size}</Badge>
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

					{/* Optional note (some DB views add note) */}
					{assignedEntry &&
						"note" in assignedEntry &&
						(assignedEntry as any).note && (
							<div className="text-xs text-muted-foreground border border-white/10 rounded-md p-2">
								<span className="font-medium text-foreground">Nota: </span>
								{(assignedEntry as any).note}
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
