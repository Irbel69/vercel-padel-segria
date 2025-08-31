"use client";

import { useEffect, useState } from "react";
import type { UserLessonBookingItem } from "@/types/lessons";
import { Card } from "@/components/ui/card";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Modal from "@/components/Modal";

export default function UpcomingBookingsList() {
	const [items, setItems] = useState<UserLessonBookingItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		const fetchBookings = async () => {
			setLoading(true);
			setError(null);
			try {
				const today = new Date().toISOString().slice(0, 10);
				const r = await fetch(`/api/lessons/user/bookings?from=${today}`);
				const json = await r.json();
				if (!mounted) return;
				setItems(json.bookings ?? []);
			} catch (e: any) {
				if (mounted) {
					setError(e?.message ?? "Error carregant reserves");
				}
			} finally {
				// Don't return from finally; only update state when component is still mounted
				if (mounted) {
					setLoading(false);
				}
			}
		};

		fetchBookings();

		const onBooked = () => fetchBookings();
		window.addEventListener("lesson:booked", onBooked);

		return () => {
			mounted = false;
			window.removeEventListener("lesson:booked", onBooked);
		};
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
				// Notify listeners about the booking change; ignore dispatch errors
				try {
					window.dispatchEvent(new CustomEvent("lesson:booked"));
				} catch (dispatchErr) {
					// If dispatching fails in some environments, just log for diagnostics
					// (kept minimal to satisfy lint rules)
					// console.debug('dispatch lesson:booked failed', dispatchErr);
				}
		} catch (err: any) {
			// rollback
			setItems(prev);
			toast.error("No s'ha pogut cancel·lar la reserva");
		}
	};

	// UI state for confirmation modal
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [toCancelId, setToCancelId] = useState<number | null>(null);

	const openConfirm = (id: number) => {
		setToCancelId(id);
		setConfirmOpen(true);
	};

	const confirmCancel = async () => {
		if (!toCancelId) return;
		setConfirmOpen(false);
		await handleCancel(toCancelId);
		setToCancelId(null);
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
							{/* parent needs min-w-0 so children can shrink/truncate correctly */}
							<div className="flex items-center justify-between gap-3 min-w-0">
								{/* date/time block: prevent wrap, allow truncation and responsive sizing */}
								<div className="flex items-center gap-3 whitespace-nowrap min-w-0">
									<CalendarDays className="w-4 h-4 text-white/70" />
									<span className="text-white font-medium text-xs md:text-sm truncate">{dateLabel}</span>
									<span className="text-white/70">•</span>
									<Clock className="w-4 h-4 text-white/70" />
									<span className="text-white/80 text-xs md:text-sm truncate">{timeLabel}</span>
								</div>
								<div className="flex items-center gap-2 text-white/70 min-w-0">
									<MapPin className="w-4 h-4" />
									<span className="truncate">{b.slot.location}</span>
								</div>
							</div>
							<div className="mt-1 text-xs text-white/60">
								{b.group_size} persona{b.group_size !== 1 ? "s" : ""} · Estat:{" "}
								{(() => {
									// map backend status to Catalan label
									switch (b.status) {
										case "cancelled":
											return (
												<span className="text-red-400 font-medium">
													Cancel·lat
												</span>
											);
										case "confirmed":
											return (
												<span className="text-green-300 font-medium">
													Actiu
												</span>
											);
										default:
											return <span className="text-white/80">{b.status}</span>;
									}
								})()}
							</div>
							{b.status !== "cancelled" && (
								<div className="mt-2 flex justify-end">
									<Button
										variant="outline"
										size="sm"
										onClick={() => openConfirm(b.booking_id)}
										className="bg-white/10 border-white/20 text-white hover:bg-white/20">
										Cancel·lar
									</Button>
								</div>
							)}
						</Card>
					);
				})}
			{/** Confirmation modal */}
			<Modal
				isModalOpen={confirmOpen}
				setIsModalOpen={setConfirmOpen}
				title="Confirmar cancel·lació">
				<div className="space-y-4">
					<p>Segur que vols cancel·lar aquesta reserva?</p>
					<div className="flex gap-2 justify-end">
						<Button
							size="sm"
							variant="ghost"
							onClick={() => setConfirmOpen(false)}>
							No
						</Button>
						<Button size="sm" onClick={confirmCancel} className="bg-red-600">
							Sí, cancel·lar
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
