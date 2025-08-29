"use client";

import { useEffect, useState } from "react";
import type { UserLessonBookingItem } from "@/types/lessons";
import { Card } from "@/components/ui/card";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function UpcomingBookingsList() {
	const [items, setItems] = useState<UserLessonBookingItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setLoading(true);
		setError(null);
		const today = new Date().toISOString().slice(0, 10);
		fetch(`/api/lessons/user/bookings?from=${today}`)
			.then((r) => r.json())
			.then((json) => setItems(json.bookings ?? []))
			.catch((e) => setError(e?.message ?? "Error carregant reserves"))
			.finally(() => setLoading(false));
	}, []);

	const handleCancel = async (bookingId: number) => {
		const prev = items;
		// optimistic remove
		setItems((it) => it.filter((b) => b.booking_id !== bookingId));
		try {
			const res = await fetch(`/api/lessons/bookings/${bookingId}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				const j = await res.json().catch(() => ({}));
				throw new Error(j?.error || `Error ${res.status}`);
			}
			toast.success("Reserva cancel·lada");
		} catch (err: any) {
			// rollback
			setItems(prev);
			toast.error("No s'ha pogut cancel·lar la reserva");
		}
	};

	if (loading) return <div className="text-white/70">Carregant reserves…</div>;
	if (error) return <div className="text-red-400">{error}</div>;

	if (!items.length)
		return (
			<div className="text-white/60 text-sm">No tens cap classe reservada.</div>
		);

	return (
		<div className="grid gap-2">
			{items
				.filter((b) => b.slot && b.slot.start_at)
				.map((b) => {
					const start = new Date(b.slot.start_at);
					const dateLabel = start.toLocaleDateString("es-ES", {
						weekday: "short",
						day: "2-digit",
						month: "short",
					});
					const timeLabel = start.toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					});
					return (
						<Card key={b.booking_id} className="p-3">
							<div className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-3">
									<CalendarDays className="w-4 h-4 text-white/70" />
									<span className="text-white font-medium">{dateLabel}</span>
									<span className="text-white/70">•</span>
									<Clock className="w-4 h-4 text-white/70" />
									<span className="text-white/80">{timeLabel}</span>
								</div>
								<div className="flex items-center gap-2 text-white/70">
									<MapPin className="w-4 h-4" />
									<span>{b.slot.location}</span>
								</div>
							</div>
							<div className="mt-1 text-xs text-white/60">
								{b.group_size} persona{b.group_size !== 1 ? "s" : ""} · Estat:{" "}
								{b.status}
							</div>
							<div className="mt-2 flex justify-end">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleCancel(b.booking_id)}
									className="bg-white/10 border-white/20 text-white hover:bg-white/20">
									Cancel·lar
								</Button>
							</div>
						</Card>
					);
				})}
		</div>
	);
}
