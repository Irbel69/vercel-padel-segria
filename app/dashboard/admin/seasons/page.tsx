"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogTrigger,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	Calendar as CalendarIcon,
	Plus,
	RefreshCw,
	Save,
	X,
	Clock,
	Users,
	Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Season {
	id: number;
	name: string;
	date_start: string;
	date_end: string;
	enrollments_open: boolean;
	timezone: string;
}
interface Entry {
	id: number;
	day_of_week: number;
	kind: string;
	start_time: string;
	end_time: string;
	capacity: number | null;
	location: string;
	note?: string | null;
	assigned_group_size?: number | null;
	remaining_capacity?: number | null;
}

const dayNames = [
	"Diumenge",
	"Dilluns",
	"Dimarts",
	"Dimecres",
	"Dijous",
	"Divendres",
	"Dissabte",
];

function getEntryColor(e: any) {
	// mirror AdminCalendarView status colors: available -> green, full -> yellow, break -> yellow/brown
	if (e.kind === "break")
		return "bg-yellow-700/20 text-yellow-300 border-yellow-600";
	const rem = e.remaining_capacity;
	if (rem === null || rem === undefined)
		return "bg-green-500/20 text-green-300";
	if (rem <= 0) return "bg-yellow-500/20 text-yellow-300";
	return "bg-green-500/20 text-green-300";
}

function formatDuration(start: string, end: string) {
	try {
		const [sh, sm] = start.split(":").map(Number);
		const [eh, em] = end.split(":").map(Number);
		const s = new Date(0, 0, 0, sh, sm);
		const e = new Date(0, 0, 0, eh, em);
		let mins = Math.round((e.getTime() - s.getTime()) / 60000);
		if (mins < 0) mins += 24 * 60;
		if (mins >= 60)
			return `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ""}`;
		return `${mins}m`;
	} catch {
		return "";
	}
}

