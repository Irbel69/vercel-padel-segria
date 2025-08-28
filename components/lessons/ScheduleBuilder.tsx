"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ScheduleTemplate, ScheduleBlock, LessonSlotBatchOptions } from "@/types/lessons";
import { Calendar as CalendarIcon, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface Props {
  onCheckConflicts: (payload: any) => Promise<any>;
  onApply: (payload: any) => Promise<any>;
}

export default function ScheduleBuilder({ onCheckConflicts, onApply }: Props) {
  const [title, setTitle] = useState<string>("Patró modular");
  const [validRange, setValidRange] = useState<{ from?: Date; to?: Date }>({});
  const [dateOpen, setDateOpen] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1,2,3,4,5]);
  const [baseStart, setBaseStart] = useState<string>("16:00");
  const [location, setLocation] = useState<string>("Soses");
  const [timezone, setTimezone] = useState<string>("Europe/Madrid");
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([
    { kind: 'lesson', duration_minutes: 60 },
    { kind: 'break', duration_minutes: 30 },
    { kind: 'lesson', duration_minutes: 60 },
  ]);
  const [defaults, setDefaults] = useState<{ max_capacity?: number; joinable?: boolean }>({ max_capacity: 4, joinable: true });
  const [policy, setPolicy] = useState<LessonSlotBatchOptions['policy']>('skip');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const toggleDay = (d: number) => {
    setDaysOfWeek(prev => {
      const set = new Set(prev);
      if (set.has(d)) set.delete(d); else set.add(d);
      return Array.from(set).sort((a,b)=>a-b);
    });
  };

  const addBlock = (kind: 'lesson' | 'break') => {
    setBlocks(prev => [...prev, { kind, duration_minutes: 60 }]);
  };
  const removeBlock = (idx: number) => {
    setBlocks(prev => prev.filter((_, i) => i !== idx));
  };
  const moveBlock = (idx: number, dir: -1 | 1) => {
    setBlocks(prev => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[idx]; next[idx] = next[j]; next[j] = tmp;
      return next;
    });
  };

  const payloadBase = () => ({
    title,
    valid_from: validRange.from ? validRange.from.toISOString().slice(0,10) : undefined,
    valid_to: validRange.to ? validRange.to.toISOString().slice(0,10) : undefined,
    days_of_week: daysOfWeek,
    base_time_start: baseStart,
    location,
    timezone,
    template: { blocks, defaults },
  });

  const handleCheck = async () => {
    setLoading(true);
    setResult(null);
    const payload = payloadBase();
    const res = await onCheckConflicts(payload);
    setResult(res);
    setLoading(false);
  };

  const handleApply = async () => {
    setLoading(true);
    const payload = { ...payloadBase(), options: { policy } };
    const res = await onApply(payload);
    setResult(res);
    setLoading(false);
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white">Patró modular</h3>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white/90">Títol</Label>
          <Input value={title} onChange={e=>setTitle(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label className="text-white/90">Ubicació</Label>
          <Input value={location} onChange={e=>setLocation(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label className="text-white/90">Zona horària</Label>
          <Input value={timezone} onChange={e=>setTimezone(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label className="text-white/90">Vàlida des de/fins</Label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start w-full text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {validRange.from && validRange.to
                  ? `${validRange.from.toLocaleDateString()} - ${validRange.to.toLocaleDateString()}`
                  : "Selecciona dates"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Calendar mode="range" selected={validRange as any} onSelect={(r:any)=>setValidRange(r)} numberOfMonths={2} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-white/90">Dies de la setmana</Label>
          <div className="flex flex-wrap gap-2">
            {[0,1,2,3,4,5,6].map(d=> (
              <Button key={d} type="button" variant={daysOfWeek.includes(d)?'default':'outline'} className="h-9" onClick={()=>toggleDay(d)}>
                {["Dg","Dl","Dt","Dc","Dj","Dv","Ds"][d]}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white/90">Hora base inici</Label>
          <Input type="time" value={baseStart} onChange={e=>setBaseStart(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label className="text-white/90">Defectes (capacitat / joinable)</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" min={1} max={4} placeholder="Capacitat" value={defaults.max_capacity ?? 4} onChange={e=>setDefaults(d=>({ ...d, max_capacity: Number(e.target.value||4)}))} />
            <Select value={String(defaults.joinable ?? true)} onValueChange={v=>setDefaults(d=>({ ...d, joinable: v === 'true' }))}>
              <SelectTrigger><SelectValue placeholder="Joinable" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Permetre omplir</SelectItem>
                <SelectItem value="false">No omplible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white/90">Blocs</Label>
        <div className="space-y-2">
          {blocks.map((b, idx) => (
            <Card key={idx} className="p-3 flex items-center gap-3">
              <Select value={b.kind} onValueChange={v=>setBlocks(prev=> prev.map((x,i)=> i===idx? { ...x, kind: v as any }: x))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lesson">Classe</SelectItem>
                  <SelectItem value="break">Pausa</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" className="w-32" value={b.duration_minutes} onChange={e=>setBlocks(prev=> prev.map((x,i)=> i===idx? { ...x, duration_minutes: Number(e.target.value||60)}: x))} />
              {b.kind === 'lesson' && (
                <>
                  <Input placeholder="Etiqueta" className="w-40" value={b.label || ''} onChange={e=>setBlocks(prev=> prev.map((x,i)=> i===idx? { ...x, label: e.target.value }: x))} />
                  <Input type="number" className="w-28" placeholder="Cap" value={b.max_capacity ?? ''} onChange={e=>setBlocks(prev=> prev.map((x,i)=> i===idx? { ...x, max_capacity: e.target.value? Number(e.target.value): undefined }: x))} />
                  <Select
                    value={b.joinable === undefined ? 'default' : String(b.joinable)}
                    onValueChange={v=>setBlocks(prev=> prev.map((x,i)=> i===idx? { ...x, joinable: v === 'default' ? undefined : v === 'true' }: x))}
                  >
                    <SelectTrigger className="w-32"><SelectValue placeholder="Joinable?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">(per defecte)</SelectItem>
                      <SelectItem value="true">Sí</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
              <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="icon" onClick={()=>moveBlock(idx,-1)}><ArrowUp className="w-4 h-4"/></Button>
                <Button variant="ghost" size="icon" onClick={()=>moveBlock(idx,1)}><ArrowDown className="w-4 h-4"/></Button>
                <Button variant="destructive" size="icon" onClick={()=>removeBlock(idx)}><Trash2 className="w-4 h-4"/></Button>
              </div>
            </Card>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>addBlock('lesson')}><Plus className="w-4 h-4 mr-1"/> Afegir classe</Button>
          <Button variant="outline" onClick={()=>addBlock('break')}><Plus className="w-4 h-4 mr-1"/> Afegir pausa</Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white/90">Política de conflicte</Label>
        <Select value={policy} onValueChange={v=>setPolicy(v as any)}>
          <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="skip">Saltar conflictes</SelectItem>
            <SelectItem value="protect">Protegir reserves</SelectItem>
            <SelectItem value="replace">Reemplaçar sense reserves</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleCheck} disabled={loading}>Comprovar conflictes</Button>
        <Button onClick={handleApply} disabled={loading}>
          {loading ? 'Processant...' : 'Aplicar patró'}
        </Button>
      </div>

      {result && (
        <Card className="p-3 text-white/90">
          <pre className="whitespace-pre-wrap text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </Card>
  );
}
