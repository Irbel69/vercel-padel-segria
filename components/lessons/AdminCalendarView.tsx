"use client";

import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export interface LessonSlotWithBookings {
  id: number;
  start_at: string;
  end_at: string;
  max_capacity: number;
  location: string;
  status: "open" | "full" | "cancelled" | "closed";
  joinable: boolean;
  booking_count?: number;
  participants_count?: number;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  slots: LessonSlotWithBookings[];
}

interface Props {
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  onSlotClick?: (slot: LessonSlotWithBookings, date: Date) => void;
  onDayClick?: (day: CalendarDay) => void;
}

export function AdminCalendarView({
  currentDate = new Date(),
  onDateChange,
  onSlotClick,
  onDayClick,
}: Props) {
  const [viewDate, setViewDate] = useState(currentDate);
  const [slots, setSlots] = useState<LessonSlotWithBookings[]>([]);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const startOfMonth = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() + 1,
      0
    );
    const from = fmt(startOfMonth);
    const to = fmt(endOfMonth);

    setLoading(true);
    fetch(`/api/lessons/admin/slots?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((slotsData) => setSlots(slotsData.slots || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [viewDate]);

  const calendarDays = useMemo(() => {
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const startOfMonth = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() + 1,
      0
    );

    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7));

    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - ((endDate.getDay() + 6) % 7)));

    const days: CalendarDay[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = fmt(current);
      const daySlots = slots.filter((slot) => {
        const slotDate = fmt(new Date(slot.start_at));
        return slotDate === dateStr;
      });
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === viewDate.getMonth(),
        slots: daySlots,
      });
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [viewDate, slots]);

  const navigateMonth = (direction: "prev" | "next") => {
    // Normalize to day 1 before changing month to avoid overflow (e.g., Aug 31 -> Oct 1)
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + (direction === "next" ? 1 : -1);
    const newDate = new Date(year, month, 1);
    setViewDate(newDate);
    onDateChange?.(newDate);
  };

  const getSlotStatusColor = (slot: LessonSlotWithBookings) => {
    const isPast = new Date(slot.start_at).getTime() < Date.now();
    if (isPast) {
      // Grey out any past slot regardless of status
      return "bg-gray-500/20 text-gray-300 opacity-70";
    }
    switch (slot.status) {
      case "open":
        return "bg-green-500/20 text-green-300";
      case "full":
        return "bg-yellow-500/20 text-yellow-300";
      case "cancelled":
        return "bg-red-500/20 text-red-300";
      case "closed":
        return "bg-gray-500/20 text-gray-300";
      default:
        return "bg-blue-500/20 text-blue-300";
    }
  };

  const getDayIndicator = (day: CalendarDay) => {
    if (day.slots.some((s) => s.status === "open")) return "bg-green-400";
    if (day.slots.some((s) => s.status === "full")) return "bg-yellow-400";
    if (day.slots.some((s) => s.status === "cancelled")) return "bg-red-400";
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white/70">Carregant calendari...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          {viewDate.toLocaleDateString("es-ES", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("prev")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewDate(new Date())}
          >
            Avui
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("next")}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "grid grid-cols-7 gap-1",
          isMobile && "w-full max-w-full overflow-x-clip"
        )}
      >
        {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((day) => (
          <div
            key={day}
            className={cn(
              "p-2 text-center font-medium text-white/60",
              isMobile ? "text-[11px]" : "text-sm"
            )}
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => (
          <Card
            key={index}
            className={cn(
              "relative p-2 cursor-pointer transition-colors hover:bg-white/5",
              isMobile ? "min-h-[56px]" : "min-h-24",
              !day.isCurrentMonth && "opacity-50",
              day.date.toDateString() === new Date().toDateString() &&
                "ring-1 ring-blue-400"
            )}
            onClick={() => onDayClick?.(day)}
          >
            <div className="text-sm font-medium text-white mb-1">
              {day.date.getDate()}
            </div>

            {isMobile ? (
              <div className="absolute right-1 bottom-1">
                {(() => {
                  const color = getDayIndicator(day);
                  if (!color) return null;
                  return (
                    <div
                      className={cn("h-1.5 w-1.5 rounded-full", color)}
                      aria-label={`${day.slots.length} classes`}
                    />
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-1">
                {day.slots.slice(0, 3).map((slot) => (
                  <div
                    key={slot.id}
                    className={cn(
                      "text-xs p-1 rounded cursor-pointer transition-opacity hover:opacity-80",
                      getSlotStatusColor(slot)
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSlotClick?.(slot, day.date);
                    }}
                  >
                    <div className="flex items-center gap-1 justify-between">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {(() => {
                          const start = new Date(slot.start_at);
                          const end = new Date(slot.end_at);
                          const startTime = start.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                          const durationMinutes = Math.round(
                            (end.getTime() - start.getTime()) / 60000
                          );
                          const durationLabel =
                            durationMinutes >= 60
                              ? `${Math.floor(durationMinutes / 60)}h${
                                  durationMinutes % 60
                                    ? ` ${durationMinutes % 60}m`
                                    : ""
                                }`
                              : `${durationMinutes}m`;
                          return (
                            <div>
                              <span>
                                {startTime} · {durationLabel}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                      {typeof slot.participants_count === "number" && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Users className="w-3 h-3" />
                          <span>
                            {slot.participants_count}/{slot.max_capacity}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {day.slots.length > 3 && (
                  <div className="text-xs text-white/50 px-1">
                    +{day.slots.length - 3} més
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500/20"></div>
          <span className="text-white/70">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500/20"></div>
          <span className="text-white/70">Complet</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500/20"></div>
          <span className="text-white/70">Cancel·lat</span>
        </div>
      </div>
    </div>
  );
}
