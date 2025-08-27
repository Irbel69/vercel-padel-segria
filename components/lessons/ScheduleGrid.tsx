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
				const isFull = s.status === "full";
				return (
					<Card key={s.id} className="p-3 flex items-center justify-between">
						<div>
							<div className="text-white font-medium">{label}</div>
							<div className="text-white/70 text-sm">
								{s.location} •{" "}
								{s.joinable ? "Admet completar" : "Tancat al grup"}
							</div>
						</div>
						<div>
							{isFull ? (
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
