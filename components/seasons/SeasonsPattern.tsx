"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Plus, Trash2, Users } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { dayOrder, dayNames, durationMinutes } from "./utils";
import type { Entry } from "./types";

interface Props {
	entries: Entry[];
	startTimes: string[];
	builderOpen: boolean;
	setBuilderOpen: (v: boolean) => void;
	builder: any;
	setBuilder: (b: any) => void;
	building: boolean;
	buildPattern: () => Promise<void>;
	setEntryDialog: (d: { open: boolean; day?: number }) => void;
	deleteEntry: (id: number) => Promise<void>;
	assignments?: any[];
	requests?: any[]; // enrollment requests so sheet can show details
}

export default function SeasonsPattern({
	entries,
	startTimes,
	builderOpen,
	setBuilderOpen,
	builder,
	setBuilder,
	building,
	buildPattern,
	setEntryDialog,
	deleteEntry,
	assignments = [],
	requests = [],
}: Props) {
	const [selectedEntry, setSelectedEntry] = React.useState<number | null>(null);
	const [isMobile, setIsMobile] = React.useState(false);

	React.useEffect(() => {
		const mq = window.matchMedia("(max-width: 640px)");
		const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
			setIsMobile((e as any).matches);
		onChange(mq);
		try {
			mq.addEventListener("change", onChange as any);
		} catch {
			mq.addListener(onChange as any);
		}
		return () => {
			try {
				mq.removeEventListener("change", onChange as any);
			} catch {
				mq.removeListener(onChange as any);
			}
		};
	}, []);

	const sel = selectedEntry
		? entries.find((e) => e.id === selectedEntry) || null
		: null;
	const selAssignments = sel
		? (assignments || []).filter((a: any) => a.entry?.id === sel.id)
		: [];

	function paymentMethodLabel(pm?: string | null) {
		switch (pm) {
			case "direct_debit":
				return "Domiciliació";
			case "cash":
				return "Efectiu";
			case "bizum":
				return "Bizum";
			default:
				return pm || "—";
		}
	}

	function allowFillLabel(allow: boolean) {
		return allow ? "Admet omplir" : "No admet omplir";
	}

	return (
		<>
			<div className="flex gap-2">
				<Button size="sm" onClick={() => setBuilderOpen(true)}>
					<Plus className="h-4 w-4 mr-1" /> Afegir Patró
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Patró</CardTitle>
					<CardDescription>Entrades setmanals</CardDescription>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<div className="min-w-[840px]">
						<div
							className="grid"
							style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}>
							<div />
							{dayOrder.map((d) => (
								<div key={d} className="text-xs font-semibold text-center pb-2">
									{dayNames[d]}
								</div>
							))}

							{startTimes.map((time) => (
								<React.Fragment key={time}>
									<div className="text-[10px] font-mono pr-2 py-1 text-muted-foreground">
										{time}
									</div>
									{dayOrder.map((dayIdx) => {
										const entry = entries.find(
											(e) =>
												e.day_of_week === dayIdx &&
												e.start_time.slice(0, 5) === time
										);
										if (!entry)
											return <div key={dayIdx + time} className="p-1" />;

										const entryAssignments = (assignments || []).filter(
											(a: any) => a.entry?.id === entry.id
										);
										const total = entry.capacity ?? null;
										let remaining: number | null = null;
										if (typeof (entry as any).remaining_capacity === "number") {
											remaining = (entry as any).remaining_capacity;
										} else if (total !== null) {
											const usedFromAssignments = entryAssignments.reduce(
												(s: number, a: any) => s + (a.group_size || 0),
												0
											);
											remaining = Math.max(total - usedFromAssignments, 0);
										}
										const used =
											total !== null && remaining !== null
												? total - remaining
												: null;
										const isFull =
											total !== null && remaining !== null && remaining <= 0;
										const hasRestrictiveAssignment = entryAssignments.some(
											(a: any) => a.allow_fill === false
										);
										const highlightRed = isFull || hasRestrictiveAssignment;
										const reason = hasRestrictiveAssignment
											? "Classe amb participants que han sol·licitat no omplir (no fill)"
											: isFull
											? "Classe plena"
											: "Classe oberta";

										return (
											<div key={entry.id}>
												<div
													onClick={() => setSelectedEntry(entry.id)}
													title={reason}
													className={`relative rounded border p-2 text-[11px] shadow-sm group cursor-pointer ${
														highlightRed
															? "bg-red-500/10 border-red-500/30"
															: entry.kind === "class"
															? "bg-emerald-500/10 border-emerald-500/30"
															: "bg-amber-500/10 border-amber-500/30"
													}`}>
													<div className="flex justify-between items-center mb-1">
														<span className="font-medium">
															{entry.start_time.slice(0, 5)}-
															{entry.end_time.slice(0, 5)}
														</span>
														<Button
															variant="ghost"
															size="icon"
															className="h-5 w-5 opacity-0 group-hover:opacity-100"
															onClick={(e) => {
																e.stopPropagation();
																deleteEntry(entry.id);
															}}>
															<Trash2 className="h-3 w-3" />
														</Button>
													</div>

													<div className="flex justify-between items-center">
														<span>
															{entry.kind === "class" ? (
																<span className="inline-flex items-center gap-2">
																	<Users className="h-4 w-4" />
																	<span
																		className={
																			highlightRed
																				? "text-red-400 font-medium"
																				: "font-medium"
																		}>
																		{used !== null
																			? `${used}/${total}`
																			: total ?? "-"}
																	</span>
																</span>
															) : (
																"Pausa"
															)}
														</span>
														<span className="text-xs text-muted-foreground">
															{durationMinutes(
																entry.start_time,
																entry.end_time
															)}
															'
														</span>
													</div>
												</div>
											</div>
										);
									})}
								</React.Fragment>
							))}

							<div />
							{dayOrder.map((dayIdx) => (
								<div
									key={"plus-" + dayIdx}
									className="flex justify-center py-1">
									<Button
										variant="ghost"
										size="icon"
										aria-label={"Afegir entrada " + dayNames[dayIdx]}
										onClick={() => setEntryDialog({ open: true, day: dayIdx })}>
										<Plus className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			<Sheet
				open={!!sel}
				onOpenChange={(open) => !open && setSelectedEntry(null)}>
				<SheetContent
					side={isMobile ? "bottom" : "right"}
					className={isMobile ? "h-[70vh]" : "w-96"}>
					<div className="flex items-start justify-between">
						<div>
							<div className="text-sm text-muted-foreground">Entrada</div>
							<div className="font-semibold">
								{sel
									? `${dayNames[sel.day_of_week]} ${sel.start_time.slice(
											0,
											5
									  )}-${sel.end_time.slice(0, 5)}`
									: ""}
							</div>
						</div>
					</div>

					{sel && (
						<div>
							<div className="mt-4">
								<div className="text-xs text-muted-foreground">Duració</div>
								<div className="font-medium">
									{durationMinutes(sel.start_time, sel.end_time)}'
								</div>
							</div>

							<div className="mt-4">
								<div className="text-xs text-muted-foreground">Capacitat</div>
								<div className="font-medium">
									{(() => {
										const total = sel.capacity ?? null;
										let remaining: number | null = null;
										if (typeof (sel as any).remaining_capacity === "number")
											remaining = (sel as any).remaining_capacity;
										else if (total !== null) {
											const usedFromAssignments = selAssignments.reduce(
												(s: number, a: any) => s + (a.group_size || 0),
												0
											);
											remaining = Math.max(total - usedFromAssignments, 0);
										}
										const used =
											total !== null && remaining !== null
												? total - remaining
												: null;
										return used !== null ? `${used}/${total}` : total ?? "-";
									})()}
								</div>
							</div>

							<div className="mt-4">
								<div className="font-medium mb-2">Assignacions</div>
								{selAssignments.length === 0 ? (
									<div className="text-xs text-muted-foreground">
										Cap assignació.
									</div>
								) : (
									<div className="space-y-2">
										{selAssignments.map((a: any) => {
											const req =
												(requests || []).find(
													(r: any) => r.id === a.request_id
												) || null;
											return (
												<div
													key={a.id}
													className="p-2 rounded border bg-background/50">
													<div className="font-medium">
														{a.user?.name} {a.user?.surname}
													</div>
													<div className="text-xs text-muted-foreground">
														Email: {a.user?.email}
													</div>
													<div className="text-xs mt-2 flex gap-3">
														<div>Grup: {a.group_size}</div>
														<div
															className={
																a.allow_fill
																	? "bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded"
																	: "bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded"
															}>
															{allowFillLabel(a.allow_fill)}
														</div>
													</div>

													{req && (
														<div className="mt-2 text-[13px]">
															<div className="font-medium">
																Request #{req.id}
															</div>
															<div className="text-xs text-muted-foreground">
																Titular: {req.user?.name || "-"}{" "}
																{req.user?.surname || ""}
															</div>
															<div className="text-xs text-muted-foreground">
																DNI:{" "}
																{req.direct_debit?.holder_dni ||
																	req.participants?.[0]?.dni ||
																	"-"}
															</div>
															<div className="text-xs text-muted-foreground">
																Tel:{" "}
																{req.user?.phone ||
																	req.participants?.[0]?.phone ||
																	"-"}
															</div>
															<hr className="mt-2 mb-1"></hr>
															<div className="mt-1 text-xs gap-2 flex items-center">
																Mètode de pagament:{" "}
																<div
																	className={
																		a.allow_fill
																			? "bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded"
																			: "bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded"
																	}>
																	{paymentMethodLabel(req.payment_method)}
																</div>
															</div>

															{req.direct_debit && (
																<div className="mt-1 text-xs text-muted-foreground">
																	<div>
																		IBAN: {req.direct_debit.iban || "-"}
																	</div>
																	<div>
																		Titular:{" "}
																		{req.direct_debit.holder_name || "-"}
																	</div>
																	{req.direct_debit.holder_address && (
																		<div>
																			Adreça: {req.direct_debit.holder_address}
																		</div>
																	)}
																	{req.direct_debit.holder_dni && (
																		<div>
																			DNI: {req.direct_debit.holder_dni}
																		</div>
																	)}
																</div>
															)}

															{(req.user ||
																(req.participants &&
																	req.participants.length > 0)) && (
																<div className="mt-3">
																	<div className="font-medium mb-2">
																		Participants
																	</div>
																	<div className="space-y-2">
																		{req.user && (
																			<div
																				key={`titular-${req.id}`}
																				className="p-2 rounded border bg-background/50">
																				<div className="text-xs text-muted-foreground">
																					Titular
																				</div>
																				<div className="flex items-center justify-between">
																					<div className="font-medium">
																						{req.user?.name} {req.user?.surname}
																					</div>
																					<div className="flex items-center gap-2">
																						{(req.direct_debit?.holder_dni ||
																							req.user?.dni) && (
																							<span className="text-[11px] text-muted-foreground bg-muted/10 px-2 py-0.5 rounded">
																								DNI:{" "}
																								{req.direct_debit?.holder_dni ||
																									req.user?.dni}
																							</span>
																						)}
																						{req.user?.phone && (
																							<span className="text-[11px] text-muted-foreground bg-muted/10 px-2 py-0.5 rounded">
																								Tel: {req.user?.phone}
																							</span>
																						)}
																					</div>
																				</div>
																			</div>
																		)}

																		{req.participants &&
																			req.participants.length > 0 && (
																				<div className="grid gap-2">
																					{req.participants.map((p: any) => (
																						<div
																							key={
																								p.id ?? `p-${p.name}-${p.phone}`
																							}
																							className="flex items-center justify-between p-2 rounded border bg-background/50 text-xs">
																							<div className="font-medium">
																								{p.name}
																							</div>
																							<div className="flex items-center gap-2">
																								{p.dni && (
																									<span className="text-[11px] text-muted-foreground bg-muted/10 px-2 py-0.5 rounded">
																										DNI: {p.dni}
																									</span>
																								)}
																								{p.phone && (
																									<span className="text-[11px] text-muted-foreground bg-muted/10 px-2 py-0.5 rounded">
																										Tel: {p.phone}
																									</span>
																								)}
																							</div>
																						</div>
																					))}
																				</div>
																			)}
																	</div>
																</div>
															)}
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
		</>
	);
}
