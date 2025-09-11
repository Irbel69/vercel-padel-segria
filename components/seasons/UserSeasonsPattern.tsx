"use client";
import React from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Clock } from "lucide-react";
import { dayOrder, dayNames, durationMinutes } from "./utils";
import { cn } from "@/lib/utils";
import type { Entry } from "./types";

interface Props {
	entries: Entry[];
	startTimes: string[];
	selectedEntries: Set<number>;
	onToggleEntry: (id: number) => void;
	onContinue: () => void;
}

export default function UserSeasonsPattern({
	entries,
	startTimes,
	selectedEntries,
	onToggleEntry,
	onContinue,
}: Props) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Selecciona les teves classes</CardTitle>
				<CardDescription>
					Marca totes les franges en les que podries assistir.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="overflow-x-auto">
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
												e.start_time.slice(0, 5) === time &&
												e.kind === "class"
										);
										if (!entry)
											return <div key={dayIdx + time} className="p-1" />;

										const total = entry.capacity ?? null;
										const remaining =
											typeof (entry as any).remaining_capacity === "number"
												? (entry as any).remaining_capacity
												: null;
										const used =
											total !== null && remaining !== null
												? total - remaining
												: null;

										const isSelected = selectedEntries.has(entry.id);

										return (
											<div key={entry.id} className="p-1">
												<button
													onClick={() => onToggleEntry(entry.id)}
													className={cn(
														"w-full text-left rounded border p-2 text-[11px] shadow-sm transition cursor-pointer",
														isSelected
															? "bg-padel-primary/80 text-black border-padel-primary"
															: "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
													)}>
													<div className="flex justify-between items-center mb-1">
														<span className="font-medium">
															{entry.start_time.slice(0, 5)}-
															{entry.end_time.slice(0, 5)}
														</span>
													</div>

													<div
														className={cn(
															"text-[10px] mt-1 inline-flex items-center gap-1",
															isSelected
																? "text-black"
																: "text-muted-foreground"
														)}>
														<Clock
															className={cn(
																"h-3 w-3",
																isSelected
																	? "text-black"
																	: "text-muted-foreground"
															)}
														/>
														<span>
															{durationMinutes(
																entry.start_time,
																entry.end_time
															)}
															'
														</span>
													</div>
												</button>
											</div>
										);
									})}
								</React.Fragment>
							))}
						</div>
					</div>
				</div>

				<div className="flex justify-end">
					<Button
						variant="secondary"
						disabled={!selectedEntries.size}
						onClick={onContinue}>
						Continuar
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
