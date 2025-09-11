"use client";
import { useSeasonEnrollment } from "@/hooks/useSeasonEnrollment";
import { Loader2 } from "lucide-react";
import UserSeasonsPattern from "@/components/seasons/UserSeasonsPattern";
import { AssignedClassCard } from "@/components/dashboard/season/AssignedClassCard";
import { RequestSent } from "@/components/dashboard/season/RequestSent";
import { EnrollmentForm } from "@/components/dashboard/season/EnrollmentForm";
import { EnrollmentSteps } from "@/components/dashboard/season/EnrollmentSteps";

export default function SeasonEnrollmentPage() {
	const {
		loading,
		season,
		entries,
		requesting,
		hasRequest,
		selectedEntries,
		groupSize,
		allowFill,
		paymentMethod,
		observations,
		participants,
		currentStep,
		directDebit,
		message,
		assignment,
		assignedEntry,
		classmates,
		classmatesUnavailable,
		setGroupSize,
		setAllowFill,
		setPaymentMethod,
		setObservations,
		setCurrentStep,
		setDirectDebit,
		toggleEntry,
		updateParticipant,
		submitRequest,
	} = useSeasonEnrollment();

	if (loading)
		return (
			<div className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				Carregant...
			</div>
		);

	if (!season)
		return (
			<div className="p-6 text-sm">
				No hi ha cap temporada amb inscripcions obertes.
			</div>
		);

	if (assignment && assignedEntry) {
		return (
			<AssignedClassCard
				season={season}
				assignment={assignment}
				assignedEntry={assignedEntry}
				classmates={classmates}
				classmatesUnavailable={classmatesUnavailable}
			/>
		);
	}

	if (hasRequest) {
		return <RequestSent season={season} />;
	}

	return (
		<div className="space-y-6 p-4 md:p-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">{season.name}</h1>
				<p className="text-sm text-muted-foreground">
					{currentStep === 1
						? "Selecciona les classes potencials."
						: "Introdueix les dades del grup i finalitza la sol·licitud."}
				</p>
			</div>

			<EnrollmentSteps currentStep={currentStep} />

			{currentStep === 1 && (
				<div className="space-y-6">
					<UserSeasonsPattern
						entries={entries}
						startTimes={(() => {
							const s = new Set<string>();
							for (const e of entries) s.add(e.start_time.slice(0, 5));
							return Array.from(s).sort();
						})()}
						selectedEntries={selectedEntries}
						onToggleEntry={toggleEntry}
						onContinue={() => setCurrentStep(2)}
					/>
				</div>
			)}
			{currentStep === 2 && (
				<EnrollmentForm
					groupSize={groupSize}
					setGroupSize={setGroupSize}
					allowFill={allowFill}
					setAllowFill={setAllowFill}
					participants={participants}
					updateParticipant={updateParticipant}
					paymentMethod={paymentMethod}
					setPaymentMethod={setPaymentMethod}
					directDebit={directDebit}
					setDirectDebit={setDirectDebit}
					observations={observations}
					setObservations={setObservations}
					message={message}
					requesting={requesting}
					setCurrentStep={setCurrentStep}
					submitRequest={submitRequest}
				/>
			)}
		</div>
	);
}
