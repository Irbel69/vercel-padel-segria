"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type {
  CalendarDay,
  LessonSlotWithBookings,
} from "@/components/lessons/AdminCalendarView";
import type { ScheduleBlock } from "@/types/lessons";
import { useToast } from "@/hooks/use-toast";
import PreviewView from "./day-editor-dialog/PreviewView";
import EditView from "./day-editor-dialog/EditView";
import { formatTimeHHMM, minutesBetween } from "./day-editor-dialog/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: CalendarDay | null;
  timezone?: string;
  defaultLocation?: string;
  onSaved?: () => void; // called after successful apply
};

export default function DayEditorDialog({
  open,
  onOpenChange,
  day,
  timezone = "Europe/Madrid",
  defaultLocation = "Soses",
  onSaved,
}: Props) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [baseStart, setBaseStart] = useState<string>("16:00");
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [defaults, setDefaults] = useState<{
    max_capacity?: number;
    joinable?: boolean;
  }>({
    max_capacity: 4,
    joinable: true,
  });
  const [policy, setPolicy] = useState<"skip" | "protect" | "replace">(
    "protect"
  );
  const [location, setLocation] = useState<string>(defaultLocation);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Build initial editor state from existing slots of the day
  useEffect(() => {
    if (!open || !day) return;
    setMode("view");
    const sorted = [...day.slots].sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    );
    if (sorted.length) {
      const first = new Date(sorted[0].start_at);
      setBaseStart(formatTimeHHMM(first));
      setLocation(sorted[0].location || defaultLocation);
      const b: ScheduleBlock[] = [];
      for (let i = 0; i < sorted.length; i++) {
        const s = sorted[i];
        const start = new Date(s.start_at);
        const end = new Date(s.end_at);
        b.push({
          kind: "lesson",
          duration_minutes: Math.max(15, minutesBetween(start, end)),
          label: undefined,
          max_capacity: s.max_capacity,
          joinable: s.joinable,
        });
        // insert break between lessons
        if (i < sorted.length - 1) {
          const nextStart = new Date(sorted[i + 1].start_at);
          const breakMin = minutesBetween(end, nextStart);
          if (breakMin > 0)
            b.push({ kind: "break", duration_minutes: breakMin });
        }
      }
      setBlocks(b);
      // defaults inferred from the first slot
      setDefaults((d) => ({
        max_capacity: sorted[0].max_capacity ?? d.max_capacity,
        joinable: sorted[0].joinable ?? d.joinable,
      }));
    } else {
      // No slots that day: provide a sensible starter pattern
      setBaseStart("16:00");
      setBlocks([
        { kind: "lesson", duration_minutes: 60 },
        { kind: "break", duration_minutes: 30 },
        { kind: "lesson", duration_minutes: 60 },
      ]);
      setDefaults({ max_capacity: 4, joinable: true });
      setLocation(defaultLocation);
    }
    setResult(null);
  }, [open, day, defaultLocation]);

  const addBlock = (kind: "lesson" | "break") =>
    setBlocks((prev) => [...prev, { kind, duration_minutes: 60 }]);
  const removeBlock = (idx: number) =>
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  const moveBlock = (idx: number, dir: -1 | 1) =>
    setBlocks((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  const weekday = useMemo(() => {
    if (!day) return 0;
    const dateStr = day.date.toISOString().slice(0, 10);
    return new Date(dateStr + "T00:00:00Z").getUTCDay();
  }, [day]);

  // Build a preview list that includes lessons and pauses with concrete start/end times
  const previewItems = useMemo(() => {
    if (!day) return [] as Array<any>;
    const sorted = [...day.slots].sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    );
    const items: Array<{
      kind: "lesson" | "break";
      start: Date;
      end: Date;
      slot?: LessonSlotWithBookings;
    }> = [];
    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      const start = new Date(s.start_at);
      const end = new Date(s.end_at);
      items.push({ kind: "lesson", start, end, slot: s });
      if (i < sorted.length - 1) {
        const nextStart = new Date(sorted[i + 1].start_at);
        const breakMin = minutesBetween(end, nextStart);
        if (breakMin > 0)
          items.push({ kind: "break", start: end, end: nextStart });
      }
    }
    return items;
  }, [day]);

  const buildPayload = () => {
    if (!day) return null;
    const dateStr = day.date.toISOString().slice(0, 10);
    return {
      title: `Edició manual ${dateStr}`,
      valid_from: dateStr,
      valid_to: dateStr,
      days_of_week: [weekday],
      base_time_start: baseStart,
      location,
      timezone,
      template: { blocks, defaults },
      options: { policy, overwrite_day: true },
      // when replacing we also set force so backend can delete conflicts without bookings
      force: policy === "replace",
    };
  };

  const checkConflicts = async () => {
    const payload = buildPayload();
    if (!payload) return;
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/lessons/admin/schedules/check-conflicts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setResult(json);
    setLoading(false);
  };

  const applyChanges = async () => {
    const payload = buildPayload();
    if (!payload) return;
    setLoading(true);
    try {
      const res = await fetch("/api/lessons/admin/schedules/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setResult(json);
      if (!res.ok) {
        toast({
          title: "Error guardant canvis",
          description: json?.error || "No s'ha pogut aplicar l'horari",
          variant: "destructive",
        });
      } else {
        const c = json?.created_count ?? 0;
        const r = json?.replaced_count ?? 0;
        const s = json?.skipped_count ?? 0;
        const msg = `Creats: ${c} · Reemplaçats: ${r} · Saltats: ${s}`;
        toast({ title: "Canvis aplicats", description: msg });
        if (c + r === 0) {
          // no visible change
          toast({
            title: "Sense canvis visibles",
            description:
              "Potser hi ha conflictes amb franges existents o la política escollida no permet reemplaçar.",
            variant: "default",
          });
        }
        onSaved && onSaved();
      }
    } catch (e: any) {
      toast({
        title: "Error de xarxa",
        description: e?.message || "Revisa la connexió",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onChangeBlock = (idx: number, patch: Partial<ScheduleBlock>) =>
    setBlocks((prev) =>
      prev.map((x, i) => (i === idx ? { ...x, ...patch } : x))
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[100vw] sm:w-auto max-w-[100vw] sm:max-w-[95vw] md:max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[85vh] overflow-y-auto overflow-x-hidden p-0 sm:p-6 rounded-none sm:rounded-lg">
        <DialogHeader className="px-4 pt-4 sm:px-0 sm:pt-0">
          <DialogTitle className="text-white">
            {day
              ? day.date.toLocaleDateString("ca-ES", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "Dia"}
          </DialogTitle>
        </DialogHeader>

        {!day ? null : (
          <div className="space-y-4 px-4 pb-4 sm:px-0 sm:pb-0">
            {mode === "view" ? (
              <div className="space-y-3">
                <PreviewView day={day} previewItems={previewItems} />
                <div className="pt-2">
                  <Button onClick={() => setMode("edit")}>Editar</Button>
                </div>
              </div>
            ) : (
              <EditView
                baseStart={baseStart}
                setBaseStart={setBaseStart}
                location={location}
                setLocation={setLocation}
                defaults={defaults}
                setDefaults={setDefaults}
                policy={policy}
                setPolicy={setPolicy}
                blocks={blocks}
                setBlocks={setBlocks}
                addBlock={addBlock}
                checkConflicts={checkConflicts}
                applyChanges={applyChanges}
                loading={loading}
                setMode={setMode}
                result={result}
                onChangeBlock={onChangeBlock}
                moveBlock={moveBlock}
                removeBlock={removeBlock}
              />
            )}
          </div>
        )}

        <DialogFooter className="px-4 pb-[env(safe-area-inset-bottom)] sm:px-0">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Tancar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
