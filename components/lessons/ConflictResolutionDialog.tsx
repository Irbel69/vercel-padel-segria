"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock, Calendar, MapPin } from "lucide-react";

interface ConflictRule {
	id: number;
	title: string;
	valid_from: string | null;
	valid_to: string | null;
	days_of_week: number[];
	time_start: string;
	time_end: string;
	location: string;
}

interface Conflict {
	rule: ConflictRule;
	conflictDates: string[];
	conflictReasons: string[];
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	conflicts: Conflict[];
	affectedBookings: any[];
	onResolve: (resolution: "force" | "modify" | "exception") => void;
	onModifyRule: (ruleId: number) => void;
	onCreateException: (conflictingDates: string[]) => void;
	newRuleData: any | null;
}

export function ConflictResolutionDialog({
	open,
	onOpenChange,
	conflicts,
	affectedBookings,
	onResolve,
	onModifyRule,
	onCreateException,
	newRuleData,
}: Props) {
	const [selectedResolution, setSelectedResolution] = useState<string | null>(
		null
	);

	const getDayNames = (days: number[]) => {
		const dayNames = ["Dg", "Dl", "Dt", "Dc", "Dj", "Dv", "Ds"];
		return days.map((d) => dayNames[d]).join(", ");
	};

	const formatTimeRange = (start: string, end: string) => {
		return `${start} - ${end}`;
	};

	const formatDateRange = (from: string | null, to: string | null) => {
		if (!from && !to) return "Sense límit de dates";
		if (!from) return `Fins ${new Date(to!).toLocaleDateString()}`;
		if (!to) return `Des de ${new Date(from).toLocaleDateString()}`;
		return `${new Date(from).toLocaleDateString()} - ${new Date(
			to
		).toLocaleDateString()}`;
	};

	const handleResolve = () => {
		if (!selectedResolution) return;

		switch (selectedResolution) {
			case "force":
				onResolve("force");
				break;
			case "modify":
				// For now, just resolve as modify - could enhance to show specific rule selection
				onResolve("modify");
				break;
			case "exception":
				const allConflictDates = conflicts.flatMap((c) => c.conflictDates);
				onCreateException(allConflictDates);
				break;
		}

		onOpenChange(false);
		setSelectedResolution(null);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-white">
						<AlertTriangle className="w-5 h-5 text-yellow-400" />
						Conflictes detectats en crear la regla
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* New Rule Summary */}
					{newRuleData && (
						<Card className="p-4">
							<h3 className="font-semibold text-white mb-2">
								Nova regla que es vol crear:
							</h3>
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span className="text-white/60">Títol:</span>
									<span className="ml-2 text-white">
										{newRuleData.title || "Sense títol"}
									</span>
								</div>
								<div>
									<span className="text-white/60">Dies:</span>
									<span className="ml-2 text-white">
										{getDayNames(newRuleData.days_of_week || [])}
									</span>
								</div>
								<div>
									<span className="text-white/60">Horari:</span>
									<span className="ml-2 text-white">
										{formatTimeRange(
											newRuleData.time_start || "",
											newRuleData.time_end || ""
										)}
									</span>
								</div>
								<div>
									<span className="text-white/60">Període:</span>
									<span className="ml-2 text-white">
										{formatDateRange(
											newRuleData.valid_from,
											newRuleData.valid_to
										)}
									</span>
								</div>
							</div>
						</Card>
					)}

					{/* Conflicts */}
					{conflicts.length > 0 && (
						<div>
							<h3 className="font-semibold text-white mb-3">
								Regles en conflicte:
							</h3>
							<div className="space-y-3">
								{conflicts.map((conflict, index) => (
									<Card key={index} className="p-4 border-yellow-500/20">
										<div className="flex justify-between items-start mb-2">
											<h4 className="font-medium text-white">
												{conflict.rule.title || `Regla #${conflict.rule.id}`}
											</h4>
											<Badge
												variant="outline"
												className="text-yellow-300 border-yellow-500">
												Conflicte
											</Badge>
										</div>

										<div className="grid grid-cols-2 gap-4 text-sm mb-3">
											<div className="flex items-center gap-2">
												<Calendar className="w-4 h-4 text-white/60" />
												<span className="text-white/60">Dies:</span>
												<span className="text-white">
													{getDayNames(conflict.rule.days_of_week)}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<Clock className="w-4 h-4 text-white/60" />
												<span className="text-white/60">Horari:</span>
												<span className="text-white">
													{formatTimeRange(
														conflict.rule.time_start,
														conflict.rule.time_end
													)}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<MapPin className="w-4 h-4 text-white/60" />
												<span className="text-white/60">Ubicació:</span>
												<span className="text-white">
													{conflict.rule.location}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<Calendar className="w-4 h-4 text-white/60" />
												<span className="text-white/60">Període:</span>
												<span className="text-white">
													{formatDateRange(
														conflict.rule.valid_from,
														conflict.rule.valid_to
													)}
												</span>
											</div>
										</div>

										<div>
											<p className="text-white/60 text-sm mb-1">
												Motius del conflicte:
											</p>
											<ul className="text-sm text-white space-y-1">
												{conflict.conflictReasons.map((reason, idx) => (
													<li key={idx} className="flex items-start gap-2">
														<span className="text-yellow-400">•</span>
														{reason}
													</li>
												))}
											</ul>
										</div>

										<Button
											variant="outline"
											size="sm"
											className="mt-3"
											onClick={() => onModifyRule(conflict.rule.id)}>
											Modificar aquesta regla
										</Button>
									</Card>
								))}
							</div>
						</div>
					)}

					{/* Affected Bookings Warning */}
					{affectedBookings.length > 0 && (
						<Alert className="border-red-500/50 bg-red-500/10">
							<AlertTriangle className="h-4 w-4 text-red-400" />
							<AlertDescription className="text-red-300">
								Hi ha {affectedBookings.length} reserves que podrien veure's
								afectades. Es recomana revisar aquestes reserves abans de
								procedir.
							</AlertDescription>
						</Alert>
					)}

					{/* Resolution Options */}
					<div>
						<h3 className="font-semibold text-white mb-3">
							Com vols resoldre els conflictes?
						</h3>
						<div className="space-y-2">
							<Card
								className={`p-3 cursor-pointer transition-colors ${
									selectedResolution === "exception"
										? "bg-blue-500/20 border-blue-500"
										: "hover:bg-white/5"
								}`}
								onClick={() => setSelectedResolution("exception")}>
								<div className="flex items-start gap-3">
									<input
										type="radio"
										name="resolution"
										value="exception"
										checked={selectedResolution === "exception"}
										onChange={() => setSelectedResolution("exception")}
										className="mt-1"
									/>
									<div>
										<h4 className="font-medium text-white">
											Crear excepcions (Recomanat)
										</h4>
										<p className="text-white/60 text-sm">
											Es crearan excepcions per als dies conflictius. La nova
											regla s'aplicarà normalment excepte en les dates on ja hi
											ha regles actives.
										</p>
									</div>
								</div>
							</Card>

							<Card
								className={`p-3 cursor-pointer transition-colors ${
									selectedResolution === "modify"
										? "bg-blue-500/20 border-blue-500"
										: "hover:bg-white/5"
								}`}
								onClick={() => setSelectedResolution("modify")}>
								<div className="flex items-start gap-3">
									<input
										type="radio"
										name="resolution"
										value="modify"
										checked={selectedResolution === "modify"}
										onChange={() => setSelectedResolution("modify")}
										className="mt-1"
									/>
									<div>
										<h4 className="font-medium text-white">
											Modificar regles existents
										</h4>
										<p className="text-white/60 text-sm">
											Modifica les regles en conflicte per fer espai a la nova
											regla. Usa els botons "Modificar aquesta regla" de cada
											conflicte.
										</p>
									</div>
								</div>
							</Card>

							<Card
								className={`p-3 cursor-pointer transition-colors ${
									selectedResolution === "force"
										? "bg-yellow-500/20 border-yellow-500"
										: "hover:bg-white/5"
								}`}
								onClick={() => setSelectedResolution("force")}>
								<div className="flex items-start gap-3">
									<input
										type="radio"
										name="resolution"
										value="force"
										checked={selectedResolution === "force"}
										onChange={() => setSelectedResolution("force")}
										className="mt-1"
									/>
									<div>
										<h4 className="font-medium text-white">
											Forçar creació (Perill)
										</h4>
										<p className="text-white/60 text-sm">
											Crea la regla ignorant els conflictes. Això pot causar
											comportaments inesperats amb múltiples regles aplicant-se
											al mateix temps.
										</p>
									</div>
								</div>
							</Card>
						</div>
					</div>

					{/* Actions */}
					<div className="flex justify-end gap-3">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Cancel·lar
						</Button>
						<Button
							onClick={handleResolve}
							disabled={!selectedResolution}
							className={
								selectedResolution === "force"
									? "bg-yellow-600 hover:bg-yellow-700"
									: ""
							}>
							{selectedResolution === "force" && "Forçar "}
							{selectedResolution === "exception" && "Crear excepcions"}
							{selectedResolution === "modify" && "Continuar modificació"}
							{!selectedResolution && "Selecciona una opció"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
