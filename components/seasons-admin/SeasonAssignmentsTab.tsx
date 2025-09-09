"use client";
import React from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DirectDebit {
	iban?: string | null;
	holder_name?: string | null;
	holder_address?: string | null;
	holder_dni?: string | null;
}

interface Participant {
	id: number;
	name: string;
	dni?: string | null;
	phone?: string | null;
}

interface RequestRow {
	id: number;
	user?: {
		name?: string | null;
		surname?: string | null;
		phone?: string | null;
	};
	group_size: number;
	allow_fill: boolean;
	payment_method?: string | null;
	observations?: string | null;
	status?: string;
	participants?: Participant[];
	choices?: { entry_id: number }[];
	direct_debit?: DirectDebit | null;
	created_at?: string;
}

interface AssignmentRow {
	id: number;
	user?: { name?: string | null; surname?: string | null };
	entry?: { day_of_week: number; start_time: string; end_time: string };
	group_size: number;
	allow_fill: boolean;
}

const dayNames = ["Dg", "Dl", "Dt", "Dc", "Dj", "Dv", "Ds"];

interface SeasonAssignmentsTabProps {
	requests: RequestRow[];
	assignments: AssignmentRow[];
	expanded: Set<number>;
	toggleExpand: (id: number) => void;
	loadAssignments: () => void;
	router: any;
	seasonId: number;
}

export default function SeasonAssignmentsTab({
	requests,
	assignments,
	expanded,
	toggleExpand,
	loadAssignments,
	router,
	seasonId,
}: SeasonAssignmentsTabProps) {
	return (
		<>
			<div className="flex items-center gap-2">
				<h2 className="font-semibold">Assignacions</h2>
				{!requests.length && !assignments.length && (
					<span className="text-xs text-muted-foreground">
						Sense dades encara.
					</span>
				)}
				<Button variant="outline" size="sm" onClick={loadAssignments}>
					<RefreshCw className="h-3 w-3" />
				</Button>
			</div>

			<div className="grid lg:grid-cols-2 gap-6">
				<Card className="overflow-hidden">
					<CardHeader>
						<CardTitle className="text-base">Sol·licituds</CardTitle>
						<CardDescription className="text-xs">
							Pendents / aprovades sense classe.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						{requests.length === 0 && (
							<div className="text-xs text-muted-foreground">
								Cap sol·licitud.
							</div>
						)}
						<ul className="divide-y divide-white/10">
							{requests.map((r) => {
								const isOpen = expanded.has(r.id);
								return (
									<li key={r.id} className="py-2 text-xs">
										<div className="flex items-center gap-2">
											<button
												onClick={() => toggleExpand(r.id)}
												className="p-1 rounded hover:bg-white/10">
												{isOpen ? (
													<ChevronDown className="h-4 w-4" />
												) : (
													<ChevronRight className="h-4 w-4" />
												)}
											</button>
											<div className="flex-1 flex flex-col md:flex-row md:items-center md:gap-3">
												<span className="font-medium">
													{r.user?.name || "Sense nom"} {r.user?.surname || ""}
												</span>
												<span className="text-muted-foreground">
													Grup: {r.group_size}
												</span>
												<span
													className={cn(
														"px-1.5 py-0.5 rounded text-[10px] w-fit",
														r.allow_fill
															? "bg-green-500/20 text-green-400"
															: "bg-yellow-500/20 text-yellow-400"
													)}>
													{r.allow_fill ? "allow_fill" : "no fill"}
												</span>
												<span className="hidden md:inline text-muted-foreground">
													{r.created_at
														? new Date(r.created_at).toLocaleDateString()
														: ""}
												</span>
											</div>
											<Button
												size="sm"
												variant="secondary"
												onClick={() =>
													router.push(
														`/dashboard/admin/seasons/${seasonId}/assign/${r.id}`
													)
												}>
												Veure
											</Button>
										</div>

										{isOpen && (
											<div className="mt-2 ml-8 space-y-2">
												{r.observations && (
													<div>
														<span className="font-medium">Obs:</span>{" "}
														{r.observations}
													</div>
												)}

												{r.participants && r.participants.length > 0 && (
													<div>
														<div className="font-medium mb-1">Participants</div>
														<div className="grid gap-1">
															{r.participants.map((p) => (
																<div
																	key={p.id}
																	className="flex flex-wrap gap-2 text-[11px] bg-white/5 rounded px-2 py-1">
																	<span className="font-medium">{p.name}</span>
																	{p.dni && (
																		<span className="text-muted-foreground">
																			DNI: {p.dni}
																		</span>
																	)}
																	{p.phone && (
																		<span className="text-muted-foreground">
																			Tel: {p.phone}
																		</span>
																	)}
																</div>
															))}
														</div>
													</div>
												)}

												<div className="text-[11px]">
													<div className="font-medium">
														Titular de la reserva
													</div>
													<div className="pl-1 text-muted-foreground">
														{r.user?.name || "Sense nom"}{" "}
														{r.user?.surname || ""}
													</div>
													<div className="pl-1 text-muted-foreground">
														DNI:{" "}
														{(r.direct_debit && r.direct_debit.holder_dni) ||
															(r.participants && r.participants[0]?.dni) ||
															"-"}
													</div>
													<div className="pl-1 text-muted-foreground">
														Tel:{" "}
														{r.user?.phone ||
															(r.participants && r.participants[0]?.phone) ||
															"-"}
													</div>
													<div className="mt-1 text-[11px] text-muted-foreground">
														Mètode de pagament: {r.payment_method || "-"}
													</div>
													{r.direct_debit && (
														<div className="mt-1 text-[11px] text-muted-foreground">
															<div>IBAN: {r.direct_debit.iban || "-"}</div>
															<div>
																Titular: {r.direct_debit.holder_name || "-"}
															</div>
															{r.direct_debit.holder_address && (
																<div>
																	Adreça: {r.direct_debit.holder_address}
																</div>
															)}
															{r.direct_debit.holder_dni && (
																<div>DNI: {r.direct_debit.holder_dni}</div>
															)}
														</div>
													)}
												</div>
											</div>
										)}
									</li>
								);
							})}
						</ul>
					</CardContent>
				</Card>

				<Card className="overflow-hidden">
					<CardHeader>
						<CardTitle className="text-base">Assignacions</CardTitle>
						<CardDescription className="text-xs">
							Classes actives.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						{assignments.length === 0 && (
							<div className="text-xs text-muted-foreground">
								Sense assignacions.
							</div>
						)}
						<ul className="divide-y divide-white/10">
							{assignments.map((a) => (
								<li key={a.id} className="py-2 text-xs flex items-center gap-3">
									<div className="flex-1 flex flex-col md:flex-row md:items-center md:gap-3">
										<span className="font-medium">
											{a.user?.name || "Sense nom"} {a.user?.surname || ""}
										</span>
										{a.entry && (
											<span className="flex items-center gap-1 text-muted-foreground">
												<Clock className="h-3 w-3" />
												{a.entry.start_time.slice(0, 5)}-
												{a.entry.end_time.slice(0, 5)} (
												{dayNames[a.entry.day_of_week]})
											</span>
										)}
										<span className="text-muted-foreground">
											Grup: {a.group_size}
										</span>
										<span
											className={cn(
												"px-1.5 py-0.5 rounded text-[10px] w-fit",
												a.allow_fill
													? "bg-green-500/20 text-green-400"
													: "bg-yellow-500/20 text-yellow-400"
											)}>
											{a.allow_fill ? "allow_fill" : "no fill"}
										</span>
									</div>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
