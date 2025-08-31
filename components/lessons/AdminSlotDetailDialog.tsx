"use client";

import { useEffect, useMemo, useState } from "react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Users, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

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
	payment_type?: "direct_debit" | "bizum" | "cash";
	direct_debit?: {
		iban?: string | null;
		holder_name?: string | null;
		holder_address?: string | null;
		holder_dni?: string | null;
		is_authorized?: boolean;
	} | null;
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
	const isMobile = useIsMobile();

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

	// Derived UI data
	const confirmedGroups = useMemo(() => {
		return bookings
			.filter((b) => b.status === "confirmed")
			.map((b) => {
				const primaryParticipant = b.participants?.find((p) => p.is_primary);
				const primaryName =
					primaryParticipant?.name ||
					b.user?.name ||
					b.user?.email ||
					"Sense nom";
				const companions = (b.participants || []).filter((p) => !p.is_primary);
				return {
					id: b.id,
					primaryName,
					companions,
					groupSize: b.group_size,
					payment_type: b.payment_type,
					user_phone: b.user?.phone || null,
					direct_debit: b.direct_debit || null,
				} as const;
			});
	}, [bookings]);

	const historyItems = useMemo(() => {
		return [...bookings].sort(
			(a, b) =>
				new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		);
	}, [bookings]);

	const confirmedCount = useMemo(() => {
		return bookings
			.filter((b) => b.status === "confirmed")
			.reduce((sum, b) => sum + (b.group_size || 0), 0);
	}, [bookings]);

	async function cancelBooking(bookingId: number) {
		if (!bookingId) return;
		try {
			setLoading(true);
			setError(null);
			const res = await fetch(`/api/lessons/admin/bookings/${bookingId}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				const j = await res.json().catch(() => ({}));
				throw new Error(j.error || `Error ${res.status}`);
			}
			// Refresh bookings list
			if (slotId) {
				const r = await fetch(`/api/lessons/admin/slots/${slotId}/bookings`);
				const j = await r.json();
				setBookings(j.bookings || []);
				setParticipantsCount(j.participants_count || 0);
			}
		} catch (e: any) {
			setError(e?.message ?? "Error cancel·lant la reserva");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side={isMobile ? "bottom" : "right"}
				className={cn(
					isMobile ? "h-[75vh]" : "w-[380px] sm:w-[460px] md:w-[520px]",
					"overflow-y-auto"
				)}>
				<SheetHeader>
					<SheetTitle className="flex items-center gap-2">
						Reserves de la classe
						<span className="ml-auto text-sm text-white/70 flex items-center gap-1">
							<Users className="w-4 h-4" /> {confirmedCount}
						</span>
					</SheetTitle>
				</SheetHeader>

				{loading && <div className="mt-4 text-white/70">Carregant…</div>}
				{error && <div className="mt-4 text-red-400">{error}</div>}

				{!loading && !error && (
					<div className="mt-4 space-y-6">
						{/* Confirmed attendees grouped */}
						<div>
							<div className="text-sm font-medium text-white mb-2">
								Inscrits
							</div>
							{confirmedGroups.length === 0 ? (
								<div className="text-white/60 text-sm">
									No hi ha inscrits confirmats.
								</div>
							) : (
								<div className="space-y-2">
									{confirmedGroups.map((g) => (
										<div
											key={g.id}
											className="rounded-md border border-white/10 p-3">
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0">
													<div className="text-white font-medium truncate">
														{g.primaryName}
													</div>
													{g.companions.length > 0 ? (
														<div className="text-white/80 text-xs mt-1">
															<span className="uppercase tracking-wide text-[10px] mr-1 text-white/60">
																Grup:
															</span>
															{g.companions.map((c) => c.name).join(", ")}
														</div>
													) : (
														<div className="text-white/60 text-xs mt-1">
															Individual
														</div>
													)}
													{/* Payment info for confirmed inscription */}
													{g.payment_type && (
														<div className="mt-2">
															{g.payment_type === "cash" ? (
																<div className="inline-flex items-center rounded bg-white/10 px-2 py-0.5 text-[11px] text-white/80">
																	Pagament: Efectiu
																</div>
															) : g.payment_type === "bizum" ? (
																<Accordion type="single" collapsible>
																	<AccordionItem value={`g-bizum-${g.id}`}>
																		<AccordionTrigger className="text-xs text-white/80">
																			Pagament: Bizum
																		</AccordionTrigger>
																		<AccordionContent>
																			<div className="text-xs text-white/80 space-y-1">
																				<div>
																					<span className="text-white/60">
																						Telèfon titular:{" "}
																					</span>
																					<span>{g.user_phone || "—"}</span>
																				</div>
																			</div>
																		</AccordionContent>
																	</AccordionItem>
																</Accordion>
															) : g.payment_type === "direct_debit" ? (
																<Accordion type="single" collapsible>
																	<AccordionItem value={`g-dd-${g.id}`}>
																		<AccordionTrigger className="text-xs text-white/80">
																			Pagament: Rebut bancari
																		</AccordionTrigger>
																		<AccordionContent>
																			<div className="text-xs text-white/80 space-y-1">
																				<div>
																					<span className="text-white/60">
																						IBAN:{" "}
																					</span>
																					<span className="font-mono break-all">
																						{g.direct_debit?.iban || "—"}
																					</span>
																				</div>
																				<div>
																					<span className="text-white/60">
																						Titular:{" "}
																					</span>
																					<span>
																						{g.direct_debit?.holder_name || "—"}
																					</span>
																				</div>
																				<div>
																					<span className="text-white/60">
																						Adreça:{" "}
																					</span>
																					<span>
																						{g.direct_debit?.holder_address ||
																							"—"}
																					</span>
																				</div>
																				<div>
																					<span className="text-white/60">
																						DNI:{" "}
																					</span>
																					<span>
																						{g.direct_debit?.holder_dni || "—"}
																					</span>
																				</div>
																			</div>
																		</AccordionContent>
																	</AccordionItem>
																</Accordion>
															) : null}
														</div>
													)}
													<div className="mt-3">
														<Button
															variant="destructive"
															size="sm"
															onClick={() => cancelBooking(g.id)}
															className="h-7"
															title="Cancel·lar reserva">
															<XCircle className="w-4 h-4 mr-1" />
															Cancel·lar
														</Button>
													</div>
												</div>
												<div className="text-xs text-white/70 flex items-center gap-1 whitespace-nowrap">
													<Users className="w-3 h-3" /> {g.groupSize}
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						<Separator />

						{/* History of bookings and cancellations */}
						<div>
							<div className="text-sm font-medium text-white mb-2">
								Historial
							</div>
							{historyItems.length === 0 ? (
								<div className="text-white/60 text-sm">Sense moviments.</div>
							) : (
								<div className="space-y-2">
									{historyItems.map((b) => {
										const created = new Date(b.created_at);
										const label = created.toLocaleString([], {
											day: "2-digit",
											month: "2-digit",
											year: "2-digit",
											hour: "2-digit",
											minute: "2-digit",
										});
										return (
											<div
												key={b.id}
												className={cn(
													"rounded-md border p-3",
													b.status === "cancelled"
														? "border-red-400/20 bg-red-500/10"
														: "border-white/10 bg-white/5"
												)}>
												<div className="flex items-start justify-between gap-2">
													<div className="min-w-0">
														<div className="text-white font-medium truncate">
															{b.user?.name || b.user?.email}
														</div>
														<div className="text-xs text-white/70 mt-1 flex items-center gap-2">
															<span
																className={cn(
																	"inline-flex items-center px-1.5 py-0.5 rounded",
																	b.status === "cancelled"
																		? "bg-red-500/20 text-red-200"
																		: "bg-green-500/20 text-green-200"
																)}>
																{b.status === "cancelled"
																	? "Cancel·lada"
																	: "Confirmada"}
															</span>
															<span className="flex items-center gap-1 text-white/60">
																<Users className="w-3 h-3" /> {b.group_size}
															</span>
														</div>
													</div>
													<div className="text-xs text-white/60 flex items-center gap-1 whitespace-nowrap">
														<Clock className="w-3 h-3" /> {label}
													</div>
												</div>

												{b.participants?.length > 0 && (
													<div className="mt-2 text-xs text-white/80">
														<span className="uppercase tracking-wide text-[10px] mr-1 text-white/60">
															Noms:
														</span>
														{b.participants.map((p) => p.name).join(", ")}
													</div>
												)}

												{/* Payment details accordion (admin only view) */}
												{b.payment_type && (
													<div className="mt-2">
														<Accordion type="single" collapsible>
															<AccordionItem value={`payment-${b.id}`}>
																<AccordionTrigger className="text-xs text-white/80">
																	Pagament:{" "}
																	{b.payment_type === "direct_debit"
																		? "Rebut bancari"
																		: b.payment_type === "bizum"
																		? "Bizum"
																		: "Efectiu"}
																</AccordionTrigger>
																<AccordionContent>
																	{b.payment_type === "direct_debit" ? (
																		<div className="text-xs text-white/80 space-y-1">
																			<div>
																				<span className="text-white/60">
																					IBAN:{" "}
																				</span>
																				<span className="font-mono break-all">
																					{b.direct_debit?.iban || "—"}
																				</span>
																			</div>
																			<div>
																				<span className="text-white/60">
																					Titular:{" "}
																				</span>
																				<span>
																					{b.direct_debit?.holder_name || "—"}
																				</span>
																			</div>
																			<div>
																				<span className="text-white/60">
																					Adreça:{" "}
																				</span>
																				<span>
																					{b.direct_debit?.holder_address ||
																						"—"}
																				</span>
																			</div>
																			<div>
																				<span className="text-white/60">
																					DNI:{" "}
																				</span>
																				<span>
																					{b.direct_debit?.holder_dni || "—"}
																				</span>
																			</div>
																			{typeof b.direct_debit?.is_authorized ===
																				"boolean" && (
																				<div>
																					<span className="text-white/60">
																						Autoritzat:{" "}
																					</span>
																					<span
																						className={
																							b.direct_debit.is_authorized
																								? "text-green-300"
																								: "text-yellow-300"
																						}>
																						{b.direct_debit.is_authorized
																							? "Sí"
																							: "Pendent"}
																					</span>
																				</div>
																			)}
																		</div>
																	) : (
																		<div className="text-xs text-white/70">
																			No hi ha dades addicionals per a aquest
																			mètode de pagament.
																		</div>
																	)}
																</AccordionContent>
															</AccordionItem>
														</Accordion>
													</div>
												)}
											</div>
										);
									})}
								</div>
							)}
						</div>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
