import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, CalendarPlus, User } from "lucide-react";
import type { Season, Entry } from "@/components/seasons/types";

// --- Date & Calendar Helpers -------------------------------------------------

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
	if (delta === 0 && result <= now) result.setDate(result.getDate() + 7);
	else result.setDate(result.getDate() + delta);
	return result;
}

function pad(n: number) {
	return n < 10 ? `0${n}` : String(n);
}

function toIcsLocal(dt: Date) {
	return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(
		dt.getHours()
	)}${pad(dt.getMinutes())}00`;
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
	const rrule = `RRULE:FREQ=WEEKLY;BYDAY=${icsByDay(assignedEntry.day_of_week)}${
		untilIcs ? `;UNTIL=${untilIcs}` : ""
	}`;
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
		untilIcs
			? `RRULE:FREQ=WEEKLY;BYDAY=${icsByDay(assignedEntry.day_of_week)};UNTIL=${untilIcs}`
			: `RRULE:FREQ=WEEKLY;BYDAY=${icsByDay(assignedEntry.day_of_week)}`,
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

// --- Component ----------------------------------------------------------------

interface AssignedClassCardProps {
	season: Season;
	assignment: any;
	assignedEntry: Entry;
	classmatesUnavailable: boolean; // retained for potential future messaging
}

export function AssignedClassCard({
	season,
	assignment,
	assignedEntry,
	classmatesUnavailable, // eslint-disable-line @typescript-eslint/no-unused-vars
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
								{/* Show kind badge only if it exists and is not the generic 'class' label */}
								{assignedEntry?.kind && assignedEntry.kind !== "class" && (
									<Badge variant="secondary" className="ml-1">
										{assignedEntry.kind}
									</Badge>
								)}
							</CardDescription>
						</div>
						<div className="hidden md:flex items-center gap-2">
							{assignedEntry?.location && (
								<a
									href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
										assignedEntry.location
									)}`}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-1 text-xs underline text-muted-foreground hover:text-foreground transition-colors"
								>
									<MapPin className="h-3 w-3" /> Veure mapa
								</a>
							)}
							{assignedEntry && (
								<Button
									size="sm"
									variant="outline"
									onClick={() => downloadCalendar(assignedEntry, season)}
									className="gap-1"
									aria-label="Afegir aquesta classe al calendari"
								>
									<CalendarPlus className="h-3 w-3" /> Afegir al calendari
								</Button>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-5">
					{/* Responsive grid layout */}
					<div className="grid gap-6 md:gap-4 md:grid-cols-12 items-start">
						{/* Day + Time block */}
						<div className="md:col-span-5 flex flex-col gap-4">
							<div className="flex items-center gap-3">
								<Badge variant="outline" className="text-foreground/80 shrink-0">
									{assignedEntry ? dayNameLong(assignedEntry.day_of_week) : "--"}
								</Badge>
								<div className="flex items-center gap-2">
									<div className="p-1.5 rounded-md bg-white/5 border border-white/10">
										<Clock className="h-4 w-4 text-padel-primary" />
									</div>
									<div className="flex flex-col leading-tight">
										<span className="text-2xl md:text-3xl font-semibold tracking-tight">
											{assignedEntry
												? `${assignedEntry.start_time.slice(0, 5)} – ${assignedEntry.end_time.slice(0, 5)}`
												: "--:--"}
										</span>
										{assignedEntry?.location && (
											<span className="flex items-center gap-1 text-[11px] text-muted-foreground">
												<MapPin className="h-3 w-3" /> {assignedEntry.location}
											</span>
										)}
									</div>
								</div>
							</div>
							{/* Occupancy pill (visual only, accessible text for SR) */}
							{typeof assignedEntry?.remaining_capacity === "number" &&
								typeof assignedEntry?.capacity === "number" && (
									(() => {
										const total = assignedEntry.capacity || 0;
										const used =
											(assignedEntry.capacity || 0) -
											(assignedEntry.remaining_capacity || 0);
										const pct = total > 0 ? Math.min(100, Math.max(0, (used / total) * 100)) : 0;
										return (
											<div
												className="w-full flex flex-col gap-1"
												aria-label={`Ocupació ${used} de ${total}`}
											>
												<div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
													<div
														className="h-full bg-gradient-to-r from-padel-primary to-padel-primary-light transition-[width] duration-500 ease-out"
														style={{ width: `${pct}%` }}
														aria-hidden="true"
													/>
												</div>
												<span className="sr-only">{`Ocupació ${used} de ${total}`}</span>
											</div>
										);
									})()
								)}
						</div>

						{/* Meta info badges */}
						<div className="md:col-span-4 flex flex-wrap md:justify-center gap-2 md:pt-1">
							{assignedEntry && typeof assignment?.group_size === "number" && (
								<Badge
									variant="outline"
									className="flex items-center gap-1"
									aria-label="Mida del grup"
								>
									<User className="h-3 w-3" /> {assignment.group_size}
								</Badge>
							)}
							{assignment?.payment_method && (
								<Badge
									variant="outline"
									className="whitespace-nowrap"
									aria-label="Mètode de pagament"
								>
									{(() => {
										switch (assignment.payment_method) {
											case "cash":
												return "Efectiu";
											case "bizum":
												return "Bizum";
											case "direct_debit":
												return "Rebut domiciliat";
											default:
												return assignment.payment_method;
										}
									})()}
								</Badge>
							)}
						</div>

						{/* Actions for mobile (hidden on md since shown in header) */}
						<div className="md:col-span-3 flex md:justify-end gap-2 order-first md:order-none md:hidden">
							{assignedEntry?.location && (
								<a
									href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
										assignedEntry.location
									)}`}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-1 text-xs underline text-muted-foreground hover:text-foreground transition-colors"
								>
									<MapPin className="h-3 w-3" /> Mapa
								</a>
							)}
							{assignedEntry && (
								<Button
									size="sm"
									variant="outline"
									onClick={() => downloadCalendar(assignedEntry, season)}
									className="gap-1"
									aria-label="Afegir la classe al calendari"
								>
									<CalendarPlus className="h-3 w-3" /> Calendari
								</Button>
							)}
						</div>
					</div>

					{/* Optional note */}
					{assignedEntry && "note" in assignedEntry && (assignedEntry as any).note && (
						<div className="text-xs text-muted-foreground border border-white/10 rounded-md p-2 bg-white/5">
							<span className="font-medium text-foreground">Nota: </span>
							{(assignedEntry as any).note}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export default AssignedClassCard;
