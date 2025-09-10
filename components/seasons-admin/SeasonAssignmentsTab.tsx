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
	// include request_id so we can detect assigned requests
	request_id?: number;
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
	// Build a set of request IDs that already have an assignment
	const assignedRequestIds = React.useMemo(() => {
		return new Set<number>(
			(assignments || [])
				.map((a) => (a as any).request_id)
				.filter(
					(id: number | undefined): id is number => typeof id === "number"
				)
		);
	}, [assignments]);

	// Split requests: unassigned first, then assigned (to be shown at the end)
	const unassignedRequests = React.useMemo(
		() => requests.filter((r) => !assignedRequestIds.has(r.id)),
		[requests, assignedRequestIds]
	);
	const assignedRequests = React.useMemo(
		() => requests.filter((r) => assignedRequestIds.has(r.id)),
		[requests, assignedRequestIds]
	);

	function paymentMethodLabel(pm?: string | null) {
		switch (pm) {
			case "direct_debit":
				return "Domiciliació";
			case "cash":
				return "Efectiu";
			case "bizum":
				return "Bizum";
			default:
				return pm || "-";
		}
	}

	function allowFillLabel(allow: boolean) {
		return allow ? "Admet omplir" : "No admet omplir";
	}

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

			{/* Single-column: show all requests top-to-bottom. */}
			<div className="grid gap-6">
				<Card className="overflow-hidden">
					<CardHeader>
						<CardTitle className="text-base">Sol·licituds</CardTitle>
						<CardDescription className="text-xs">
							Pendents / aprovades. Les assignades es mostren al final.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						{requests.length === 0 && (
							<div className="text-xs text-muted-foreground">
								Cap sol·licitud.
							</div>
						)}
						<ul className="divide-y divide-white/10">
							{[...unassignedRequests, ...assignedRequests].map((r) => {
								const isAssigned = assignedRequestIds.has(r.id);
								const isOpen = expanded.has(r.id);
								return (
									<li
										key={r.id}
										className={cn(
											"py-2 text-xs",
											isAssigned && "bg-green-500/10 rounded-md px-2"
										)}>
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
													{allowFillLabel(r.allow_fill)}
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
														`/dashboard/admin/seasons/${seasonId}/assign/${
															r.id
														}${isAssigned ? "?edit=1" : ""}`
													)
												}>
												{isAssigned ? "Modifica" : "Veure"}
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
														: {paymentMethodLabel(r.payment_method)}
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
			</div>
		</>
	);
}
