"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BlocksList from "./BlocksList";
import type { ScheduleBlock } from "@/types/lessons";

type Props = {
	baseStart: string;
	setBaseStart: (v: string) => void;
	location: string;
	setLocation: (v: string) => void;
	defaults: { max_capacity?: number; joinable?: boolean };
	setDefaults: (v: any) => void;
	policy: string;
	setPolicy: (v: any) => void;
	blocks: ScheduleBlock[];
	setBlocks: (
		b: ScheduleBlock[] | ((p: ScheduleBlock[]) => ScheduleBlock[])
	) => void;
	addBlock: (k: "lesson" | "break") => void;
	checkConflicts: () => void;
	applyChanges: () => void;
	loading: boolean;
	setMode: (m: "view" | "edit") => void;
	result: any | null;
	onChangeBlock: (idx: number, patch: Partial<ScheduleBlock>) => void;
	moveBlock: (idx: number, dir: -1 | 1) => void;
	removeBlock: (idx: number) => void;
};

export default function EditView(props: Props) {
	const {
		baseStart,
		setBaseStart,
		location,
		setLocation,
		defaults,
		setDefaults,
		policy,
		setPolicy,
		blocks,
		addBlock,
		checkConflicts,
		applyChanges,
		loading,
		setMode,
		result,
		onChangeBlock,
		moveBlock,
		removeBlock,
	} = props;

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div className="space-y-2">
					<Label className="text-white/90">Hora base inici</Label>
					<Input
						type="time"
						value={baseStart}
						onChange={(e) => setBaseStart(e.target.value)}
						className="w-full"
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-white/90">Ubicació</Label>
					<Input
						value={location}
						onChange={(e) => setLocation(e.target.value)}
						className="w-full"
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-white/90">
						Defectes (capacitat / joinable)
					</Label>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
						<Input
							type="number"
							min={1}
							max={4}
							placeholder="Capacitat"
							value={defaults.max_capacity ?? 4}
							onChange={(e) =>
								setDefaults((d: any) => ({
									...d,
									max_capacity: Number(e.target.value || 4),
								}))
							}
							className="w-full"
						/>
						<Select
							value={String(defaults.joinable ?? true)}
							onValueChange={(v) =>
								setDefaults((d: any) => ({ ...d, joinable: v === "true" }))
							}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Joinable" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="true">Permetre omplir</SelectItem>
								<SelectItem value="false">No omplible</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="space-y-2">
					<Label className="text-white/90">Política de conflicte</Label>
					<Select value={policy} onValueChange={(v) => setPolicy(v as any)}>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="skip">Saltar conflictes</SelectItem>
							<SelectItem value="protect">Protegir reserves</SelectItem>
							<SelectItem value="replace">Reemplaçar sense reserves</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="space-y-2">
				<Label className="text-white/90">Blocs del dia</Label>
				<div className="space-y-2">
					<BlocksList
						blocks={blocks}
						onChange={onChangeBlock}
						moveBlock={moveBlock}
						removeBlock={removeBlock}
					/>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button variant="outline" onClick={() => addBlock("lesson")}>
						Afegir classe
					</Button>
					<Button variant="outline" onClick={() => addBlock("break")}>
						Afegir pausa
					</Button>
				</div>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button onClick={checkConflicts} disabled={loading}>
					Previsualitzar conflictes
				</Button>
				<Button onClick={applyChanges} disabled={loading}>
					{loading ? "Guardant..." : "Guardar canvis"}
				</Button>
				<Button variant="ghost" onClick={() => setMode("view")}>
					Cancel·lar edició
				</Button>
			</div>

			{result && (
				<Card className="p-3 text-white/90 space-y-2">
					{typeof result.created_count === "number" && (
						<div className="text-sm">
							Previsualització/Resultat — creats:{" "}
							<b>{result.created_count ?? 0}</b>, reemplaçats:{" "}
							<b>{result.replaced_count ?? 0}</b>, saltats:{" "}
							<b>{result.skipped_count ?? 0}</b>
						</div>
					)}
					<pre className="whitespace-pre-wrap break-words text-xs opacity-75 max-w-full overflow-x-auto">
						{JSON.stringify(result, null, 2)}
					</pre>
				</Card>
			)}
		</div>
	);
}
