"use client";

import { useEffect, useMemo, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type {
	CalendarDay,
	LessonSlotWithBookings,
} from "@/components/lessons/AdminCalendarView";
import type { ScheduleBlock } from "@/types/lessons";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	day: CalendarDay | null;
	timezone?: string;
	defaultLocation?: string;
	onSaved?: () => void; // called after successful apply
};

function formatTimeHHMM(d: Date) {
	return d.toTimeString().slice(0, 5);
}

function minutesBetween(a: Date, b: Date) {
	return Math.round((b.getTime() - a.getTime()) / 60000);
}

export default function DayEditorDialog({
	open,
	onOpenChange,
	day,
	timezone = "Europe/Madrid",
	defaultLocation = "Soses",
	onSaved,
}: Props) {
	const { toast } = useToast();
	const [mode, setMode] = useState<"view" | "edit">("view");
	const [baseStart, setBaseStart] = useState<string>("16:00");
	const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
	const [defaults, setDefaults] = useState<{
		max_capacity?: number;
		joinable?: boolean;
	}>({ max_capacity: 4, joinable: true });
	const [policy, setPolicy] = useState<"skip" | "protect" | "replace">(
		"protect"
	);
	const [location, setLocation] = useState<string>(defaultLocation);
	const [result, setResult] = useState<any | null>(null);
	const [loading, setLoading] = useState(false);

	// Build initial editor state from existing slots of the day
	useEffect(() => {
		if (!open || !day) return;
		setMode("view");
		const sorted = [...day.slots].sort(
			(a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
		);
		if (sorted.length) {
			const first = new Date(sorted[0].start_at);
			setBaseStart(formatTimeHHMM(first));
			setLocation(sorted[0].location || defaultLocation);
			const b: ScheduleBlock[] = [];
			for (let i = 0; i < sorted.length; i++) {
				const s = sorted[i];
				const start = new Date(s.start_at);
				const end = new Date(s.end_at);
				b.push({
					kind: "lesson",
					duration_minutes: Math.max(15, minutesBetween(start, end)),
					label: undefined,
					max_capacity: s.max_capacity,
					joinable: s.joinable,
				});
				// insert break between lessons
				if (i < sorted.length - 1) {
					const nextStart = new Date(sorted[i + 1].start_at);
					const breakMin = minutesBetween(end, nextStart);
					if (breakMin > 0)
						b.push({ kind: "break", duration_minutes: breakMin });
				}
			}
			setBlocks(b);
			// defaults inferred from the first slot
			setDefaults((d) => ({
				max_capacity: sorted[0].max_capacity ?? d.max_capacity,
				joinable: sorted[0].joinable ?? d.joinable,
			}));
		} else {
			// No slots that day: provide a sensible starter pattern
			setBaseStart("16:00");
			setBlocks([
				{ kind: "lesson", duration_minutes: 60 },
				{ kind: "break", duration_minutes: 30 },
				{ kind: "lesson", duration_minutes: 60 },
			]);
			setDefaults({ max_capacity: 4, joinable: true });
			setLocation(defaultLocation);
		}
		setResult(null);
	}, [open, day, defaultLocation]);

	const addBlock = (kind: "lesson" | "break") =>
		setBlocks((prev) => [...prev, { kind, duration_minutes: 60 }]);
	const removeBlock = (idx: number) =>
		setBlocks((prev) => prev.filter((_, i) => i !== idx));
	const moveBlock = (idx: number, dir: -1 | 1) =>
		setBlocks((prev) => {
			const next = [...prev];
			const j = idx + dir;
			if (j < 0 || j >= next.length) return prev;
			[next[idx], next[j]] = [next[j], next[idx]];
			return next;
		});

	const weekday = useMemo(() => {
		if (!day) return 0;
		const dateStr = day.date.toISOString().slice(0, 10);
		return new Date(dateStr + "T00:00:00Z").getUTCDay();
	}, [day]);

	const buildPayload = () => {
		if (!day) return null;
		const dateStr = day.date.toISOString().slice(0, 10);
		return {
			title: `Edició manual ${dateStr}`,
			valid_from: dateStr,
			valid_to: dateStr,
			days_of_week: [weekday],
			base_time_start: baseStart,
			location,
			timezone,
			template: { blocks, defaults },
			options: { policy, overwrite_day: true },
			// when replacing we also set force so backend can delete conflicts without bookings
			force: policy === "replace",
		};
	};

	const checkConflicts = async () => {
		const payload = buildPayload();
		if (!payload) return;
		setLoading(true);
		setResult(null);
		const res = await fetch("/api/lessons/admin/schedules/check-conflicts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		const json = await res.json();
		setResult(json);
		setLoading(false);
	};

	const applyChanges = async () => {
		const payload = buildPayload();
		if (!payload) return;
		setLoading(true);
		try {
			const res = await fetch("/api/lessons/admin/schedules/apply", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const json = await res.json();
			setResult(json);
			if (!res.ok) {
				toast({
					title: "Error guardant canvis",
					description: json?.error || "No s'ha pogut aplicar l'horari",
					variant: "destructive",
				});
			} else {
				const c = json?.created_count ?? 0;
				const r = json?.replaced_count ?? 0;
				const s = json?.skipped_count ?? 0;
				const msg = `Creats: ${c} · Reemplaçats: ${r} · Saltats: ${s}`;
				toast({ title: "Canvis aplicats", description: msg });
				if (c + r === 0) {
					// no visible change
					toast({
						title: "Sense canvis visibles",
						description:
							"Potser hi ha conflictes amb franges existents o la política escollida no permet reemplaçar.",
						variant: "default",
					});
				}
				onSaved && onSaved();
			}
		} catch (e: any) {
			toast({
				title: "Error de xarxa",
				description: e?.message || "Revisa la connexió",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[95vw] md:max-w-3xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-white">
						{day
							? day.date.toLocaleDateString("ca-ES", {
									weekday: "long",
									day: "2-digit",
									month: "long",
									year: "numeric",
							  })
							: "Dia"}
					</DialogTitle>
				</DialogHeader>

				{!day ? null : (
					<div className="space-y-4">
						{mode === "view" ? (
							<div className="space-y-3">
								<div className="text-white/80">
									{day.slots.length} classes programades
								</div>
								<div className="space-y-2">
									{day.slots
										.sort(
											(a, b) =>
												new Date(a.start_at).getTime() -
												new Date(b.start_at).getTime()
										)
										.map((s: LessonSlotWithBookings) => (
											<Card
												key={s.id}
												className="p-2 text-sm text-white/90 flex items-center gap-3">
												<span>
													{new Date(s.start_at).toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
													})}
												</span>
												<span>—</span>
												<span>
													{new Date(s.end_at).toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
													})}
												</span>
												<span className="ml-auto">
													Capacitat: {s.max_capacity}
												</span>
											</Card>
										))}
								</div>
								<div className="pt-2">
									<Button onClick={() => setMode("edit")}>Editar</Button>
								</div>
							</div>
						) : (
							<div className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div className="space-y-2">
										<Label className="text-white/90">Hora base inici</Label>
										<Input
											type="time"
											value={baseStart}
											onChange={(e) => setBaseStart(e.target.value)}
											className="w-full"
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-white/90">Ubicació</Label>
										<Input
											value={location}
											onChange={(e) => setLocation(e.target.value)}
											className="w-full"
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-white/90">
											Defectes (capacitat / joinable)
										</Label>
										<div className="grid grid-cols-2 gap-2">
											<Input
												type="number"
												min={1}
												max={4}
												placeholder="Capacitat"
												value={defaults.max_capacity ?? 4}
												onChange={(e) =>
													setDefaults((d) => ({
														...d,
														max_capacity: Number(e.target.value || 4),
													}))
												}
												className="w-full"
											/>
											<Select
												value={String(defaults.joinable ?? true)}
												onValueChange={(v) =>
													setDefaults((d) => ({ ...d, joinable: v === "true" }))
												}>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Joinable" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="true">Permetre omplir</SelectItem>
													<SelectItem value="false">No omplible</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
									<div className="space-y-2">
										<Label className="text-white/90">
											Política de conflicte
										</Label>
										<Select
											value={policy}
											onValueChange={(v) => setPolicy(v as any)}>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="skip">Saltar conflictes</SelectItem>
												<SelectItem value="protect">
													Protegir reserves
												</SelectItem>
												<SelectItem value="replace">
													Reemplaçar sense reserves
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="space-y-2">
									<Label className="text-white/90">Blocs del dia</Label>
									<div className="space-y-2">
										{blocks.map((b, idx) => (
											<Card
												key={idx}
												className="p-3 flex flex-wrap items-center gap-3">
												<Select
													value={b.kind}
													onValueChange={(v) =>
														setBlocks((prev) =>
															prev.map((x, i) =>
																i === idx ? { ...x, kind: v as any } : x
															)
														)
													}>
													<SelectTrigger className="w-32">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="lesson">Classe</SelectItem>
														<SelectItem value="break">Pausa</SelectItem>
													</SelectContent>
												</Select>
												<Input
													type="number"
													className="w-28"
													value={b.duration_minutes}
													onChange={(e) =>
														setBlocks((prev) =>
															prev.map((x, i) =>
																i === idx
																	? {
																			...x,
																			duration_minutes: Number(
																				e.target.value || 60
																			),
																	  }
																	: x
															)
														)
													}
												/>
												{b.kind === "lesson" && (
													<>
														<Input
															placeholder="Etiqueta"
															className="w-40 min-w-0"
															value={b.label || ""}
															onChange={(e) =>
																setBlocks((prev) =>
																	prev.map((x, i) =>
																		i === idx
																			? { ...x, label: e.target.value }
																			: x
																	)
																)
															}
														/>
														<Input
															type="number"
															className="w-24"
															placeholder="Cap"
															value={b.max_capacity ?? ""}
															onChange={(e) =>
																setBlocks((prev) =>
																	prev.map((x, i) =>
																		i === idx
																			? {
																					...x,
																					max_capacity: e.target.value
																						? Number(e.target.value)
																						: undefined,
																			  }
																			: x
																	)
																)
															}
														/>
														<Select
															value={
																b.joinable === undefined
																	? "default"
																	: String(b.joinable)
															}
															onValueChange={(v) =>
																setBlocks((prev) =>
																	prev.map((x, i) =>
																		i === idx
																			? {
																					...x,
																					joinable:
																						v === "default"
																							? undefined
																							: v === "true",
																			  }
																			: x
																	)
																)
															}>
															<SelectTrigger className="w-32">
																<SelectValue placeholder="Joinable?" />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="default">
																	(per defecte)
																</SelectItem>
																<SelectItem value="true">Sí</SelectItem>
																<SelectItem value="false">No</SelectItem>
															</SelectContent>
														</Select>
													</>
												)}
												<div className="ml-auto flex gap-2">
													<Button
														variant="ghost"
														size="icon"
														onClick={() => moveBlock(idx, -1)}>
														<ArrowUp className="w-4 h-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => moveBlock(idx, 1)}>
														<ArrowDown className="w-4 h-4" />
													</Button>
													<Button
														variant="destructive"
														size="icon"
														onClick={() => removeBlock(idx)}>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</Card>
										))}
									</div>
									<div className="flex gap-2">
										<Button
											variant="outline"
											onClick={() => addBlock("lesson")}>
											<Plus className="w-4 h-4 mr-1" /> Afegir classe
										</Button>
										<Button variant="outline" onClick={() => addBlock("break")}>
											<Plus className="w-4 h-4 mr-1" /> Afegir pausa
										</Button>
									</div>
								</div>

								<div className="flex gap-2">
									<Button onClick={checkConflicts} disabled={loading}>
										Previsualitzar conflictes
									</Button>
									<Button onClick={applyChanges} disabled={loading}>
										{loading ? "Guardant..." : "Guardar canvis"}
									</Button>
									<Button variant="ghost" onClick={() => setMode("view")}>
										Cancel·lar edició
									</Button>
								</div>

								{result && (
									<Card className="p-3 text-white/90 space-y-2">
										{typeof result.created_count === "number" && (
											<div className="text-sm">
												Previsualització/Resultat — creats:{" "}
												<b>{result.created_count ?? 0}</b>, reemplaçats:{" "}
												<b>{result.replaced_count ?? 0}</b>, saltats:{" "}
												<b>{result.skipped_count ?? 0}</b>
											</div>
										)}
										<pre className="whitespace-pre-wrap text-xs opacity-75">
											{JSON.stringify(result, null, 2)}
										</pre>
									</Card>
								)}
							</div>
						)}
					</div>
				)}

				<DialogFooter>
					<Button variant="secondary" onClick={() => onOpenChange(false)}>
						Tancar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
