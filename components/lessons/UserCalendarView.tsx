"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonSlot } from "@/types/lessons";
import { BookingDialog } from "@/components/lessons/BookingDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import DaySlotsSheet from "@/components/lessons/DaySlotsSheet";
import DaySlotsPanel from "@/components/lessons/DaySlotsPanel";

interface CalendarDay {
	date: Date;
	isCurrentMonth: boolean;
	slots: LessonSlot[];
}

export default function UserCalendarView() {
	const [viewDate, setViewDate] = useState(new Date());
	const [slots, setSlots] = useState<LessonSlot[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const isMobile = useIsMobile();
	const [sheetOpen, setSheetOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [panelOpen, setPanelOpen] = useState(false);

	useEffect(() => {
		// Helper to format local date as YYYY-MM-DD (no UTC conversion)
		const fmt = (d: Date) => {
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, "0");
			const day = String(d.getDate()).padStart(2, "0");
			return `${y}-${m}-${day}`;
		};
		const startOfMonth = new Date(
			viewDate.getFullYear(),
			viewDate.getMonth(),
			1
		);
		const endOfMonth = new Date(
			viewDate.getFullYear(),
			viewDate.getMonth() + 1,
			0
		);
		const from = fmt(startOfMonth);
		const to = fmt(endOfMonth);

		setLoading(true);
		setError(null);
		fetch(`/api/lessons/slots?from=${from}&to=${to}`)
			.then((r) => r.json())
			.then((json) => setSlots(json.slots ?? []))
			.catch((e) => setError(e?.message ?? "Error carregant slots"))
			.finally(() => setLoading(false));
	}, [viewDate]);

	const calendarDays = useMemo(() => {
		const fmt = (d: Date) => {
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, "0");
			const day = String(d.getDate()).padStart(2, "0");
			return `${y}-${m}-${day}`;
		};
		const startOfMonth = new Date(
			viewDate.getFullYear(),
			viewDate.getMonth(),
			1
		);
		const endOfMonth = new Date(
			viewDate.getFullYear(),
			viewDate.getMonth() + 1,
			0
		);

		const startDate = new Date(startOfMonth);
		startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7));

		const endDate = new Date(endOfMonth);
		endDate.setDate(endDate.getDate() + (6 - ((endDate.getDay() + 6) % 7)));

		const days: CalendarDay[] = [];
		const current = new Date(startDate);

		while (current <= endDate) {
			const dateStr = fmt(current);
			const daySlots = slots.filter((slot) => {
				const s = new Date(slot.start_at);
				const slotDate = fmt(s);
				return slotDate === dateStr;
			});

			days.push({
				date: new Date(current),
				isCurrentMonth: current.getMonth() === viewDate.getMonth(),
				slots: daySlots,
			});

			current.setDate(current.getDate() + 1);
		}

		return days;
	}, [viewDate, slots]);

	const navigateMonth = (direction: "prev" | "next") => {
		const newDate = new Date(viewDate);
		newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
		setViewDate(newDate);
	};

	const getSlotStatusColor = (slot: LessonSlot) => {
		if (slot.user_booked) {
			// Primary color for user's own bookings
			return "bg-blue-500/30 text-blue-200 ring-1 ring-blue-400/40";
		}
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
	};

	const getDayIndicator = (day: CalendarDay) => {
		// Priority: booked > open > full > cancelled
		if (day.slots.some((s) => s.user_booked)) return "bg-blue-400";
		if (day.slots.some((s) => s.status === "open")) return "bg-green-400";
		if (day.slots.some((s) => s.status === "full")) return "bg-yellow-400";
		if (day.slots.some((s) => s.status === "cancelled")) return "bg-red-400";
		return null;
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-96">
				<div className="text-white/70">Carregant calendari...</div>
			</div>
		);
	}

	if (error) {
		return <div className="text-red-400">{error}</div>;
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold text-white">
					{viewDate.toLocaleDateString("es-ES", {
						month: "long",
						year: "numeric",
					})}
				</h2>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => navigateMonth("prev")}>
						<ChevronLeft className="w-4 h-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setViewDate(new Date())}>
						Avui
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => navigateMonth("next")}>
						<ChevronRight className="w-4 h-4" />
					</Button>
				</div>
			</div>

			<div
				className={cn(
					"grid grid-cols-7 gap-1",
					isMobile && "w-full max-w-full overflow-x-clip"
				)}>
				{["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((day) => (
					<div
						key={day}
						className={cn(
							"p-2 text-center font-medium text-white/60",
							isMobile ? "text-[11px]" : "text-sm"
						)}>
						{day}
					</div>
				))}

				{calendarDays.map((day, index) => (
					<Card
						key={index}
						className={cn(
							"relative p-2 transition-colors hover:bg-white/5 cursor-pointer",
							isMobile ? "min-h-[56px]" : "min-h-24",
							!day.isCurrentMonth && "opacity-50",
							day.date.toDateString() === new Date().toDateString() &&
								"ring-1 ring-blue-400"
						)}
						onClick={() => {
							setSelectedDate(day.date);
							if (isMobile) {
								setSheetOpen(true);
							} else {
								setPanelOpen(true);
							}
						}}>
						<div className="text-sm font-medium text-white mb-1">
							{day.date.getDate()}
						</div>

						{isMobile ? (
							// Mobile: indicator only
							<div className="absolute right-1 bottom-1">
								{(() => {
									const color = getDayIndicator(day);
									if (!color) return null;
									return (
										<div
											className={cn("h-1.5 w-1.5 rounded-full", color)}
											aria-label={`${day.slots.length} classes`}
										/>
									);
								})()}
							</div>
						) : (
							// Desktop: show slot chips as before
							<div className="space-y-1">
								{day.slots.slice(0, 4).map((slot) => {
									const timeLabel = new Date(slot.start_at).toLocaleTimeString(
										[],
										{
											hour: "2-digit",
											minute: "2-digit",
										}
									);
									const isBookable =
										slot.status === "open" && !slot.user_booked;
									return (
										<div key={slot.id} className="flex items-center gap-1">
											{isBookable ? (
												<BookingDialog
													slotId={slot.id}
													trigger={
														<button
															className={cn(
																"w-full text-left text-xs p-1 rounded cursor-pointer transition-opacity hover:opacity-80",
																getSlotStatusColor(slot)
															)}
															aria-label={`Apuntar-me ${timeLabel}`}
															onClick={(e) => e.stopPropagation()}>
															<div className="flex items-center gap-1 justify-between">
																<div className="flex items-center gap-1">
																	<Clock className="w-3 h-3" />
																	<span>{timeLabel}</span>
																</div>
																{typeof slot.participants_count ===
																	"number" && (
																	<div className="flex items-center gap-1 text-[11px]">
																		<Users className="w-3 h-3" />
																		<span>
																			{slot.participants_count}/
																			{slot.max_capacity}
																		</span>
																	</div>
																)}
															</div>
														</button>
													}
												/>
											) : (
												<div
													className={cn(
														"w-full text-left text-xs p-1 rounded",
														getSlotStatusColor(slot)
													)}
													onClick={(e) => e.stopPropagation()}>
													<div className="flex items-center gap-1 justify-between">
														{slot.user_booked ? (
															<>
																<Check className="w-3 h-3" />
																<span>{timeLabel} · Reservada per tu</span>
															</>
														) : (
															<>
																<Clock className="w-3 h-3" />
																<span>
																	{timeLabel} ·{" "}
																	{slot.status === "full"
																		? "Complet"
																		: slot.status === "cancelled"
																		? "Cancel·lat"
																		: "Tancat"}
																</span>
															</>
														)}
														{typeof slot.participants_count === "number" && (
															<div className="flex items-center gap-1 text-[11px]">
																<Users className="w-3 h-3" />
																<span>
																	{slot.participants_count}/{slot.max_capacity}
																</span>
															</div>
														)}
													</div>
												</div>
											)}
										</div>
									);
								})}

								{day.slots.length > 4 && (
									<div className="text-xs text-white/50 px-1">
										+{day.slots.length - 4} més
									</div>
								)}
							</div>
						)}
					</Card>
				))}
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
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
					<div className="w-3 h-3 rounded bg-blue-500/30 ring-1 ring-blue-400/40"></div>
					<span className="text-white/70">Reservada per tu</span>
				</div>
			</div>

			{/* Mobile day slots sheet */}
			{isMobile && (
				<DaySlotsSheet
					open={sheetOpen}
					onOpenChange={setSheetOpen}
					date={selectedDate}
					slots={(() => {
						const fmt = (d: Date) => {
							const y = d.getFullYear();
							const m = String(d.getMonth() + 1).padStart(2, "0");
							const day = String(d.getDate()).padStart(2, "0");
							return `${y}-${m}-${day}`;
						};
						return selectedDate
							? slots.filter(
									(s) => fmt(new Date(s.start_at)) === fmt(selectedDate)
							  )
							: [];
					})()}
				/>
			)}

			{/* Desktop side panel */}
			{!isMobile && (
				<DaySlotsPanel
					open={panelOpen}
					onOpenChange={setPanelOpen}
					date={selectedDate}
					slots={(() => {
						const fmt = (d: Date) => {
							const y = d.getFullYear();
							const m = String(d.getMonth() + 1).padStart(2, "0");
							const day = String(d.getDate()).padStart(2, "0");
							return `${y}-${m}-${day}`;
						};
						return selectedDate
							? slots.filter(
									(s) => fmt(new Date(s.start_at)) === fmt(selectedDate)
							  )
							: [];
					})()}
				/>
			)}
		</div>
	);
}
