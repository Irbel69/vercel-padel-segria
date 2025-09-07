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
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Plus, RefreshCw, Trash2 } from "lucide-react";

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
		timezone: "Europe/Madrid",
	});
	const [message, setMessage] = useState<string | null>(null);

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

	async function deleteSeason(id: number) {
		if (!confirm("Eliminar temporada i tot el seu patró?")) return;
		const { error } = await supabase.from("seasons").delete().eq("id", id);
		if (error) alert(error.message);
		load();
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

			<Card>
				<CardHeader>
					<CardTitle>Llista</CardTitle>
					<CardDescription>Totes les temporades existents</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
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
								<span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-500">
									Obertes
								</span>
							)}
						</div>
					))}
					{seasons.length === 0 && !loading && (
						<p className="text-xs text-muted-foreground">Cap temporada.</p>
					)}
					{loading && <p className="text-xs">Carregant...</p>}
				</CardContent>
			</Card>
		</div>
	);
}
