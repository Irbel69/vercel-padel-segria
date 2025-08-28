"use client";

import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LessonSlotWithBookings {
	id: number;
	start_at: string;
	end_at: string;
	max_capacity: number;
	location: string;
	status: "open" | "full" | "cancelled" | "closed";
	joinable: boolean;
	booking_count?: number;
}

export interface CalendarDay {
	date: Date;
	isCurrentMonth: boolean;
	slots: LessonSlotWithBookings[];
}

interface Props {
	currentDate?: Date;
	onDateChange?: (date: Date) => void;
	onSlotClick?: (slot: LessonSlotWithBookings, date: Date) => void;
	onDayClick?: (day: CalendarDay) => void;
}

export function AdminCalendarView({
	currentDate = new Date(),
	onDateChange,
	onSlotClick,
	onDayClick,
}: Props) {
	const [viewDate, setViewDate] = useState(currentDate);
	const [slots, setSlots] = useState<LessonSlotWithBookings[]>([]);
	const [loading, setLoading] = useState(false);

	// Fetch data for the current month
	useEffect(() => {
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
		const from = startOfMonth.toISOString().slice(0, 10);
		const to = endOfMonth.toISOString().slice(0, 10);

		setLoading(true);
		fetch(`/api/lessons/admin/slots?from=${from}&to=${to}`)
			.then((r) => r.json())
			.then((slotsData) => {
				setSlots(slotsData.slots || []);
			})
			.catch(console.error)
			.finally(() => setLoading(false));
	}, [viewDate]);

	const calendarDays = useMemo(() => {
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

		// Start from Monday of the week containing the first day
		const startDate = new Date(startOfMonth);
		startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7));

		// End on Sunday of the week containing the last day
		const endDate = new Date(endOfMonth);
		endDate.setDate(endDate.getDate() + (6 - ((endDate.getDay() + 6) % 7)));

		const days: CalendarDay[] = [];
		const current = new Date(startDate);

		while (current <= endDate) {
			const dateStr = current.toISOString().slice(0, 10);
			const daySlots = slots.filter((slot) => {
				const slotDate = new Date(slot.start_at).toISOString().slice(0, 10);
				return slotDate === dateStr;
			});

			// Just use day slots; legacy rules removed
			const enrichedSlots = daySlots;

			days.push({
				date: new Date(current),
				isCurrentMonth: current.getMonth() === viewDate.getMonth(),
				slots: enrichedSlots,
			});

			current.setDate(current.getDate() + 1);
		}

		return days;
	}, [viewDate, slots]);

	const navigateMonth = (direction: "prev" | "next") => {
		const newDate = new Date(viewDate);
		newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
		setViewDate(newDate);
		onDateChange?.(newDate);
	};

	const getSlotStatusColor = (slot: LessonSlotWithBookings) => {
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

	// Overrides removed

	if (loading) {
		return (
			<div className="flex items-center justify-center h-96">
				<div className="text-white/70">Carregant calendari...</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Header */}
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

			{/* Calendar Grid */}
			<div className="grid grid-cols-7 gap-1">
				{/* Day Headers */}
				{["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((day) => (
					<div
						key={day}
						className="p-2 text-center text-sm font-medium text-white/60">
						{day}
					</div>
				))}

				{/* Calendar Days */}
				{calendarDays.map((day, index) => (
					<Card
						key={index}
						className={cn(
							"relative min-h-24 p-2 cursor-pointer transition-colors hover:bg-white/5",
							!day.isCurrentMonth && "opacity-50",
							day.date.toDateString() === new Date().toDateString() &&
								"ring-1 ring-blue-400"
						)}
						onClick={() => onDayClick?.(day)}>
						{/* Date number */}
						<div className="text-sm font-medium text-white mb-1">
							{day.date.getDate()}
						</div>

						{/* override indicator removed */}

						{/* Slots */}
						<div className="space-y-1">
							{day.slots.slice(0, 3).map((slot) => (
								<div
									key={slot.id}
									className={cn(
										"text-xs p-1 rounded cursor-pointer transition-opacity hover:opacity-80",
										getSlotStatusColor(slot)
									)}
									onClick={(e) => {
										e.stopPropagation();
										onSlotClick?.(slot, day.date);
									}}>
									<div className="flex items-center gap-1">
										<Clock className="w-3 h-3" />
										<span>
											{new Date(slot.start_at).toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
									</div>
									{/* rule title removed with rules system */}
								</div>
							))}

							{day.slots.length > 3 && (
								<div className="text-xs text-white/50 px-1">
									+{day.slots.length - 3} més
								</div>
							)}
						</div>

						{/* override info removed */}
					</Card>
				))}
			</div>

			{/* Legend */}
			<div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
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
				{/* override legend removed */}
			</div>
		</div>
	);
}
