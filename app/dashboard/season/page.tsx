"use client";
import { useSeasonEnrollment } from "@/hooks/useSeasonEnrollment";
import { Loader2, CalendarX2, CalendarPlus } from "lucide-react";
import UserSeasonsPattern from "@/components/seasons/UserSeasonsPattern";
import { AssignedClassCard } from "@/components/dashboard/season/AssignedClassCard";
import { RequestSent } from "@/components/dashboard/season/RequestSent";
import { EnrollmentForm } from "@/components/dashboard/season/EnrollmentForm";
import { EnrollmentSteps } from "@/components/dashboard/season/EnrollmentSteps";
import SeasonHeader from "@/components/dashboard/season/SeasonHeader";

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
			<div className="space-y-8 p-4 md:p-6">
				<SeasonHeader
					seasonName={"Temporada"}
					enrollmentOpen={false}
					assigned={false}
					hasRequest={false}
					subtitle="Actualment no hi ha una temporada amb inscripcions obertes"
				/>
				<div className="relative overflow-hidden rounded-2xl border border-dashed border-gray-700/60 bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/60 backdrop-blur-sm p-10 flex flex-col items-center text-center">
					<div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black,transparent)] opacity-40">
						<div className="absolute -top-24 -left-24 w-72 h-72 bg-padel-primary/10 rounded-full blur-3xl" />
						<div className="absolute -bottom-24 -right-24 w-72 h-72 bg-padel-primary/5 rounded-full blur-3xl" />
					</div>
					<div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-padel-primary/20 to-padel-primary/5 border border-padel-primary/30 mb-6 relative">
						<CalendarX2 className="h-9 w-9 text-padel-primary drop-shadow" />
					</div>
					<h2 className="text-xl md:text-2xl font-semibold tracking-tight bg-gradient-to-r from-white to-padel-primary/80 bg-clip-text text-transparent">
						Sense temporada disponible
					</h2>
					<p className="text-sm md:text-base text-gray-300/80 max-w-xl mt-3 leading-relaxed">
						Estem preparant la propera temporada. Quan s&apos;obrin les inscripcions,
						aquí podràs seleccionar les teves preferències d&apos;horari i enviar la
						teva sol·licitud.
					</p>
					<div className="mt-6 inline-flex items-center gap-2 text-xs text-gray-400/80 font-medium">
						<CalendarPlus className="h-4 w-4 text-padel-primary" />
						<span>Revisa més tard per no perdre&apos;t l&apos;inici</span>
					</div>
				</div>
			</div>
		);

	if (assignment && assignedEntry) {
		return (
			<div className="space-y-6 p-4 md:p-6">
				<SeasonHeader
					seasonName={season.name}
					enrollmentOpen={!!season}
					hasRequest={hasRequest}
					assigned={!!assignment}
				/>
				<AssignedClassCard
					season={season}
					assignment={assignment}
					assignedEntry={assignedEntry}
					classmates={classmates}
					classmatesUnavailable={classmatesUnavailable}
				/>
			</div>
		);
	}

	if (hasRequest) {
		return <RequestSent season={season} />;
	}

	return (
		<div className="space-y-6 p-4 md:p-6">
			<SeasonHeader
				seasonName={season.name}
				enrollmentOpen={!!season}
				hasRequest={hasRequest}
				assigned={false}
				onStartEnrollment={() => setCurrentStep(1)}
			/>
			<div className="space-y-1">
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
