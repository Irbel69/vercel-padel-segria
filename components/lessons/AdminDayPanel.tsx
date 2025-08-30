"use client";

import { useMemo } from "react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Clock, Users, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type {
	CalendarDay,
	LessonSlotWithBookings,
} from "@/components/lessons/AdminCalendarView";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	day: CalendarDay | null;
	onEdit?: (day: CalendarDay) => void;
	onSlotClick?: (slot: LessonSlotWithBookings, date: Date) => void;
};

function slotStatusColor(slot: LessonSlotWithBookings) {
	const isPast = new Date(slot.start_at).getTime() < Date.now();
	if (isPast) return "bg-gray-500/20 text-gray-300 opacity-70";
	switch (slot.status) {
		case "open":
			return "bg-green-500/20 text-green-300";
		case "full":
			return "bg-yellow-500/20 text-yellow-300";
		case "cancelled":
			return "bg-red-500/20 text-red-300";
		case "closed":
			return "bg-gray-500/20 text-gray-300";
		default:
			return "bg-blue-500/20 text-blue-300";
	}
}

export default function AdminDayPanel({
	open,
	onOpenChange,
	day,
	onEdit,
	onSlotClick,
}: Props) {
	const isMobile = useIsMobile();

	const title = useMemo(() => {
		if (!day) return "";
		return day.date.toLocaleDateString("es-ES", {
			weekday: "long",
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	}, [day]);

	// Build a combined list of lesson slots + inferred pauses between them
	const items = useMemo(() => {
		if (!day)
			return [] as Array<
				| {
						kind: "lesson";
						slot: LessonSlotWithBookings;
						start: Date;
						end: Date;
				  }
				| { kind: "break"; start: Date; end: Date }
			>;
		const sorted = [...day.slots].sort(
			(a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
		);
		const out: Array<
			| { kind: "lesson"; slot: LessonSlotWithBookings; start: Date; end: Date }
			| { kind: "break"; start: Date; end: Date }
		> = [];
		for (let i = 0; i < sorted.length; i++) {
			const s = sorted[i];
			const start = new Date(s.start_at);
			const end = new Date(s.end_at);
			out.push({ kind: "lesson", slot: s, start, end });
			if (i < sorted.length - 1) {
				const nextStart = new Date(sorted[i + 1].start_at);
				if (nextStart.getTime() > end.getTime()) {
					out.push({ kind: "break", start: end, end: nextStart });
				}
			}
		}
		return out;
	}, [day]);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side={isMobile ? "bottom" : "right"}
				className={cn(
					isMobile ? "h-[70vh]" : "w-[380px] sm:w-[440px] md:w-[520px]",
					"overflow-y-auto"
				)}>
				<SheetHeader className="flex flex-row items-center justify-between">
					<SheetTitle className="capitalize">
						{title || "Selecciona un dia"}
					</SheetTitle>
				</SheetHeader>

				<div className="mt-4 space-y-2">
					{!day || items.length === 0 ? (
						<div className="text-white/70 text-sm">
							No hi ha classes per a aquest dia.
						</div>
					) : (
						items.map((item, idx) => {
							if (item.kind === "break") {
								const label = `${item.start.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})} – ${item.end.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})}`;
								return (
									<div
										key={`break-${idx}`}
										className={cn(
											"w-full text-left text-sm p-2 rounded border border-amber-400/20",
											"bg-amber-500/15 text-amber-300"
										)}>
										<div className="flex items-center gap-2 justify-between">
											<div className="flex items-center gap-2">
												<PauseCircle className="w-4 h-4" />
												<span className="font-medium">Pausa</span>
											</div>
											<span className="text-amber-200/90 text-xs">{label}</span>
										</div>
									</div>
								);
							}
							const start = item.start;
							const end = item.end;
							const startTime = start.toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
							});
							const durationMinutes = Math.round(
								(end.getTime() - start.getTime()) / 60000
							);
							const durationLabel =
								durationMinutes >= 60
									? `${Math.floor(durationMinutes / 60)}h${
											durationMinutes % 60 ? ` ${durationMinutes % 60}m` : ""
									  }`
									: `${durationMinutes}m`;
							const slot = item.slot;
							return (
								<button
									key={slot.id}
									className={cn(
										"w-full text-left text-sm p-2 rounded transition-opacity hover:opacity-80",
										slotStatusColor(slot)
									)}
									onClick={(e) => {
										e.stopPropagation();
										onSlotClick?.(slot, day.date);
									}}>
									<div className="flex items-center gap-2 justify-between">
										<div className="flex items-center gap-2">
											<Clock className="w-4 h-4" />
											<div>
												<span>
													{startTime} · {durationLabel}
												</span>
											</div>
										</div>
										{typeof slot.participants_count === "number" && (
											<div className="flex items-center gap-1 text-xs">
												<Users className="w-4 h-4" />
												<span>
													{slot.participants_count}/{slot.max_capacity}
												</span>
											</div>
										)}
									</div>
								</button>
							);
						})
					)}

					<div className="pt-3 grid grid-cols-2 gap-2 text-xs">
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded bg-green-500/20"></div>
							<span className="text-white/70">Disponible</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded bg-yellow-500/20"></div>
							<span className="text-white/70">Complet</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded bg-red-500/20"></div>
							<span className="text-white/70">Cancel·lat</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-400/20"></div>
							<span className="text-white/70">Pausa</span>
						</div>
					</div>

					{/* Edit button moved to bottom to avoid overlapping the close icon */}
					{day && (
						<div className="pt-4">
							<div className="flex justify-end">
								<Button
									size="sm"
									onClick={() => {
										onEdit?.(day);
									}}>
									Editar
								</Button>
							</div>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
