"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Users, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
	dayOrder,
	dayNames,
	computeBlockStart,
	durationMinutes,
} from "./utils";
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
}: Props) {
	const [selectedEntry, setSelectedEntry] = React.useState<number | null>(null);

	// small hook to detect mobile width for choosing sheet side
	const [isMobile, setIsMobile] = React.useState(false);
	React.useEffect(() => {
		const mq = window.matchMedia("(max-width: 640px)");
		const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
			setIsMobile(e.matches);
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

	// selected entry and its assignments (computed for rendering the side panel)
	const sel = selectedEntry
		? entries.find((e) => e.id === selectedEntry) || null
		: null;
	const selAssignments = sel
		? assignments.filter((a: any) => a.entry?.id === sel.id)
		: [];

	return (
		<>
			<div className="flex gap-2">
				<Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
					<DialogTrigger asChild>
						<Button size="sm">
							<Plus className="h-4 w-4 mr-1" />
							Afegir Patró
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Patró setmanal</DialogTitle>
							<DialogDescription>
								Crea múltiples entrades per diversos dies.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 text-sm">
							<div>
								<label className="text-[11px] font-medium">Dies</label>
								<div className="flex flex-wrap gap-1 mt-1">
									{dayOrder.map((d) => {
										const active = builder.days.includes(d);
										return (
											<button
												key={d}
												type="button"
												onClick={() =>
													setBuilder((b: any) => ({
														...b,
														days: active
															? b.days.filter((x: number) => x !== d)
															: [...b.days, d],
													}))
												}
												className={`px-2 py-1 rounded border text-[11px] ${
													active
														? "bg-primary text-primary-foreground"
														: "bg-background"
												}`}>
												{dayNames[d]}
											</button>
										);
									})}
								</div>
								<div className="space-y-2">
									{builder.blocks.map((blk: any, idx: number) => {
										const start = computeBlockStart(
											builder.base_start,
											builder.blocks,
											idx
										);
										return (
											<div key={idx} className="p-2 rounded border space-y-2">
												<div className="flex items-center justify-between text-xs">
													<span className="font-mono text-muted-foreground">
														{start}
													</span>
													<div className="flex items-center gap-2">
														<select
															className="border rounded px-1 py-0.5 text-xs bg-background"
															value={blk.kind}
															onChange={(e) =>
																setBuilder((b: any) => ({
																	...b,
																	blocks: b.blocks.map((o: any, i: number) =>
																		i === idx
																			? { ...o, kind: e.target.value }
																			: o
																	),
																}))
															}>
															<option value="class">Classe</option>
															<option value="break">Pausa</option>
														</select>
														<Input
															className="w-16 h-7 text-xs"
															type="number"
															min={5}
															max={300}
															value={blk.duration}
															onChange={(e) =>
																setBuilder((b: any) => ({
																	...b,
																	blocks: b.blocks.map((o: any, i: number) =>
																		i === idx
																			? {
																					...o,
																					duration: Number(e.target.value),
																			  }
																			: o
																	),
																}))
															}
														/>
														{blk.kind === "class" && (
															<Input
																className="w-14 h-7 text-xs"
																type="number"
																min={1}
																max={32}
																value={blk.capacity}
																onChange={(e) =>
																	setBuilder((b: any) => ({
																		...b,
																		blocks: b.blocks.map((o: any, i: number) =>
																			i === idx
																				? {
																						...o,
																						capacity: Number(e.target.value),
																				  }
																				: o
																		),
																	}))
																}
															/>
														)}
														<Button
															variant="ghost"
															size="icon"
															className="h-6 w-6"
															onClick={() =>
																setBuilder((b: any) => ({
																	...b,
																	blocks: b.blocks.filter(
																		(_: any, i: number) => i !== idx
																	),
																}))
															}>
															<Trash2 className="h-3 w-3" />
														</Button>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button disabled={building} onClick={buildPattern}>
								{building ? "Creant..." : "Crear"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
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
							<div></div>
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

										const entryAssignments = assignments.filter(
											(a: any) => a.entry?.id === entry.id
										);

										// compute used/remaining
										const total = entry.capacity ?? null;
										let remaining: number | null = null;
										if (typeof entry.remaining_capacity === "number") {
											remaining = entry.remaining_capacity;
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

										return (
											<div key={entry.id}>
												<div
													onClick={() => setSelectedEntry(entry.id)}
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
														<span className="text-xs">
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

							<div></div>
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
				onOpenChange={(open) => {
					if (!open) setSelectedEntry(null);
				}}>
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
						{/* SheetContent already includes a close button in the top-right; no need for a duplicate here */}
					</div>

					{sel && (
						<>
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
										if (typeof sel.remaining_capacity === "number")
											remaining = sel.remaining_capacity;
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
										{selAssignments.map((a: any) => (
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
													<div>Pago: {a.payment_method || "—"}</div>
													<div
														className={
															a.allow_fill
																? "bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded"
																: "bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded"
														}>
														{a.allow_fill ? "allow_fill" : "no fill"}
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</>
					)}
				</SheetContent>
			</Sheet>
		</>
	);
}
