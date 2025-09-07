"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, RefreshCw } from "lucide-react";
import React from "react";

import SeasonsPattern from "@/components/seasons/SeasonsPattern";
import EntryDialog from "@/components/seasons/EntryDialog";
import { dayNames } from "@/components/seasons/utils";
import type { Season, Entry } from "@/components/seasons/types";

export default function SeasonDetailPage() {
	const params = useParams();
	const id = Number(params?.id);
	const supabase = createClient();
	const router = useRouter();
	const [season, setSeason] = useState<Season | null>(null);
	const [entries, setEntries] = useState<Entry[]>([]);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState("pattern");
	const [message, setMessage] = useState<string | null>(null);
	const [entryDialog, setEntryDialog] = useState<{ open: boolean; day?: number }>({ open: false });
	const [entryForm, setEntryForm] = useState({ kind: "class" as "class" | "break", start_time: "17:00", end_time: "18:00", capacity: 4, location: "Soses", day: undefined });
	const [builderOpen, setBuilderOpen] = useState(false);
	const [builder, setBuilder] = useState({ days: [] as number[], base_start: "17:00", blocks: [{ kind: "class" as const, duration: 60, capacity: 4 }], location: "Soses" });
	const [building, setBuilding] = useState(false);

	useEffect(() => {
		if (!isNaN(id)) load();
	}, [id]);

	async function load() {
		setLoading(true);
		const { data: seasonData } = await supabase
			.from("seasons")
			.select("*")
			.eq("id", id)
			.single();
		const { data: entryData } = await supabase
			.from("season_week_entries")
			.select("*")
			.eq("season_id", id)
			.order("day_of_week")
			.order("start_time");
		setSeason(seasonData || null);
		setEntries(entryData || []);
		setLoading(false);
	}

	async function addEntry(day: number) {
		setMessage(null);
		try {
			if (
				entryForm.kind === "class" &&
				(!entryForm.capacity || entryForm.capacity < 1)
			)
				throw new Error("Capacitat requerida");
			const { error } = await supabase.from("season_week_entries").insert({
				season_id: id,
				day_of_week: day,
				kind: entryForm.kind,
				start_time: entryForm.start_time,
				end_time: entryForm.end_time,
				capacity: entryForm.kind === "class" ? entryForm.capacity : null,
				location: entryForm.location,
			});
			if (error) throw error;
			setEntryDialog({ open: false });
			await load();
		} catch (e: any) {
			setMessage(e.message);
		}
	}
	async function deleteEntry(entryId: number) {
		if (!confirm("Eliminar entrada?")) return;
		const { error } = await supabase
			.from("season_week_entries")
			.delete()
			.eq("id", entryId);
		if (error) alert(error.message);
		else load();
	}
	async function toggleEnrollments() {
		if (!season) return;
		const { error } = await supabase
			.from("seasons")
			.update({ enrollments_open: !season.enrollments_open })
			.eq("id", season.id);
		if (!error)
			setSeason({ ...season, enrollments_open: !season.enrollments_open });
	}
	async function buildPattern() {
		setBuilding(true);
		setMessage(null);
		try {
			if (builder.days.length === 0) throw new Error("Selecciona dies");
			if (builder.blocks.length === 0)
				throw new Error("Afegeix almenys un bloc");
			const inserts: any[] = [];
			for (const day of builder.days) {
				let current = builder.base_start;
				for (const block of builder.blocks) {
					const [h, m] = current.split(":").map(Number);
					const start = h * 60 + m;
					const endMin = start + block.duration;
					const endH = Math.floor(endMin / 60);
					const endM = endMin % 60;
					if (endH > 23 || endMin >= 24 * 60)
						throw new Error("Un bloc excedeix el dia");
					const end = `${String(endH).padStart(2, "0")}:${String(endM).padStart(
						2,
						"0"
					)}`;
					inserts.push({
						season_id: id,
						day_of_week: day,
						kind: block.kind,
						start_time: current,
						end_time: end,
						capacity: block.kind === "class" ? block.capacity : null,
						location: builder.location,
					});
					current = end;
				}
			}
			const { error } = await supabase
				.from("season_week_entries")
				.insert(inserts);
			if (error) throw error;
			setBuilderOpen(false);
			await load();
		} catch (e: any) {
			setMessage(e.message);
		}
		setBuilding(false);
	}

	const startTimes = useMemo(() => {
		const s = new Set<string>();
		for (const e of entries) s.add(e.start_time.slice(0, 5));
		return Array.from(s).sort();
	}, [entries]);

	return (
		<div className="p-4 md:p-6 space-y-6">
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.push("/dashboard/admin/seasons")}>
					{" "}
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-semibold">Temporada</h1>
				<div className="ml-auto flex gap-2">
					{season && (
						<Button
							variant={season.enrollments_open ? "secondary" : "outline"}
							size="sm"
							onClick={toggleEnrollments}>
							{season.enrollments_open
								? "Tancar inscripcions"
								: "Obrir inscripcions"}
						</Button>
					)}
					<Button variant="outline" size="sm" onClick={load}>
						<RefreshCw className="h-4 w-4" />
					</Button>
				</div>
			</div>
			{season && (
				<p className="text-xs text-muted-foreground">
					{season.name} | {season.date_start} → {season.date_end} | TZ:{" "}
					{season.timezone}
				</p>
			)}
			{message && <p className="text-xs text-red-500">{message}</p>}
			{loading && <p className="text-sm">Carregant...</p>}
			{!loading && season && (
				<Tabs value={tab} onValueChange={setTab}>
					<TabsList className="mb-4">
						<TabsTrigger value="pattern">Patró setmanal</TabsTrigger>
						<TabsTrigger value="assignments">Assignacions</TabsTrigger>
					</TabsList>
					<TabsContent value="pattern" className="space-y-4">
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
						/>
					</TabsContent>
					<TabsContent value="assignments">
						<p className="text-xs text-muted-foreground">
							Gestor d'assignacions pendent (migrar lògica existent si cal).
						</p>
					</TabsContent>
				</Tabs>
			)}
			{!loading && !season && (
				<p className="text-sm text-muted-foreground">Temporada no trobada.</p>
			)}

			<EntryDialog
				open={entryDialog.open}
				onOpenChange={(o) => setEntryDialog((d) => ({ open: o, day: o ? d.day : undefined }))}
				entryForm={entryForm}
				setEntryForm={setEntryForm}
				onSave={() => entryDialog.day !== undefined && addEntry(entryDialog.day)}
			/>
		</div>
	);
}
