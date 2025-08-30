"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLessonSlots } from "@/hooks/use-lessons";
import { BookingDialog } from "@/components/lessons/BookingDialog";

interface Props {
	fromISO?: string;
	toISO?: string;
}

export function ScheduleGrid({ fromISO, toISO }: Props) {
	const { slots, loading, error } = useLessonSlots(fromISO, toISO);

	const items = useMemo(() => slots, [slots]);

	if (loading) return <div className="text-white/70">Carregant horaris…</div>;
	if (error) return <div className="text-red-400">Error: {error}</div>;
	if (!items.length)
		return (
			<div className="text-white/70">
				No hi ha classes disponibles en aquest període.
			</div>
		);

	return (
		<div className="grid gap-3">
			{items.map((s) => {
				const start = new Date(s.start_at);
				const end = new Date(s.end_at);
				const label = `${start.toLocaleDateString()} ${start.toLocaleTimeString(
					[],
					{ hour: "2-digit", minute: "2-digit" }
				)} - ${end.toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				})}`;
				const atCapacity =
					(typeof s.participants_count === "number"
						? s.participants_count
						: 0) >= (s.max_capacity || 0);
				const isLocked = s.joinable === false;
				const isFull = s.status === "full" || atCapacity;
				const showDisabled = isFull || isLocked;
				return (
					<Card key={s.id} className="p-3 flex items-center justify-between">
						<div>
							<div className="text-white font-medium">{label}</div>
							<div className="text-white/70 text-sm">
								{s.location} •{" "}
								{s.joinable ? "Admet completar" : "Tancat al grup"}
								{typeof s.participants_count === "number" &&
									s.max_capacity != null && (
										<span className="ml-2">
											({s.participants_count}/{s.max_capacity})
										</span>
									)}
							</div>
						</div>
						<div>
							{showDisabled ? (
								<Button disabled variant="secondary">
									Complet
								</Button>
							) : (
								<BookingDialog slotId={s.id} />
							)}
						</div>
					</Card>
				);
			})}
		</div>
	);
}
