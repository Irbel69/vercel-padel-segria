"use client";

import { useState, useEffect, ReactNode } from "react";
import { useUser } from "@/hooks/use-user";
import { X } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	Sheet,
	SheetContent,
	SheetTrigger,
	SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { CreateBookingPayload, PaymentType } from "@/types/lessons";

export function BookingDialog({
	slotId,
	trigger,
	slotParticipantsCount = 0,
	allowFillPolicy = null,
	slotStatus,
}: {
	slotId: number;
	trigger?: ReactNode;
	slotParticipantsCount?: number;
	allowFillPolicy?: boolean | null;
	slotStatus?: "open" | "full" | "cancelled" | "closed";
}) {
	const [open, setOpen] = useState(false);
	const isMobile = useIsMobile();
	const [groupSize, setGroupSize] = useState<1 | 2 | 3 | 4>(1);
	const [allowFill, setAllowFill] = useState(true);
	const [paymentType, setPaymentType] = useState<PaymentType>("cash");
	const { profile } = useUser();

	// synchronous cached profile for immediate UI fill (set by EnsureUser on page load)
	let parsedCache: { name?: string; surname?: string } | null = null;
	if (typeof window !== "undefined") {
		try {
			const raw = localStorage.getItem("ps_profile_cache");
			parsedCache = raw ? JSON.parse(raw) : null;
		} catch (e) {
			parsedCache = null;
		}
	}

	const firstName = profile?.name ?? parsedCache?.name ?? "";
	const lastName = profile?.surname ?? parsedCache?.surname ?? "";
	const computedPrimaryName = `${firstName}${
		lastName ? ` ${lastName}` : ""
	}`.trim();
	const [participants, setParticipants] = useState<string[]>([]);
	const [observations, setObservations] = useState("");
	const [dd, setDd] = useState({
		iban: "",
		holder_name: "",
		holder_address: "",
		holder_dni: "",
		is_authorized: false,
	});
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isFirst = (slotParticipantsCount || 0) === 0;
	const forceCheckedDisabled =
		(slotParticipantsCount || 0) > 0 && slotStatus === "open";

	const effectiveAllowFill = forceCheckedDisabled
		? true
		: isFirst
		? allowFill
		: Boolean(allowFillPolicy);

	useEffect(() => {
		// When opening or when policy changes, align local state for clarity
		if (forceCheckedDisabled) {
			setAllowFill(true);
		} else if (!isFirst && allowFillPolicy !== null) {
			setAllowFill(Boolean(allowFillPolicy));
		}
	}, [isFirst, allowFillPolicy, forceCheckedDisabled]);

	const handleSubmit = async () => {
		setSubmitting(true);
		setError(null);
		const payload: CreateBookingPayload = {
			slot_id: slotId,
			group_size: groupSize,
			allow_fill: effectiveAllowFill,
			payment_type: paymentType,
			observations,
			// primary_name intentionally omitted: server derives name from authenticated user
			participants: participants.filter(Boolean),
			direct_debit: paymentType === "direct_debit" ? dd : undefined,
		};

		const res = await fetch("/api/lessons/book", {
			method: "POST",
			body: JSON.stringify(payload),
		});
		if (!res.ok) {
			const json = await res.json().catch(() => ({}));
			setError(json?.error || "Error al reservar la classe");
			setSubmitting(false);
			return;
		}
		setSubmitting(false);
		try {
			window.dispatchEvent(new CustomEvent("lesson:booked"));
		} catch (e) {
			// noop (server-side rendering safety if ever invoked there)
		}
	};

	const extraCount = groupSize - 1;
	const extraInputs = Array.from({ length: extraCount }, (_, i) => (
		<Input
			key={i}
			placeholder={`Nom addicional #${i + 1}`}
			value={participants[i] || ""}
			onChange={(e) => {
				const next = [...participants];
				next[i] = e.target.value;
				setParticipants(next);
			}}
		/>
	));

	// On mobile use a full-screen sheet with vertical scrolling enabled.
	if (isMobile) {
		return (
			<Sheet>
				<SheetTrigger asChild>
					{trigger ?? <Button variant="default">Apuntar-me</Button>}
				</SheetTrigger>
				<SheetContent
					side="bottom"
					className="inset-0 h-[100dvh] max-h-[100dvh] overflow-y-auto p-6"
					style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
					// Prevent clicks inside the sheet from bubbling to calendar day cards
					onPointerDown={(e) => e.stopPropagation()}
					onClick={(e) => e.stopPropagation()}>
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold">
							Reserva de classe {slotParticipantsCount} - {slotStatus} -{" "}
							{forceCheckedDisabled}
						</h3>
					</div>

					<div className="mt-4 space-y-4">
						<div className="space-y-2">
							<label className="text-sm text-white/80">Quantes persones?</label>
							<Select
								value={String(groupSize)}
								onValueChange={(v) => setGroupSize(Number(v) as 1 | 2 | 3 | 4)}>
								<SelectTrigger>
									<SelectValue placeholder="Mida del grup" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1">1</SelectItem>
									<SelectItem value="2">2</SelectItem>
									<SelectItem value="3">3</SelectItem>
									<SelectItem value="4">4</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center space-x-2">
							<Checkbox
								id="allowFill"
								checked={
									forceCheckedDisabled
										? true
										: isFirst
										? allowFill
										: Boolean(allowFillPolicy)
								}
								disabled={forceCheckedDisabled || !isFirst}
								onCheckedChange={(v) => {
									if (isFirst) setAllowFill(Boolean(v));
								}}
							/>
							<label htmlFor="allowFill" className="text-sm text-white/80">
								Permetre completar la classe amb altres persones
							</label>
						</div>

						<div className="space-y-2">
							<label className="text-sm text-white/80">Tipus de pagament</label>
							<Select
								value={paymentType}
								onValueChange={(v) => setPaymentType(v as PaymentType)}>
								<SelectTrigger>
									<SelectValue placeholder="Pagament" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="direct_debit">Rebut bancari</SelectItem>
									<SelectItem value="bizum">Bizum</SelectItem>
									<SelectItem value="cash">Efectiu</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{paymentType === "direct_debit" && (
							<div className="grid gap-2">
								<Input
									placeholder="IBAN"
									value={dd.iban}
									onChange={(e) => setDd({ ...dd, iban: e.target.value })}
								/>
								<Input
									placeholder="Nom del titular"
									value={dd.holder_name}
									onChange={(e) =>
										setDd({ ...dd, holder_name: e.target.value })
									}
								/>
								<Input
									placeholder="Adreça"
									value={dd.holder_address}
									onChange={(e) =>
										setDd({ ...dd, holder_address: e.target.value })
									}
								/>
								<Input
									placeholder="DNI"
									value={dd.holder_dni}
									onChange={(e) => setDd({ ...dd, holder_dni: e.target.value })}
								/>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="authDD"
										checked={dd.is_authorized}
										onCheckedChange={(v) =>
											setDd({ ...dd, is_authorized: Boolean(v) })
										}
									/>
									<label htmlFor="authDD" className="text-sm text-white/80">
										Autorització de domiciliació bancària
									</label>
								</div>
							</div>
						)}

						<div className="space-y-2">
							<label className="text-sm text-white/80">Nom del titular</label>
							<Input
								placeholder="El teu nom"
								value={computedPrimaryName}
								readOnly
							/>
						</div>

						{extraInputs.length > 0 && (
							<div className="space-y-2">
								<label className="text-sm text-white/80">
									Noms addicionals
								</label>
								<div className="grid gap-2">{extraInputs}</div>
							</div>
						)}

						<div className="space-y-2">
							<label className="text-sm text-white/80">Observacions</label>
							<Textarea
								placeholder="Qualsevol detall..."
								value={observations}
								onChange={(e) => setObservations(e.target.value)}
							/>
						</div>

						{error && <p className="text-red-400 text-sm">{error}</p>}

						<div className="flex justify-end gap-2">
							<SheetClose asChild>
								<Button variant="ghost" disabled={submitting}>
									Cancel·lar
								</Button>
							</SheetClose>
							<Button onClick={handleSubmit} disabled={submitting}>
								{submitting ? "Processant..." : "Confirmar reserva"}
							</Button>
						</div>
					</div>
				</SheetContent>
			</Sheet>
		);
	}

	// Desktop / fallback: keep the existing dialog popup
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger ?? <Button variant="default">Apuntar-me</Button>}
			</DialogTrigger>
			<DialogContent
				className="max-w-lg"
				// Prevent clicks inside the dialog from bubbling to parent calendar cards
				onPointerDown={(e) => e.stopPropagation()}
				onClick={(e) => e.stopPropagation()}>
				{/* Explicit close button that guarantees the dialog state is updated */}
				<DialogHeader>
					<DialogTitle>Reserva de classe</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm text-white/80">Quantes persones?</label>
						<Select
							value={String(groupSize)}
							onValueChange={(v) => setGroupSize(Number(v) as 1 | 2 | 3 | 4)}>
							<SelectTrigger>
								<SelectValue placeholder="Mida del grup" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="1">1</SelectItem>
								<SelectItem value="2">2</SelectItem>
								<SelectItem value="3">3</SelectItem>
								<SelectItem value="4">4</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							id="allowFill"
							checked={
								forceCheckedDisabled
									? true
									: isFirst
									? allowFill
									: Boolean(allowFillPolicy)
							}
							disabled={forceCheckedDisabled || !isFirst}
							onCheckedChange={(v) => {
								if (isFirst) setAllowFill(Boolean(v));
							}}
						/>
						<label htmlFor="allowFill" className="text-sm text-white/80">
							Permetre completar la classe amb altres persones
						</label>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-white/80">Tipus de pagament</label>
						<Select
							value={paymentType}
							onValueChange={(v) => setPaymentType(v as PaymentType)}>
							<SelectTrigger>
								<SelectValue placeholder="Pagament" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="direct_debit">Rebut bancari</SelectItem>
								<SelectItem value="bizum">Bizum</SelectItem>
								<SelectItem value="cash">Efectiu</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{paymentType === "direct_debit" && (
						<div className="grid gap-2">
							<Input
								placeholder="IBAN"
								value={dd.iban}
								onChange={(e) => setDd({ ...dd, iban: e.target.value })}
							/>
							<Input
								placeholder="Nom del titular"
								value={dd.holder_name}
								onChange={(e) => setDd({ ...dd, holder_name: e.target.value })}
							/>
							<Input
								placeholder="Adreça"
								value={dd.holder_address}
								onChange={(e) =>
									setDd({ ...dd, holder_address: e.target.value })
								}
							/>
							<Input
								placeholder="DNI"
								value={dd.holder_dni}
								onChange={(e) => setDd({ ...dd, holder_dni: e.target.value })}
							/>
							<div className="flex items-center space-x-2">
								<Checkbox
									id="authDD"
									checked={dd.is_authorized}
									onCheckedChange={(v) =>
										setDd({ ...dd, is_authorized: Boolean(v) })
									}
								/>
								<label htmlFor="authDD" className="text-sm text-white/80">
									Autorització de domiciliació bancària
								</label>
							</div>
						</div>
					)}

					<div className="space-y-2">
						<label className="text-sm text-white/80">Nom del titular</label>
						<Input
							placeholder="El teu nom"
							value={computedPrimaryName}
							readOnly
						/>
					</div>

					{extraInputs.length > 0 && (
						<div className="space-y-2">
							<label className="text-sm text-white/80">Noms addicionals</label>
							<div className="grid gap-2">{extraInputs}</div>
						</div>
					)}

					<div className="space-y-2">
						<label className="text-sm text-white/80">Observacions</label>
						<Textarea
							placeholder="Qualsevol detall..."
							value={observations}
							onChange={(e) => setObservations(e.target.value)}
						/>
					</div>

					{error && <p className="text-red-400 text-sm">{error}</p>}

					<div className="flex justify-end gap-2">
						<Button
							variant="ghost"
							onClick={() => setOpen(false)}
							disabled={submitting}>
							Cancel·lar
						</Button>
						<Button onClick={handleSubmit} disabled={submitting}>
							{submitting ? "Processant..." : "Confirmar reserva"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
