"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import {
	AdminCalendarView,
	CalendarDay,
	LessonSlotWithBookings,
} from "@/components/lessons/AdminCalendarView";
import ScheduleBuilder from "@/components/lessons/ScheduleBuilder";
import DayEditorDialog from "@/components/lessons/DayEditorDialog";
import AdminSlotDetailDialog from "@/components/lessons/AdminSlotDetailDialog";

export default function ImprovedAdminLessonsPage() {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [dayEditorOpen, setDayEditorOpen] = useState(false);
	const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [slotDetailOpen, setSlotDetailOpen] = useState(false);
	const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
	// Legacy rules and overrides removed

	const handleSlotClick = (slot: LessonSlotWithBookings, date: Date) => {
		setSelectedSlotId(slot.id);
		setSlotDetailOpen(true);
	};

	const handleDayClick = (day: CalendarDay) => {
		setSelectedDay(day);
		setDayEditorOpen(true);
	};

	const handleScheduleCheck = async (payload: any) => {
		const res = await fetch("/api/lessons/admin/schedules/check-conflicts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		return await res.json();
	};
	const handleScheduleApply = async (payload: any) => {
		const res = await fetch("/api/lessons/admin/schedules/apply", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		const json = await res.json();
		// Return ok flag along with json to help client components show friendly toasts
		return { ok: res.ok, ...json };
	};

	return (
		<div className="space-y-6 overflow-x-hidden">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-white">Gestió de Classes</h1>
				<Button variant="secondary" onClick={() => window.location.reload()}>
					<RefreshCw className="w-4 h-4 mr-2" /> Refrescar
				</Button>
			</div>

			<Tabs defaultValue="calendar" className="w-full">
				<TabsList className="grid grid-cols-2 w-full">
					<TabsTrigger value="calendar">Calendari</TabsTrigger>
					<TabsTrigger value="rules">Patró</TabsTrigger>
				</TabsList>

				<TabsContent value="calendar" className="mt-4">
					<AdminCalendarView
						key={refreshKey}
						currentDate={currentDate}
						onDateChange={setCurrentDate}
						onSlotClick={handleSlotClick}
						onDayClick={handleDayClick}
					/>

					<AdminSlotDetailDialog
						slotId={selectedSlotId}
						open={slotDetailOpen}
						onOpenChange={(o) => setSlotDetailOpen(o)}
					/>

					<DayEditorDialog
						open={dayEditorOpen}
						onOpenChange={(o) => {
							setDayEditorOpen(o);
							if (!o) setSelectedDay(null);
						}}
						day={selectedDay}
						onSaved={() => {
							setDayEditorOpen(false);
							setSelectedDay(null);
							setRefreshKey((k) => k + 1);
						}}
					/>
				</TabsContent>

				<TabsContent value="rules" className="mt-4 space-y-4">
					<ScheduleBuilder
						onCheckConflicts={handleScheduleCheck}
						onApply={handleScheduleApply}
					/>
				</TabsContent>
			</Tabs>

			{loading && <div className="text-white/70">Processant...</div>}
			{error && <div className="text-red-400">{error}</div>}
		</div>
	);
}
