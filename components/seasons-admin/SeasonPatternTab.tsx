"use client";
import SeasonsPattern from "@/components/seasons/SeasonsPattern";
import type { Entry } from "@/components/seasons/types";
import { Dispatch, SetStateAction } from "react";

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
	assignments: any[];
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
	assignments,
}: SeasonPatternTabProps) {
	return (
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
		/>
	);
}
