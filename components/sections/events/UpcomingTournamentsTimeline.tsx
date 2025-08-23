"use client";

import React from "react";
import Link from "next/link";
import { Users, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type UpcomingTournament = {
	id: string;
	name: string;
	location: string;
	slots: number; // number of available spots
	date: string; // ISO date string
	status?: "upcoming" | "finished";
	latitude?: number | null;
	longitude?: number | null;
};

type Props = {
	tournaments: UpcomingTournament[];
	// Optional locale for date formatting (defaults to Catalan Spain)
	locale?: string;
};

function formatDayMonth(dateIso: string, locale: string) {
	// Compact local date like "15 jul"; fall back to DD/MM
	try {
		const d = new Date(dateIso);
		return new Intl.DateTimeFormat(locale, {
			day: "2-digit",
			month: "short",
		})
			.format(d)
			.replace(".", "");
	} catch {
		const d = new Date(dateIso);
		const dd = String(d.getDate()).padStart(2, "0");
		const mm = String(d.getMonth() + 1).padStart(2, "0");
		return `${dd}/${mm}`;
	}
}

// Finds the nearest future tournament to subtly highlight
function getNearestFutureId(items: UpcomingTournament[]): string | null {
	const now = Date.now();
	let best: { id: string; diff: number } | null = null;
	for (const t of items) {
		const ts = new Date(t.date).getTime();
		const diff = ts - now;
		if (diff >= 0) {
			if (!best || diff < best.diff) best = { id: t.id, diff };
		}
	}
	return best?.id ?? null;
}

export function UpcomingTournamentsTimeline({
	tournaments,
	locale = "ca-ES",
}: Props) {
	// Sort desc by date (most recent first) and keep at most 4
	const prepared = React.useMemo(() => {
		return [...tournaments]
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			.slice(0, 4);
	}, [tournaments]);

	const nearestFutureId = React.useMemo(
		() => getNearestFutureId(prepared),
		[prepared]
	);

	if (!prepared.length) {
		return (
			<div className="w-full max-w-5xl mx-auto rounded-2xl border bg-white/5 border-white/10 p-6 md:p-10 text-center">
				<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-padel-primary/20">
					<CalendarIcon className="h-7 w-7 text-padel-primary" />
				</div>
				<h3 className="text-lg md:text-xl font-semibold text-white">
					No hi ha tornejos disponibles
				</h3>
				<p className="mt-1 text-sm md:text-base text-gray-300">
					Estem preparant nous tornejos emocionants. Torna aviat!
				</p>
				<div className="mt-6">
					<Button
						asChild
						variant="outline"
						className="border-white/30 text-white hover:bg-white/10">
						<Link href="/dashboard/rankings" aria-label="Veure rankings">
							Veure rankings
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	// Conditional grid sizing for better centering when <4 items
	const containerMax =
		prepared.length === 1
			? "max-w-md"
			: prepared.length === 2
			? "max-w-3xl"
			: prepared.length === 3
			? "max-w-5xl"
			: "max-w-6xl";
	const gridCols =
		prepared.length === 1
			? "md:grid-cols-1 lg:grid-cols-1 justify-items-center"
			: prepared.length === 2
			? "md:grid-cols-2 lg:grid-cols-2"
			: prepared.length === 3
			? "md:grid-cols-2 lg:grid-cols-3"
			: "md:grid-cols-2 lg:grid-cols-4";

	// Vertical timeline (mobile)
	const Vertical = (
		<div className="md:hidden relative">
			<div
				className="absolute left-4 top-0 bottom-0 w-px bg-white/20"
				aria-hidden
			/>
			<ul className="space-y-6">
				{prepared.map((t) => {
					const isFuture =
						t.status === "upcoming" || new Date(t.date).getTime() >= Date.now();
					const isNearest = nearestFutureId === t.id;
					const dotColor = isFuture
						? "bg-padel-primary border-padel-primary"
						: "bg-gray-400 border-gray-400";
					return (
						<li key={t.id} className="relative pl-10">
							{/* Timeline dot */}
							<span
								className={`absolute left-4 top-2 -translate-x-1/2 h-3.5 w-3.5 rounded-full border ${dotColor} ${
									isNearest ? "ring-4 ring-padel-primary/30" : ""
								} transition-shadow`}
								aria-hidden
							/>
							<div
								className={`rounded-xl border p-4 shadow-sm transition hover:shadow-md min-h-[200px] flex flex-col backdrop-blur-md ${
									isNearest
										? "border-padel-primary/60 bg-white/10 shadow-[0_8px_20px_rgba(229,240,0,0.06)]"
										: isFuture
										? "border-padel-primary/30 bg-white/5 shadow-[0_6px_16px_rgba(0,0,0,0.25)]"
										: "border-white/10 bg-white/[0.03] shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
								}`}
								style={{ WebkitBackdropFilter: "blur(6px)" }}>
								<div className="flex items-center justify-between gap-3">
									<div className="flex items-center gap-2 text-padel-primary">
										<CalendarIcon className="h-4 w-4" aria-hidden />
										<span className="text-sm font-semibold uppercase tracking-wide">
											{formatDayMonth(t.date, locale)}
										</span>
									</div>
									<Badge
										className={
											t.status === "finished"
												? "bg-gray-600/30 text-gray-200 border-gray-500/30"
												: "bg-padel-primary/20 text-black border-padel-primary/40"
										}>
										{t.status === "finished" ? "Finalitzat" : "Proper"}
									</Badge>
								</div>
								<h4 className="mt-2 text-base font-bold text-white">
									{t.name}
								</h4>
								<div className="mt-1 flex items-start justify-between gap-2">
									<span className="text-sm text-gray-300 line-clamp-2 flex-1 min-w-0">
										{t.location}
									</span>
									{t.latitude != null && t.longitude != null && (
										<a
											href={`https://www.google.com/maps?q=${t.latitude},${t.longitude}`}
											target="_blank"
											rel="noopener noreferrer"
											aria-label={`Obrir a Google Maps: ${t.name}`}
											className="text-xs font-medium text-padel-primary hover:text-padel-primary/80 underline underline-offset-2 shrink-0">
											Maps
										</a>
									)}
								</div>
								<div className="mt-3 flex items-center justify-between gap-3">
									<div className="flex items-center gap-2 text-white">
										<Users className="h-4 w-4 text-padel-primary" aria-hidden />
										<span className="text-sm">
											{t.slots} places disponibles
										</span>
									</div>
									<div className="flex items-center gap-2">
										<Button
											asChild
											size="sm"
											className="bg-padel-primary text-black hover:bg-padel-primary/90">
											<Link
												href="/dashboard/tournaments"
												aria-label={`Inscriure's al torneig ${t.name}`}>
												Inscriu-te
											</Link>
										</Button>
									</div>
								</div>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);

	// Horizontal timeline (desktop/tablet)
	const Horizontal = (
		<div className="hidden md:block">
			<div className={`relative mx-auto ${containerMax}`}>
				{/* Base line */}
				<div
					className="absolute left-0 right-0 top-8 h-px bg-white/20"
					aria-hidden
				/>
				<ul className={`grid grid-cols-1 ${gridCols} gap-6`}>
					{prepared.map((t) => {
						const isFuture =
							t.status === "upcoming" ||
							new Date(t.date).getTime() >= Date.now();
						const isNearest = nearestFutureId === t.id;
						const dotColor = isFuture
							? "bg-padel-primary border-padel-primary"
							: "bg-gray-400 border-gray-400";
						return (
							<li key={t.id} className="relative">
								{/* Timeline dot aligned with the line */}
								<span
									className={`absolute left-0 right-0 top-7 mx-auto h-3.5 w-3.5 rounded-full border ${dotColor} ${
										isNearest ? "ring-4 ring-padel-primary/30" : ""
									}`}
									aria-hidden
								/>
								<div
									className={`mt-10 rounded-xl border p-5 shadow-sm transition hover:shadow-md min-h-[220px] flex flex-col backdrop-blur-md ${
										isNearest
											? "border-padel-primary/60 bg-white/10 shadow-[0_8px_20px_rgba(229,240,0,0.06)]"
											: isFuture
											? "border-padel-primary/30 bg-white/5 shadow-[0_6px_16px_rgba(0,0,0,0.25)]"
											: "border-white/10 bg-white/[0.03] shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
									}`}
									style={{ WebkitBackdropFilter: "blur(6px)" }}>
									<div className="flex items-center justify-between gap-3">
										<div className="flex items-center gap-2 text-padel-primary">
											<CalendarIcon className="h-4 w-4" aria-hidden />
											<span className="text-sm font-semibold uppercase tracking-wide">
												{formatDayMonth(t.date, locale)}
											</span>
										</div>
										<Badge
											className={
												t.status === "finished"
													? "bg-gray-600/30 text-gray-200 border-gray-500/30"
													: "bg-padel-primary/20 text-black border-padel-primary/40"
											}>
											{t.status === "finished" ? "Finalitzat" : "Proper"}
										</Badge>
									</div>
									<h4 className="mt-2 text-lg font-extrabold text-white">
										{t.name}
									</h4>
									<div className="mt-1 flex items-start justify-between gap-2">
										<span className="text-sm text-gray-300 line-clamp-2 flex-1 min-w-0">
											{t.location}
										</span>
										{t.latitude != null && t.longitude != null && (
											<a
												href={`https://www.google.com/maps?q=${t.latitude},${t.longitude}`}
												target="_blank"
												rel="noopener noreferrer"
												aria-label={`Obrir a Google Maps: ${t.name}`}
												className="text-xs font-medium text-padel-primary hover:text-padel-primary/80 underline underline-offset-2 shrink-0">
												Maps
											</a>
										)}
									</div>
									<div className="mt-4 flex items-center justify-between gap-3">
										<div className="flex items-center gap-2 text-white">
											<Users
												className="h-4 w-4 text-padel-primary"
												aria-hidden
											/>
											<span className="text-sm">
												{t.slots} places disponibles
											</span>
										</div>
										<div className="flex items-center gap-2">
											<Button
												asChild
												className="bg-padel-primary text-black hover:bg-padel-primary/90">
												<Link
													href="/dashboard/tournaments"
													aria-label={`Inscriure's al torneig ${t.name}`}>
													Inscriu-te
												</Link>
											</Button>
										</div>
									</div>
								</div>
							</li>
						);
					})}
				</ul>
			</div>
		</div>
	);

	// Center items when fewer than 4 to avoid overly spaced layout
	const wrapperClass =
		prepared.length < 4 ? "md:max-w-4xl lg:max-w-5xl mx-auto" : "mx-auto";

	return (
		<section aria-label="Propers tornejos" className={`w-full ${wrapperClass}`}>
			{Vertical}
			{Horizontal}
		</section>
	);
}

export default UpcomingTournamentsTimeline;