export default function AdminSeasonsPage() {
	const supabase = createClient();
	const [seasons, setSeasons] = useState<Season[]>([]);
	const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
	const [entries, setEntries] = useState<Entry[]>([]);
	const [loading, setLoading] = useState(false);
	const [creating, setCreating] = useState(false);
	const [form, setForm] = useState({
		name: "",
		date_start: "",
		date_end: "",
		timezone: "Europe/Madrid",
	});
	const [newEntry, setNewEntry] = useState({
		day_of_week: 1,
		kind: "class",
		start_time: "17:00",
		end_time: "18:00",
		capacity: 4,
		location: "Soses",
		note: "",
	});
	const [addingEntry, setAddingEntry] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		load();
	}, []);

	async function load() {
		setLoading(true);
		const { data } = await supabase
			.from("seasons")
			.select("*")
			.order("date_start", { ascending: false });
		setSeasons(data || []);
		if (selectedSeason) {
			selectSeason(selectedSeason.id);
		}
		setLoading(false);
	}

	async function selectSeason(id: number) {
		const s =
			seasons.find((s) => s.id === id) ||
			(await supabase.from("seasons").select("*").eq("id", id).maybeSingle())
				.data;
		if (!s) return;
		setSelectedSeason(s as Season);
		// Use the load view so we also get assigned_group_size and remaining_capacity
		const { data: e } = await supabase
			.from("season_entry_load")
			.select("*")
			.eq("season_id", s.id)
			.order("day_of_week")
			.order("start_time");
		setEntries(e || []);
	}

	async function createSeason() {
		setCreating(true);
		setMessage(null);
		try {
			if (!form.name || !form.date_start || !form.date_end)
				throw new Error("Camps requerits.");
			const { error } = await supabase.from("seasons").insert({
				name: form.name.trim(),
				date_start: form.date_start,
				date_end: form.date_end,
				timezone: form.timezone,
			});
			if (error) throw error;
			setForm({
				name: "",
				date_start: "",
				date_end: "",
				timezone: "Europe/Madrid",
			});
			await load();
		} catch (e: any) {
			setMessage(e.message);
		}
		setCreating(false);
	}

	async function toggleEnrollments() {
		if (!selectedSeason) return;
		const { error } = await supabase
			.from("seasons")
			.update({ enrollments_open: !selectedSeason.enrollments_open })
			.eq("id", selectedSeason.id);
		if (!error) {
			await selectSeason(selectedSeason.id);
		}
	}

	async function addEntry() {
		if (!selectedSeason) return;
		setAddingEntry(true);
		setMessage(null);
		try {
			const payload: any = { ...newEntry, season_id: selectedSeason.id };
			if (payload.kind === "break") payload.capacity = null;
			const { error } = await supabase
				.from("season_week_entries")
				.insert(payload);
			if (error) throw error;
			setNewEntry({
				day_of_week: 1,
				kind: "class",
				start_time: "17:00",
				end_time: "18:00",
				capacity: 4,
				location: "Soses",
				note: "",
			});
			await selectSeason(selectedSeason.id);
		} catch (e: any) {
			setMessage(e.message);
		}
		setAddingEntry(false);
	}

	async function deleteEntry(id: number) {
		if (!selectedSeason) return;
		if (!confirm("Eliminar entrada?")) return;
		const { error } = await supabase
			.from("season_week_entries")
			.delete()
			.eq("id", id);
		if (!error) setEntries(entries.filter((e) => e.id !== id));
	}

	async function deleteSeason(id: number) {
		if (!confirm("Eliminar temporada i tot el seu patró?")) return;
		await supabase.from("seasons").delete().eq("id", id);
		if (selectedSeason?.id === id) {
			setSelectedSeason(null);
			setEntries([]);
		}
		load();
	}

	return (
		<div className="space-y-6 p-4 md:p-6">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">Gestió de Temporades</h1>
					<p className="text-sm text-muted-foreground">
						Crea i administra temporades setmanals.
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={load}>
						<RefreshCw className="h-4 w-4 mr-1" />
						Refrescar
					</Button>
					<Dialog>
						<DialogTrigger asChild>
							<Button>
								<Plus className="h-4 w-4 mr-1" />
								Nova Temporada
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Nova Temporada</DialogTitle>
								<DialogDescription>
									Defineix el rang de dates i nom únic.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-3 py-2">
								<div>
									<label className="text-xs font-medium">Nom</label>
									<Input
										value={form.name}
										onChange={(e) =>
											setForm((f) => ({ ...f, name: e.target.value }))
										}
										placeholder="Temporada 25-26"
									/>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="text-xs font-medium">Data inici</label>
										<Input
											type="date"
											value={form.date_start}
											onChange={(e) =>
												setForm((f) => ({ ...f, date_start: e.target.value }))
											}
										/>
									</div>
									<div>
										<label className="text-xs font-medium">Data fi</label>
										<Input
											type="date"
											value={form.date_end}
											onChange={(e) =>
												setForm((f) => ({ ...f, date_end: e.target.value }))
											}
										/>
									</div>
								</div>
								<div>
									<label className="text-xs font-medium">Zona horària</label>
									<Input
										value={form.timezone}
										onChange={(e) =>
											setForm((f) => ({ ...f, timezone: e.target.value }))
										}
									/>
								</div>
								{message && <p className="text-xs text-red-500">{message}</p>}
							</div>
							<DialogFooter>
								<Button disabled={creating} onClick={createSeason}>
									{creating ? "Creant..." : "Crear"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			<div className="grid md:grid-cols-3 gap-6">
				<Card className="md:col-span-1">
					<CardHeader>
						<CardTitle>Temporades</CardTitle>
						<CardDescription>Llista de totes les temporades.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
						{seasons.map((s) => {
							const active = selectedSeason?.id === s.id;
							return (
								<div
									key={s.id}
									className={cn(
										"p-3 rounded-md border cursor-pointer text-sm group relative",
										active
											? "border-padel-primary bg-padel-primary/10"
											: "border-border hover:bg-accent/30"
									)}
									onClick={() => selectSeason(s.id)}>
									<div className="flex justify-between items-start">
										<div>
											<p className="font-medium">{s.name}</p>
											<p className="text-[11px] text-muted-foreground">
												{s.date_start} → {s.date_end}
											</p>
										</div>
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={(e) => {
													e.stopPropagation();
													deleteSeason(s.id);
												}}>
												<Trash2 className="h-3 w-3" />
											</Button>
										</div>
									</div>
									{s.enrollments_open && (
										<span className="absolute top-2 right-10 text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-500 pointer-events-none">
											Inscripcions obertes
										</span>
									)}
								</div>
							);
						})}
						{seasons.length === 0 && (
							<p className="text-xs text-muted-foreground">Cap temporada.</p>
						)}
					</CardContent>
				</Card>

				<div className="md:col-span-2 space-y-6">
					{!selectedSeason && (
						<Card>
							<CardHeader>
								<CardTitle>Selecciona una temporada</CardTitle>
								<CardDescription>
									L'edició del patró apareixerà aquí.
								</CardDescription>
							</CardHeader>
						</Card>
					)}
					{selectedSeason && (
						<>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between">
									<div>
										<CardTitle>{selectedSeason.name}</CardTitle>
										<CardDescription>
											{selectedSeason.date_start} → {selectedSeason.date_end}
										</CardDescription>
									</div>
									<div className="flex gap-2">
										<Button
											variant={
												selectedSeason.enrollments_open
													? "destructive"
													: "secondary"
											}
											onClick={toggleEnrollments}>
											{selectedSeason.enrollments_open
												? "Tancar inscripcions"
												: "Obrir inscripcions"}
										</Button>
										<Button
											variant="outline"
											onClick={() => selectSeason(selectedSeason.id)}>
											<RefreshCw className="h-4 w-4" />
										</Button>
									</div>
								</CardHeader>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between">
									<div>
										<CardTitle>Patró Setmanal</CardTitle>
										<CardDescription>
											Defineix classes (class) o pauses (break)
										</CardDescription>
									</div>
									<Dialog>
										<DialogTrigger asChild>
											<Button size="sm">
												<Plus className="h-4 w-4 mr-1" />
												Afegir
											</Button>
										</DialogTrigger>
										<DialogContent className="sm:max-w-sm">
											<DialogHeader>
												<DialogTitle>Nova Entrada</DialogTitle>
											</DialogHeader>
											<div className="space-y-3">
												<div>
													<label className="text-xs font-medium">Dia</label>
													<select
														className="w-full rounded-md border bg-background px-2 py-1 text-sm mt-1"
														value={newEntry.day_of_week}
														onChange={(e) =>
															setNewEntry((ne) => ({
																...ne,
																day_of_week: Number(e.target.value),
															}))
														}>
														{dayNames.map((d, i) => (
															<option key={i} value={i}>
																{d}
															</option>
														))}
													</select>
												</div>
												<div className="grid grid-cols-2 gap-2">
													<div>
														<label className="text-xs font-medium">Inici</label>
														<Input
															type="time"
															value={newEntry.start_time}
															onChange={(e) =>
																setNewEntry((ne) => ({
																	...ne,
																	start_time: e.target.value,
																}))
															}
														/>
													</div>
													<div>
														<label className="text-xs font-medium">Fi</label>
														<Input
															type="time"
															value={newEntry.end_time}
															onChange={(e) =>
																setNewEntry((ne) => ({
																	...ne,
																	end_time: e.target.value,
																}))
															}
														/>
													</div>
												</div>
												<div>
													<label className="text-xs font-medium">Tipus</label>
													<select
														className="w-full rounded-md border bg-background px-2 py-1 text-sm mt-1"
														value={newEntry.kind}
														onChange={(e) =>
															setNewEntry((ne) => ({
																...ne,
																kind: e.target.value as any,
															}))
														}>
														<option value="class">Class</option>
														<option value="break">Break</option>
													</select>
												</div>
												{newEntry.kind === "class" && (
													<div>
														<label className="text-xs font-medium">
															Capacitat (1-4)
														</label>
														<Input
															type="number"
															min={1}
															max={4}
															value={newEntry.capacity || 4}
															onChange={(e) =>
																setNewEntry((ne) => ({
																	...ne,
																	capacity: Number(e.target.value),
																}))
															}
														/>
													</div>
												)}
												<div>
													<label className="text-xs font-medium">
														Ubicació
													</label>
													<Input
														value={newEntry.location}
														onChange={(e) =>
															setNewEntry((ne) => ({
																...ne,
																location: e.target.value,
															}))
														}
													/>
												</div>
												<div>
													<label className="text-xs font-medium">Nota</label>
													<Textarea
														rows={2}
														value={newEntry.note}
														onChange={(e) =>
															setNewEntry((ne) => ({
																...ne,
																note: e.target.value,
															}))
														}
													/>
												</div>
												{message && (
													<p className="text-xs text-red-500">{message}</p>
												)}
											</div>
											<DialogFooter>
												<Button disabled={addingEntry} onClick={addEntry}>
													{addingEntry ? "Afegint..." : "Afegir"}
												</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								</CardHeader>
								<CardContent>
									<div className="grid md:grid-cols-2 gap-4">
										{Array.from({ length: 7 }).map((_, day) => (
											<div
												key={day}
												className="border rounded-md p-3 bg-white/5">
												<h4 className="text-sm font-medium mb-2 flex items-center gap-2">
													<CalendarIcon className="h-4 w-4" />
													{dayNames[day]}
												</h4>
												<div className="space-y-2">
													{entries
														.filter((e) => e.day_of_week === day)
														.map((e) => (
															<div
																key={e.id}
																className={cn(
																	"text-xs p-1 rounded cursor-pointer transition-opacity hover:opacity-80",
																	getEntryColor(e)
																)}>
																<div className="flex items-center gap-1 justify-between">
																	<div className="flex items-center gap-1">
																		<Clock className="w-3 h-3" />
																		<div>
																			<span>
																				{e.start_time.slice(0, 5)} ·{" "}
																				{formatDuration(
																					e.start_time,
																					e.end_time
																				)}
																			</span>
																		</div>
																	</div>
																	<div className="flex items-center gap-1 text-[11px]">
																		{e.kind === "class" && (
																			<>
																				<Users className="w-3 h-3" />
																				<span>
																					{e.assigned_group_size || 0}/
																					{e.capacity}
																				</span>
																			</>
																		)}
																	</div>
																</div>
																<div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">
																	{e.kind === "class" ? "Class" : "Pausa"}
																</div>
																{e.note && (
																	<div className="text-[10px] text-muted-foreground">
																		{e.note}
																	</div>
																)}
															</div>
														))}
													{entries.filter((e) => e.day_of_week === day)
														.length === 0 && (
														<p className="text-[11px] text-muted-foreground">
															Sense entrades
														</p>
													)}
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>

							<AssignmentsManager seasonId={selectedSeason.id} />
						</>
					)}
				</div>
			</div>
		</div>
	);
}

// Simple assignments manager
function AssignmentsManager({ seasonId }: { seasonId: number }) {
	const supabase = createClient();
	const [requests, setRequests] = useState<any[]>([]);
	const [entries, setEntries] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [assigning, setAssigning] = useState<number | null>(null);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		load();
	}, [seasonId]);

	async function load() {
		setLoading(true);
		const { data: reqs } = await supabase
			.from("season_enrollment_requests")
			.select("*")
			.eq("season_id", seasonId)
			.order("created_at");
		const { data: entryLoad } = await supabase
			.from("season_entry_load")
			.select("*")
			.eq("season_id", seasonId)
			.order("day_of_week")
			.order("start_time");
		setRequests(reqs || []);
		setEntries(entryLoad || []);
		setLoading(false);
	}

	async function assign(request: any, entryId: number) {
		setAssigning(request.id);
		setMessage(null);
		try {
			// create assignment (server will validate capacity + choice membership)
			const { error } = await supabase.from("season_assignments").insert({
				season_id: seasonId,
				entry_id: entryId,
				request_id: request.id,
				user_id: request.user_id,
				group_size: request.group_size,
				allow_fill: request.allow_fill,
				payment_method: request.payment_method,
			});
			if (error) throw error;
			await load();
		} catch (e: any) {
			setMessage(e.message);
		}
		setAssigning(null);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Assignacions</CardTitle>
					<CardDescription>
						Gestiona sol·licituds i assigna classes.
					</CardDescription>
				</div>
				<Button variant="outline" size="sm" onClick={load}>
					<RefreshCw className="h-4 w-4" />
				</Button>
			</CardHeader>
			<CardContent className="space-y-4">
				{message && <p className="text-xs text-red-500">{message}</p>}
				{loading && <p className="text-xs">Carregant...</p>}
				<div className="grid md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<h4 className="text-sm font-medium">Sol·licituds</h4>
						{requests
							.filter((r) => ["pending", "approved"].includes(r.status))
							.map((r) => (
								<div
									key={r.id}
									className="p-3 bg-white/5 rounded-md border space-y-1 text-xs">
									<div className="flex justify-between">
										<span className="font-medium">Req #{r.id}</span>
										<span className="text-[10px] uppercase tracking-wide">
											{r.status}
										</span>
									</div>
									<div>
										Grup: {r.group_size} | Pagament: {r.payment_method}
									</div>
									<RequestChoices
										requestId={r.id}
										seasonId={seasonId}
										onAssign={(entryId) => assign(r, entryId)}
										entries={entries}
										assigning={assigning === r.id}
									/>
								</div>
							))}
						{requests.filter((r) => ["pending", "approved"].includes(r.status))
							.length === 0 && (
							<p className="text-[11px] text-muted-foreground">
								Sense sol·licituds actives.
							</p>
						)}
					</div>
					<div>
						<h4 className="text-sm font-medium mb-2">Entrades (capacitat)</h4>
						<div className="space-y-1 text-[11px] max-h-[300px] overflow-y-auto pr-1">
							{entries
								.filter((e) => e.kind === "class")
								.map((e) => (
									<div
										key={e.id}
										className="flex justify-between rounded border px-2 py-1">
										<span>
											{dayNames[e.day_of_week]} {e.start_time.slice(0, 5)}-
											{e.end_time.slice(0, 5)}
										</span>
										<span>
											{e.assigned_group_size || 0}/{e.capacity}
										</span>
									</div>
								))}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function RequestChoices({
	requestId,
	seasonId,
	entries,
	onAssign,
	assigning,
}: {
	requestId: number;
	seasonId: number;
	entries: any[];
	onAssign: (entryId: number) => void;
	assigning: boolean;
}) {
	const supabase = createClient();
	const [choices, setChoices] = useState<any[]>([]);
	useEffect(() => {
		load();
	}, [requestId]);
	async function load() {
		const { data } = await supabase
			.from("season_request_choices")
			.select("*, season_week_entries(*)")
			.eq("request_id", requestId);
		setChoices(data || []);
	}
	return (
		<div className="space-y-1">
			{choices.map((c) => {
				const entry = entries.find((e) => e.id === c.entry_id);
				if (!entry) return null;
				const full = entry.assigned_group_size >= entry.capacity;
				return (
					<div
						key={c.id}
						className="flex items-center justify-between gap-2 p-1.5 rounded bg-white/5">
						<span className="text-[10px]">
							{entry.start_time.slice(0, 5)}-{entry.end_time.slice(0, 5)} (
							{entry.assigned_group_size || 0}/{entry.capacity})
						</span>
						<Button
							size="sm"
							variant="secondary"
							disabled={assigning || full}
							onClick={() => onAssign(entry.id)}>
							{assigning ? "..." : "Assignar"}
						</Button>
					</div>
				);
			})}
			{choices.length === 0 && (
				<p className="text-[10px] text-muted-foreground">Sense eleccions</p>
			)}
		</div>
	);
}
