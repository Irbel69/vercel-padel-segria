"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Plus, RefreshCw, Trash2, Edit3 } from "lucide-react";

interface Season {
	id: number;
	name: string;
	date_start: string;
	date_end: string;
	enrollments_open: boolean;
	timezone: string;
}

export default function AdminSeasonsPage() {
	const supabase = createClient();
	const router = useRouter();
	const [seasons, setSeasons] = useState<Season[]>([]);
	const [loading, setLoading] = useState(false);
	const [creating, setCreating] = useState(false);
	const [form, setForm] = useState({
		name: "",
		date_start: "",
		date_end: "",
	});
	const [dialogOpen, setDialogOpen] = useState(false);
	const [range, setRange] = useState<DateRange | undefined>();
	const [message, setMessage] = useState<string | null>(null);

	// Edit state
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editForm, setEditForm] = useState({
		name: "",
		date_start: "",
		date_end: "",
	});
	const [editRange, setEditRange] = useState<DateRange | undefined>();
	const [editing, setEditing] = useState(false);
	const [editMessage, setEditMessage] = useState<string | null>(null);

	useEffect(() => {
		load();
	}, []);

	async function load() {
		setLoading(true);
		const { data, error } = await supabase
			.from("seasons")
			.select("*")
			.order("date_start", { ascending: false });
		if (error) console.error(error);
		setSeasons(data || []);
		setLoading(false);
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
			});
			if (error) throw error;
			setForm({
				name: "",
				date_start: "",
				date_end: "",
			});
			setRange(undefined);
			await load();
			setDialogOpen(false);
		} catch (e: any) {
			setMessage(e.message);
		}
		setCreating(false);
	}

	async function deleteSeason(id: number) {
		if (!confirm("Eliminar temporada i tot el seu patró?")) return;
		const { error } = await supabase.from("seasons").delete().eq("id", id);
		if (error) alert(error.message);
		load();
	}

	function openEditSeason(e: React.MouseEvent, s: Season) {
		e.stopPropagation();
		setEditingId(s.id);
		setEditForm({
			name: s.name,
			date_start: s.date_start,
			date_end: s.date_end,
		});
		setEditRange({ from: new Date(s.date_start), to: new Date(s.date_end) });
		setEditMessage(null);
		setEditDialogOpen(true);
	}

	async function updateSeason() {
		if (editingId == null) return;
		setEditing(true);
		setEditMessage(null);
		try {
			if (!editForm.name || !editForm.date_start || !editForm.date_end)
				throw new Error("Camps requerits.");
			const { error } = await supabase
				.from("seasons")
				.update({
					name: editForm.name.trim(),
					date_start: editForm.date_start,
					date_end: editForm.date_end,
				})
				.eq("id", editingId);
			if (error) throw error;
			await load();
			setEditDialogOpen(false);
		} catch (e: any) {
			setEditMessage(e.message);
		}
		setEditing(false);
	}

	return (
		<div className="space-y-6 p-4 md:p-6">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">Temporades</h1>
					<p className="text-sm text-muted-foreground">
						Selecciona una temporada per gestionar el patró setmanal i les
						assignacions.
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={load} disabled={loading}>
						<RefreshCw className="h-4 w-4 mr-1" />
						{loading ? "..." : "Refrescar"}
					</Button>
					<Dialog open={dialogOpen} onOpenChange={(o) => setDialogOpen(o)}>
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
								<div className="space-y-1">
									<label className="text-xs font-medium">Rang de dates</label>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												className="w-full justify-start text-left font-normal">
												{range?.from ? (
													range.to ? (
														`${format(range.from, "yyyy-MM-dd")} → ${format(
															range.to,
															"yyyy-MM-dd"
														)}`
													) : (
														`${format(range.from, "yyyy-MM-dd")} → …`
													)
												) : (
													<span className="text-muted-foreground">
														Selecciona dates
													</span>
												)}
											</Button>
										</PopoverTrigger>
										<PopoverContent
											disablePortal
											className="w-auto p-0"
											align="start">
											<Calendar
												mode="range"
												numberOfMonths={2}
												selected={range}
												onSelect={(r) => {
													setRange(r);
													const date_start = r?.from
														? format(r.from, "yyyy-MM-dd")
														: "";
													const date_end = r?.to
														? format(r.to, "yyyy-MM-dd")
														: "";
													setForm((f) => ({
														...f,
														date_start,
														date_end,
													}));
												}}
											/>
										</PopoverContent>
									</Popover>
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

			<Card>
				<CardHeader>
					<CardTitle>Llista</CardTitle>
					<CardDescription>Totes les temporades existents</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2 max-h-[520px] overflow-y-auto px-6">
					{seasons.map((s) => (
						<div
							key={s.id}
							className="p-3 rounded-md border cursor-pointer text-sm group relative hover:bg-accent/30"
							onClick={() => router.push(`/dashboard/admin/seasons/${s.id}`)}>
							<div className="flex justify-between items-start">
								<div>
									<p className="font-medium">{s.name}</p>
									<p className="text-[11px] text-muted-foreground">
										{s.date_start} → {s.date_end}
									</p>
								</div>
								<div className="flex items-start gap-2">
									{/* Tags: placed to the left of the buttons */}
									{(() => {
										const today = new Date();
										const start = new Date(`${s.date_start}T00:00:00`);
										const end = new Date(`${s.date_end}T23:59:59`);
										const isActive = start <= today && today <= end;
										return (
											<div className="flex flex-col items-end gap-1">
												{isActive && (
													<span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-500">
														Activa
													</span>
												)}
												{s.enrollments_open && (
													<span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-500">
														Obertes
													</span>
												)}
											</div>
										);
									})()}
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onClick={(e) => {
												e.stopPropagation();
												openEditSeason(e, s);
											}}>
											<Edit3 className="h-3 w-3" />
										</Button>
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
							</div>
						</div>
					))}
					{seasons.length === 0 && !loading && (
						<p className="text-xs text-muted-foreground">Cap temporada.</p>
					)}
					{loading && <p className="text-xs">Carregant...</p>}
				</CardContent>
			</Card>

			{/* Edit Dialog */}
			<Dialog open={editDialogOpen} onOpenChange={(o) => setEditDialogOpen(o)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Editar Temporada</DialogTitle>
						<DialogDescription>Modifica nom i rang de dates.</DialogDescription>
					</DialogHeader>
					<div className="space-y-3 py-2">
						<div>
							<label className="text-xs font-medium">Nom</label>
							<Input
								value={editForm.name}
								onChange={(e) =>
									setEditForm((f) => ({ ...f, name: e.target.value }))
								}
								placeholder="Temporada 25-26"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-xs font-medium">Rang de dates</label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className="w-full justify-start text-left font-normal">
										{editRange?.from ? (
											editRange.to ? (
												`${format(editRange.from, "yyyy-MM-dd")} → ${format(
													editRange.to,
													"yyyy-MM-dd"
												)}`
											) : (
												`${format(editRange.from, "yyyy-MM-dd")} → …`
											)
										) : (
											<span className="text-muted-foreground">
												Selecciona dates
											</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent
									disablePortal
									className="w-auto p-0"
									align="start">
									<Calendar
										mode="range"
										numberOfMonths={2}
										selected={editRange}
										onSelect={(r) => {
											setEditRange(r);
											const date_start = r?.from
												? format(r.from, "yyyy-MM-dd")
												: "";
											const date_end = r?.to ? format(r.to, "yyyy-MM-dd") : "";
											setEditForm((f) => ({ ...f, date_start, date_end }));
										}}
									/>
								</PopoverContent>
							</Popover>
						</div>
						{editMessage && (
							<p className="text-xs text-red-500">{editMessage}</p>
						)}
					</div>
					<DialogFooter>
						<Button disabled={editing} onClick={updateSeason}>
							{editing ? "Guardant..." : "Guardar"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
