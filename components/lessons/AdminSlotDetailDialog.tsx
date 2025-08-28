"use client";

import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Users } from "lucide-react";

interface AdminSlotDetailDialogProps {
	slotId?: number | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type SlotBooking = {
	id: number;
	user: {
		id: string;
		name: string | null;
		email: string | null;
		phone?: string | null;
	};
	group_size: number;
	status: string;
	created_at: string;
	participants: { id: number; name: string; is_primary: boolean }[];
};

export default function AdminSlotDetailDialog({
	slotId,
	open,
	onOpenChange,
}: AdminSlotDetailDialogProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [bookings, setBookings] = useState<SlotBooking[]>([]);
	const [participantsCount, setParticipantsCount] = useState<number>(0);

	useEffect(() => {
		if (!open || !slotId) return;
		setLoading(true);
		setError(null);
		fetch(`/api/lessons/admin/slots/${slotId}/bookings`)
			.then((r) => r.json())
			.then((json) => {
				setBookings(json.bookings || []);
				setParticipantsCount(json.participants_count || 0);
			})
			.catch((e) => setError(e?.message ?? "Error carregant reserves"))
			.finally(() => setLoading(false));
	}, [open, slotId]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						Reserves de la classe
						<span className="ml-auto text-sm text-white/70 flex items-center gap-1">
							<Users className="w-4 h-4" /> {participantsCount}
						</span>
					</DialogTitle>
				</DialogHeader>

				{loading && <div className="text-white/70">Carregant…</div>}
				{error && <div className="text-red-400">{error}</div>}

				{!loading && !error && (
					<div className="space-y-3">
						{bookings.length === 0 && (
							<div className="text-white/60 text-sm">
								No hi ha reserves per aquesta classe.
							</div>
						)}

						{bookings.map((b) => (
							<div key={b.id} className="rounded-md border border-white/10 p-3">
								<div className="flex items-center justify-between">
									<div>
										<div className="text-white font-medium">
											{b.user?.name || b.user?.email}
										</div>
										<div className="text-white/60 text-xs">
											{b.user?.email}
											{b.user?.phone ? ` · ${b.user.phone}` : ""}
										</div>
									</div>
									<div className="text-sm text-white/80">
										{b.group_size} persona{b.group_size !== 1 ? "s" : ""} ·{" "}
										{b.status}
									</div>
								</div>
								{b.participants?.length > 0 && (
									<div className="mt-2">
										<Separator className="mb-2" />
										<div className="text-xs text-white/70">Acompanyants</div>
										<ul className="mt-1 list-disc list-inside text-sm text-white/90">
											{b.participants
												.filter((p) => !p.is_primary)
												.map((p) => (
													<li key={p.id}>{p.name}</li>
												))}
										</ul>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
