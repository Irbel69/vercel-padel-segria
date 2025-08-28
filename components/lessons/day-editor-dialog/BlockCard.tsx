"use client";

import { Card } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import type { ScheduleBlock } from "@/types/lessons";

type Props = {
	b: ScheduleBlock;
	idx: number;
	onChange: (idx: number, patch: Partial<ScheduleBlock>) => void;
	moveBlock: (idx: number, dir: -1 | 1) => void;
	removeBlock: (idx: number) => void;
};

export default function BlockCard({
	b,
	idx,
	onChange,
	moveBlock,
	removeBlock,
}: Props) {
	return (
		<Card
			key={idx}
			className="p-3 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
			<Select
				value={b.kind}
				onValueChange={(v) => onChange(idx, { kind: v as any })}>
				<SelectTrigger className="w-full sm:w-32">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="lesson">Classe</SelectItem>
					<SelectItem value="break">Pausa</SelectItem>
				</SelectContent>
			</Select>
			<Input
				type="number"
				className="w-full sm:w-28"
				value={String(b.duration_minutes)}
				onChange={(e) =>
					onChange(idx, { duration_minutes: Number(e.target.value || 60) })
				}
			/>
			{b.kind === "lesson" && (
				<>
					<Input
						placeholder="Etiqueta"
						className="w-full sm:w-40 sm:min-w-0"
						value={b.label || ""}
						onChange={(e) => onChange(idx, { label: e.target.value })}
					/>
					<Input
						type="number"
						className="w-full sm:w-24"
						placeholder="Cap"
						value={b.max_capacity ?? ""}
						onChange={(e) =>
							onChange(idx, {
								max_capacity: e.target.value
									? Number(e.target.value)
									: undefined,
							})
						}
					/>
					<Select
						value={b.joinable === undefined ? "default" : String(b.joinable)}
						onValueChange={(v) =>
							onChange(idx, {
								joinable: v === "default" ? undefined : v === "true",
							})
						}>
						<SelectTrigger className="w-full sm:w-32">
							<SelectValue placeholder="Joinable?" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="default">(per defecte)</SelectItem>
							<SelectItem value="true">Sí</SelectItem>
							<SelectItem value="false">No</SelectItem>
						</SelectContent>
					</Select>
				</>
			)}
			<div className="sm:ml-auto w-full sm:w-auto flex justify-end gap-2">
				<Button variant="ghost" size="icon" onClick={() => moveBlock(idx, -1)}>
					<ArrowUp className="w-4 h-4" />
				</Button>
				<Button variant="ghost" size="icon" onClick={() => moveBlock(idx, 1)}>
					<ArrowDown className="w-4 h-4" />
				</Button>
				<Button
					variant="destructive"
					size="icon"
					onClick={() => removeBlock(idx)}>
					<Trash2 className="w-4 h-4" />
				</Button>
			</div>
		</Card>
	);
}
