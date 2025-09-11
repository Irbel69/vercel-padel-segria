"use client";
import SeasonsPattern from "@/components/seasons/SeasonsPattern";
import type { Entry } from "@/components/seasons/types";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface SeasonPatternTabProps {
	entries: Entry[];
	startTimes: string[];
	builderOpen: boolean;
	setBuilderOpen: Dispatch<SetStateAction<boolean>>;
	builder: any;
	setBuilder: Dispatch<SetStateAction<any>>;
	building: boolean;
	buildPattern: () => Promise<void>;
	setEntryDialog: Dispatch<SetStateAction<{ open: boolean; day?: number }>>;
	deleteEntry: (entryId: number) => Promise<void>;
	deleteAssignment: (id: number) => Promise<void>;
	assignments: any[];
	requests?: any[];
}

export default function SeasonPatternTab({
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
	deleteAssignment,
	assignments,
	// forward requests so the pattern sheet can show detailed info
	// (provided by the parent admin page)
	requests,
}: SeasonPatternTabProps) {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
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
	function computeStartTime(idx: number) {
		const base = builder?.base_start as string | undefined;
		if (!base || !/^\d{2}:\d{2}$/.test(base)) return "";
		const [hStr, mStr] = base.split(":");
		let minutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
		const blocks = builder?.blocks || [];
		for (let i = 0; i < idx; i++) {
			const d = Number(blocks[i]?.duration || 0);
			if (!Number.isNaN(d)) minutes += d;
		}
		minutes = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
		const hh = Math.floor(minutes / 60)
			.toString()
			.padStart(2, "0");
		const mm = (minutes % 60).toString().padStart(2, "0");
		return `${hh}:${mm}`;
	}
	function toggleDay(d: number) {
		const days: number[] = builder.days || [];
		const s = new Set(days);
		if (s.has(d)) s.delete(d);
		else s.add(d);
		setBuilder({ ...builder, days: Array.from(s).sort((a, b) => a - b) });
	}

	function addBlock(kind: "class" | "break") {
		const blocks = builder.blocks || [];
		setBuilder({
			...builder,
			blocks: [...blocks, { kind, duration: 60, capacity: 4 }],
		});
	}

	function removeBlock(idx: number) {
		const blocks = (builder.blocks || []).filter(
			(_: any, i: number) => i !== idx
		);
		setBuilder({ ...builder, blocks });
	}

	return (
		<>
			<SeasonsPattern
				entries={entries}
				startTimes={startTimes}
				builderOpen={builderOpen}
				setBuilderOpen={setBuilderOpen}
				builder={builder}
				setBuilder={setBuilder}
				building={building}
				buildPattern={buildPattern}
				setEntryDialog={setEntryDialog}
				deleteEntry={deleteEntry}
				assignments={assignments}
				requests={requests}
				deleteAssignment={deleteAssignment}
			/>

			<Sheet open={builderOpen} onOpenChange={(o) => setBuilderOpen(o)}>
				<SheetContent
					side={isMobile ? "bottom" : "right"}
					className={`flex flex-col ${isMobile ? "h-[70vh]" : "w-96"}`}>
					<div className="flex-1 overflow-y-auto pr-2 space-y-4">
						<div>
							<div className="text-sm text-muted-foreground">Patró modular</div>
							<div className="font-semibold">Constructor de patró</div>
						</div>

						<div>
							<Label>Dies de la setmana</Label>
							<div className="flex flex-wrap gap-2 mt-2">
								{[1, 2, 3, 4, 5, 6, 0].map((d, idx) => (
									<Button
										key={d}
										variant={
											(builder.days || []).includes(d) ? "default" : "outline"
										}
										onClick={() => toggleDay(d)}
										className="h-9">
										{["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"][idx]}
									</Button>
								))}
							</div>
						</div>

						<div>
							<Label>Hora base inici</Label>
							<Input
								type="time"
								value={builder.base_start}
								onChange={(e) =>
									setBuilder({ ...builder, base_start: e.target.value })
								}
							/>
						</div>

						<div>
							<Label>Blocs</Label>
							<div className="space-y-2 mt-2">
								{(builder.blocks || []).map((b: any, idx: number) => (
									<div
										key={idx}
										className="p-2 rounded border flex items-center gap-2">
										<div className="w-16 text-sm font-mono text-muted-foreground">
											{computeStartTime(idx)}
										</div>
										<div className="flex-1">
											<div className="text-xs text-muted-foreground">Tipus</div>
											<div className="font-medium">
												{b.kind === "class" ? "Classe" : "Pausa"}
											</div>
										</div>
										<div className="w-24">
											<Input
												type="number"
												value={b.duration}
												onChange={(e) => {
													const v = Number(e.target.value || 0);
													const blocks = [...(builder.blocks || [])];
													blocks[idx] = { ...blocks[idx], duration: v };
													setBuilder({ ...builder, blocks });
												}}
											/>
										</div>
										{b.kind === "class" && (
											<div className="w-24">
												<Input
													type="number"
													value={b.capacity ?? 4}
													onChange={(e) => {
														const v = Number(e.target.value || 0);
														const blocks = [...(builder.blocks || [])];
														blocks[idx] = { ...blocks[idx], capacity: v };
														setBuilder({ ...builder, blocks });
													}}
												/>
											</div>
										)}
										<div className="ml-auto flex gap-2">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => removeBlock(idx)}>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
									</div>
								))}
							</div>
							<div className="flex gap-2 mt-2">
								<Button variant="outline" onClick={() => addBlock("class")}>
									<Plus className="w-4 h-4 mr-1" /> Afegir classe
								</Button>
								<Button variant="outline" onClick={() => addBlock("break")}>
									<Plus className="w-4 h-4 mr-1" /> Afegir pausa
								</Button>
							</div>
						</div>

						<div className="flex gap-2 mt-4">
							<Button onClick={() => setBuilderOpen(false)} variant="outline">
								Tancar
							</Button>
							<Button onClick={() => buildPattern()} disabled={building}>
								{building ? "Processant..." : "Aplicar patró"}
							</Button>
						</div>
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
