"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon, RefreshCw } from "lucide-react";

export default function AdminLessonsPage() {
	const [slots, setSlots] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [rulesList, setRulesList] = useState<any[]>([]);
	const [genRangeOpen, setGenRangeOpen] = useState(false);
	const [genRange, setGenRange] = useState<{ from?: Date; to?: Date }>({});

	// Rule form state (simple)
	const [rule, setRule] = useState<any>({
		title: "Horari d'estiu",
		valid_from: undefined as Date | undefined,
		valid_to: undefined as Date | undefined,
		days_of_week: [1, 2, 3, 4, 5] as number[], // Mon-Fri
		time_start: "16:00",
		time_end: "21:00",
		duration_minutes: 60,
		location: "Soses",
		active: true,
	});
	const [ruleDateOpen, setRuleDateOpen] = useState(false);

	// Override form
	const [overrideItem, setOverrideItem] = useState<any>({
		date: undefined as Date | undefined,
		time_start: "",
		time_end: "",
		kind: "closed",
		reason: "",
		location: "Soses",
	});
	const [overrideDateOpen, setOverrideDateOpen] = useState(false);

	// Ad-hoc slot form
	const [adhoc, setAdhoc] = useState<any>({
		start_at: "",
		end_at: "",
		max_capacity: 4,
		location: "Soses",
		status: "open",
		joinable: true,
	});

	useEffect(() => {
		setLoading(true);
		fetch("/api/lessons/admin/slots")
			.then((r) => r.json())
			.then((json) => setSlots(json.slots ?? []))
			.catch((e) => setError(e?.message ?? "Unknown error"))
			.finally(() => setLoading(false));
		// fetch rules
		fetch("/api/lessons/admin/rules")
			.then((r) => r.json())
			.then((json) => setRulesList(json.rules ?? []))
			.catch(() => {})
			.finally(() => {});
	}, []);

	const generateSlots = async () => {
		setLoading(true);
		setError(null);
		const res = await fetch("/api/lessons/admin/generate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				from: genRange.from
					? genRange.from.toISOString().slice(0, 10)
					: undefined,
				to: genRange.to ? genRange.to.toISOString().slice(0, 10) : undefined,
			}),
		});
		const json = await res.json().catch(() => ({}));
		if (!res.ok) setError(json?.error || "Error generant slots");
		// refresh list
		await fetch("/api/lessons/admin/slots")
			.then((r) => r.json())
			.then((j) => setSlots(j.slots ?? []));
		setLoading(false);
	};

	const createRule = async () => {
		setError(null);
		const payload = {
			title: rule.title,
			valid_from: rule.valid_from
				? rule.valid_from.toISOString().slice(0, 10)
				: null,
			valid_to: rule.valid_to ? rule.valid_to.toISOString().slice(0, 10) : null,
			days_of_week: rule.days_of_week,
			time_start: rule.time_start,
			time_end: rule.time_end,
			duration_minutes: Number(rule.duration_minutes) || 60,
			location: rule.location,
			active: !!rule.active,
		};
		const res = await fetch("/api/lessons/admin/rules", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		const json = await res.json().catch(() => ({}));
		if (!res.ok) setError(json?.error || "Error creant regla");
	};

	const createOverride = async () => {
		setError(null);
		const body = {
			date: overrideItem.date
				? overrideItem.date.toISOString().slice(0, 10)
				: null,
			time_start: overrideItem.time_start || null,
			time_end: overrideItem.time_end || null,
			kind: overrideItem.kind,
			reason: overrideItem.reason,
			location: overrideItem.location,
		};
		const res = await fetch("/api/lessons/admin/overrides", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		const json = await res.json().catch(() => ({}));
		if (!res.ok) setError(json?.error || "Error creant excepció");
	};

	const createAdhoc = async () => {
		setError(null);
		const res = await fetch("/api/lessons/admin/slots", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(adhoc),
		});
		const json = await res.json().catch(() => ({}));
		if (!res.ok) setError(json?.error || "Error creant slot");
		else setSlots((prev) => [json.slot, ...prev]);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-white"></h1>
				<Button variant="secondary" onClick={() => window.location.reload()}>
					<RefreshCw className="w-4 h-4 mr-2" /> Refrescar
				</Button>
			</div>

			<Tabs defaultValue="generate" className="w-full">
				<TabsList className="grid grid-cols-4 w-full">
					<TabsTrigger value="generate">Generar</TabsTrigger>
					<TabsTrigger value="rules">Regles</TabsTrigger>
					<TabsTrigger value="overrides">Excepcions</TabsTrigger>
					<TabsTrigger value="adhoc">Slots ad-hoc</TabsTrigger>
				</TabsList>

				<TabsContent value="generate" className="mt-4 space-y-4">
					<Card className="p-4 space-y-4">
						<div className="space-y-2">
							<Label className="text-white/90">Rang de dates</Label>
							<Popover open={genRangeOpen} onOpenChange={setGenRangeOpen}>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className="justify-start w-full text-left">
										<CalendarIcon className="mr-2 h-4 w-4" />
										{genRange.from && genRange.to
											? `${genRange.from.toLocaleDateString()} - ${genRange.to.toLocaleDateString()}`
											: "Selecciona interval"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="p-0" align="start">
									<Calendar
										mode="range"
										selected={genRange as any}
										onSelect={(r: any) => setGenRange(r ?? {})}
										numberOfMonths={2}
									/>
								</PopoverContent>
							</Popover>
						</div>
						<Button
							onClick={generateSlots}
							disabled={loading || !genRange.from || !genRange.to}>
							Generar slots
						</Button>
					</Card>

					<Card className="p-4">
						<h3 className="text-white font-semibold mb-3">Slots existents</h3>
						<div className="grid gap-3">
							{slots.map((s) => (
								<Card key={s.id} className="p-3">
									<div className="text-white font-medium">
										{new Date(s.start_at).toLocaleString()} →{" "}
										{new Date(s.end_at).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</div>
									<div className="text-white/70 text-sm">
										{s.location} • {s.status} • joinable: {String(s.joinable)}
									</div>
								</Card>
							))}
							{!loading && !error && slots.length === 0 && (
								<div className="text-white/70">
									Encara no hi ha slots creats.
								</div>
							)}
						</div>
					</Card>
				</TabsContent>

				<TabsContent value="rules" className="mt-4">
					<Card className="p-4 space-y-4">
						<div className="grid md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-white/90">Títol</Label>
								<Input
									placeholder="Títol"
									value={rule.title}
									onChange={(e) => setRule({ ...rule, title: e.target.value })}
								/>
							</div>

							<div className="space-y-2">
								<Label className="text-white/90">Activa</Label>
								<div className="h-10 flex items-center px-2 rounded-md border border-white/10">
									<Switch
										checked={rule.active}
										onCheckedChange={(v) =>
											setRule({ ...rule, active: Boolean(v) })
										}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label className="text-white/90">Vàlida des de/fins</Label>
								<Popover open={ruleDateOpen} onOpenChange={setRuleDateOpen}>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className="justify-start w-full text-left">
											<CalendarIcon className="mr-2 h-4 w-4" />
											{rule.valid_from && rule.valid_to
												? `${rule.valid_from.toLocaleDateString()} - ${rule.valid_to.toLocaleDateString()}`
												: "Selecciona dates"}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="p-0" align="start">
										<Calendar
											mode="range"
											selected={
												{ from: rule.valid_from, to: rule.valid_to } as any
											}
											onSelect={(r: any) =>
												setRule({
													...rule,
													valid_from: r?.from,
													valid_to: r?.to,
												})
											}
											numberOfMonths={2}
										/>
									</PopoverContent>
								</Popover>
							</div>

							<div className="space-y-2">
								<Label className="text-white/90">Dies de la setmana</Label>
								<div className="flex flex-wrap gap-2">
									{[0, 1, 2, 3, 4, 5, 6].map((d) => (
										<Button
											key={d}
											type="button"
											variant={
												rule.days_of_week.includes(d) ? "default" : "outline"
											}
											className="h-9"
											onClick={() => {
												setRule((prev: any) => {
													const set = new Set<number>(prev.days_of_week);
													if (set.has(d)) set.delete(d);
													else set.add(d);
													return {
														...prev,
														days_of_week: Array.from(set).sort((a, b) => a - b),
													};
												});
											}}>
											{["Dg", "Dl", "Dt", "Dc", "Dj", "Dv", "Ds"][d]}
										</Button>
									))}
								</div>
							</div>

							<div className="space-y-2">
								<Label className="text-white/90">Hora inici</Label>
								<Input
									type="time"
									value={rule.time_start}
									onChange={(e) =>
										setRule({ ...rule, time_start: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-white/90">Hora fi</Label>
								<Input
									type="time"
									value={rule.time_end}
									onChange={(e) =>
										setRule({ ...rule, time_end: e.target.value })
									}
								/>
							</div>

							<div className="space-y-2">
								<Label className="text-white/90">Duració (min)</Label>
								<Select
									value={String(rule.duration_minutes)}
									onValueChange={(v) =>
										setRule({ ...rule, duration_minutes: Number(v) })
									}>
									<SelectTrigger>
										<SelectValue placeholder="Duració" />
									</SelectTrigger>
									<SelectContent>
										{[30, 45, 60, 75, 90].map((m) => (
											<SelectItem key={m} value={String(m)}>
												{m}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label className="text-white/90">Ubicació</Label>
								<Input
									value={rule.location}
									onChange={(e) =>
										setRule({ ...rule, location: e.target.value })
									}
								/>
							</div>
						</div>
						<div className="pt-2">
							<Button onClick={createRule}>Crear regla</Button>
						</div>
					</Card>
					<Card className="p-4 mt-4">
						<h3 className="text-white font-semibold mb-3">Regles existents</h3>
						<div className="grid gap-3">
							{rulesList.map((r) => (
								<Card key={r.id} className="p-3">
									<div className="flex justify-between items-center">
										<div>
											<div className="text-white font-medium">
												{r.title || `Regla #${r.id}`}
											</div>
											<div className="text-white/70 text-sm">
												Dies:{" "}
												{Array.isArray(r.days_of_week)
													? r.days_of_week.join(",")
													: r.days_of_week}{" "}
												• {r.time_start} - {r.time_end} • Dur:{" "}
												{r.duration_minutes}min
											</div>
											<div className="text-white/60 text-xs">
												Vàlid: {r.valid_from || "∞"} → {r.valid_to || "∞"}
											</div>
										</div>
										<div className="text-right">
											<div className="text-sm text-white/80">
												{r.active ? "Activa" : "Inactiva"}
											</div>
										</div>
									</div>
								</Card>
							))}
							{rulesList.length === 0 && (
								<div className="text-white/70">Encara no hi ha regles.</div>
							)}
						</div>
					</Card>
				</TabsContent>

				<TabsContent value="overrides" className="mt-4">
					<Card className="p-4 space-y-4">
						<div className="grid md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-white/90">Data</Label>
								<Popover
									open={overrideDateOpen}
									onOpenChange={setOverrideDateOpen}>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className="justify-start w-full text-left">
											<CalendarIcon className="mr-2 h-4 w-4" />
											{overrideItem.date
												? overrideItem.date.toLocaleDateString()
												: "Selecciona data"}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="p-0" align="start">
										<Calendar
											mode="single"
											selected={overrideItem.date}
											onSelect={(d: any) =>
												setOverrideItem({ ...overrideItem, date: d })
											}
										/>
									</PopoverContent>
								</Popover>
							</div>
							<div className="space-y-2">
								<Label className="text-white/90">Franja (opcional)</Label>
								<div className="grid grid-cols-2 gap-2">
									<Input
										type="time"
										placeholder="Inici"
										value={overrideItem.time_start}
										onChange={(e) =>
											setOverrideItem({
												...overrideItem,
												time_start: e.target.value,
											})
										}
									/>
									<Input
										type="time"
										placeholder="Fi"
										value={overrideItem.time_end}
										onChange={(e) =>
											setOverrideItem({
												...overrideItem,
												time_end: e.target.value,
											})
										}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label className="text-white/90">Tipus</Label>
								<Select
									value={overrideItem.kind}
									onValueChange={(v) =>
										setOverrideItem({ ...overrideItem, kind: v })
									}>
									<SelectTrigger>
										<SelectValue placeholder="Tipus" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="closed">Tancat</SelectItem>
										<SelectItem value="open">Obert</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label className="text-white/90">Motiu</Label>
								<Input
									placeholder="Motiu"
									value={overrideItem.reason}
									onChange={(e) =>
										setOverrideItem({ ...overrideItem, reason: e.target.value })
									}
								/>
							</div>
						</div>
						<div className="pt-2">
							<Button onClick={createOverride}>Crear excepció</Button>
						</div>
					</Card>
				</TabsContent>

				<TabsContent value="adhoc" className="mt-4">
					<Card className="p-4 space-y-4">
						<div className="grid md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-white/90">Inici</Label>
								<Input
									type="datetime-local"
									value={adhoc.start_at}
									onChange={(e) =>
										setAdhoc({ ...adhoc, start_at: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-white/90">Fi</Label>
								<Input
									type="datetime-local"
									value={adhoc.end_at}
									onChange={(e) =>
										setAdhoc({ ...adhoc, end_at: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-white/90">Capacitat (1-4)</Label>
								<Select
									value={String(adhoc.max_capacity)}
									onValueChange={(v) =>
										setAdhoc({ ...adhoc, max_capacity: Number(v) })
									}>
									<SelectTrigger>
										<SelectValue placeholder="Capacitat" />
									</SelectTrigger>
									<SelectContent>
										{[1, 2, 3, 4].map((n) => (
											<SelectItem key={n} value={String(n)}>
												{n}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label className="text-white/90">Permetre completar</Label>
								<div className="h-10 flex items-center px-2 rounded-md border border-white/10">
									<Switch
										checked={adhoc.joinable}
										onCheckedChange={(v) =>
											setAdhoc({ ...adhoc, joinable: Boolean(v) })
										}
									/>
								</div>
							</div>
						</div>
						<div className="pt-2">
							<Button onClick={createAdhoc}>Crear slot</Button>
						</div>
					</Card>
				</TabsContent>
			</Tabs>

			{loading && <div className="text-white/70">Carregant…</div>}
			{error && <div className="text-red-400">{error}</div>}
		</div>
	);
}
