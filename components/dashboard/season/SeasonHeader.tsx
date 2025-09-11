"use client";

import * as React from "react";
import { CalendarDays, CheckCircle2, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * SeasonHeader
 * ---------------------------------------------------------------------------
 * Visual header for the Season (Temporada) dashboard tab. Mirrors the visual
 * language used in other personal area headers like Tournaments and Rankings:
 *  - Gradient / glass panel
 *  - Prominent icon + title + supporting description
 *  - Contextual status badge (request sent / assigned)
 *  - Primary CTA when enrollment is open and user has not yet requested
 *
 * Accessibility:
 *  - Button has aria-label
 *  - Decorative gradient kept behind content (-z-10)
 */

export interface SeasonHeaderProps {
	/** Optional current season name (falls back to "Temporada") */
	seasonName?: string | null;
	/** Whether enrollment is currently open */
	enrollmentOpen?: boolean;
	/** User already submitted an enrollment request (pending or approved) */
	hasRequest?: boolean;
	/** User already has an active assignment */
	assigned?: boolean;
	/** Trigger to start enrollment flow (step wizard) */
	onStartEnrollment?: () => void;
	/** Optional subtitle override (if provided, replaces contextual description) */
	subtitle?: string;
	/** Optional extra className */
	className?: string;
}

export function SeasonHeader({
	seasonName,
	enrollmentOpen = false,
	hasRequest = false,
	assigned = false,
	onStartEnrollment,
	subtitle,
	className,
}: SeasonHeaderProps) {
	const title = seasonName?.trim() || "Temporada";

	function description() {
		if (subtitle) return subtitle;
		if (assigned) return "Ja tens una classe assignada";
		if (hasRequest) return "Sol·licitud enviada – esperant assignació";
		if (enrollmentOpen) return "Inscriu-te a la temporada";
		return "Consulta la teva informació de temporada";
	}

	const showCTA =
		enrollmentOpen && !hasRequest && !assigned && !!onStartEnrollment;

	return (
		<div className={cn("relative", className)}>
			{/* Decorative background */}
			<div className="absolute inset-0 bg-gradient-to-r from-padel-primary/5 via-transparent to-padel-primary/5 rounded-2xl blur-3xl -z-10" />

			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:p-6 bg-gradient-to-br from-gray-800/50 via-gray-800/30 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-xl">
				<div className="flex flex-row items-center gap-3 md:gap-4 min-w-0">
					<div className="p-2 md:p-3 bg-gradient-to-br from-padel-primary/30 to-padel-primary/10 rounded-xl shadow-lg border border-padel-primary/20">
						{assigned ? (
							<CheckCircle2 className="h-6 w-6 md:h-7 md:w-7 text-padel-primary drop-shadow-sm" />
						) : hasRequest ? (
							<Hourglass className="h-6 w-6 md:h-7 md:w-7 text-padel-primary drop-shadow-sm" />
						) : (
							<CalendarDays className="h-6 w-6 md:h-7 md:w-7 text-padel-primary drop-shadow-sm" />
						)}
					</div>
					<div className="min-w-0 flex-1">
						<h1 className="text-2xl md:text-4xl font-black text-white drop-shadow-sm bg-gradient-to-r from-white via-white to-padel-primary bg-clip-text text-transparent truncate">
							{title}
						</h1>
						<p className="text-gray-300 text-sm md:text-lg font-medium truncate">
							{description()}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-3 w-full sm:w-auto justify-end">
					{hasRequest && !assigned && (
						<Badge
							variant="secondary"
							className="bg-amber-400/20 text-amber-300 border border-amber-400/30">
							Sol·licitud enviada
						</Badge>
					)}
					{assigned && (
						<Badge
							variant="secondary"
							className="bg-green-400/20 text-green-300 border border-green-400/30">
							Assignat
						</Badge>
					)}
					{showCTA && (
						<Button
							onClick={onStartEnrollment}
							size="lg"
							className="rounded-full px-6 py-3 bg-gradient-to-r from-padel-primary via-padel-primary-light to-padel-primary text-black font-bold shadow-[0_12px_30px_rgba(229,240,0,0.3)] hover:shadow-[0_18px_40px_rgba(229,240,0,0.4)] transform-gpu transition-all hover:-translate-y-1 hover:scale-105 motion-safe:animate-btn-float border border-padel-primary/50"
							aria-label="Iniciar inscripció temporada">
							Inscriure'm
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

export default SeasonHeader;
