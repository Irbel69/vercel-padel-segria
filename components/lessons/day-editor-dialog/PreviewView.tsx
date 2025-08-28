"use client";

import { Card } from "@/components/ui/card";
import type {
	CalendarDay,
	LessonSlotWithBookings,
} from "@/components/lessons/AdminCalendarView";
import { minutesBetween } from "./utils";

type Props = {
	day: CalendarDay | null;
	previewItems: Array<any>;
};

export default function PreviewView({ day, previewItems }: Props) {
	if (!day) return null;
	return (
		<div className="space-y-3">
			<div className="text-white/80">
				{day.slots.length} classes programades
			</div>
			<div className="space-y-2">
				{previewItems.map((it, i) =>
					it.kind === "lesson" ? (
						<Card
							key={it.slot?.id ?? `lesson-${i}`}
							className="p-2 text-sm text-white/90 flex flex-wrap items-center gap-3">
							<span>
								{it.start.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</span>
							<span>—</span>
							<span>
								{it.end.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</span>
							<span className="sm:ml-auto">
								Capacitat: {it.slot?.max_capacity}
							</span>
						</Card>
					) : (
						<Card
							key={`break-${i}`}
							className="p-2 text-sm text-white/70 flex flex-wrap items-center gap-3 bg-white/5 border border-white/5">
							<span>
								{it.start.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</span>
							<span>—</span>
							<span>
								{it.end.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</span>
							<span className="sm:ml-auto">
								Pausa · {minutesBetween(it.start, it.end)} min
							</span>
						</Card>
					)
				)}
			</div>
			<div className="pt-2">{/* Consumer should show the edit button */}</div>
		</div>
	);
}
