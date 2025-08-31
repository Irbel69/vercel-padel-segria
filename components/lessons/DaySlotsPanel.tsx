"use client";

import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Clock, Users, Check } from "lucide-react";
import type { LessonSlot } from "@/types/lessons";
import { cn } from "@/lib/utils";
import { BookingDialog } from "@/components/lessons/BookingDialog";

export interface DaySlotsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  slots: LessonSlot[];
}

function isSlotFull(slot: LessonSlot) {
  return (
    (typeof slot.participants_count === "number"
      ? slot.participants_count
      : 0) >= (slot.max_capacity || 0)
  );
}

function isSlotLocked(slot: LessonSlot) {
  return slot.joinable === false;
}

function isSlotBookable(slot: LessonSlot) {
  return (
    slot.status === "open" &&
    !slot.user_booked &&
    !isSlotLocked(slot) &&
    !isSlotFull(slot)
  );
}

function statusColor(slot: LessonSlot) {
  if (slot.user_booked)
    return "bg-blue-500/30 text-blue-200 ring-1 ring-blue-400/40";
  // Show locked or capacity reached as full
  if (isSlotLocked(slot) || isSlotFull(slot))
    return "bg-yellow-500/20 text-yellow-300";
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
}

export function DaySlotsPanel({
  open,
  onOpenChange,
  date,
  slots,
}: DaySlotsPanelProps) {
  const title = useMemo(() => {
    if (!date) return "";
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  }, [date]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[380px] sm:w-[440px] md:w-[520px] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="capitalize">
            {title || "Selecciona un dia"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {slots.length === 0 && (
            <div className="text-white/70 text-sm">
              No hi ha classes per a aquest dia.
            </div>
          )}
          {slots.map((slot) => {
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
                    durationMinutes % 60 ? ` ${durationMinutes % 60}m` : ""
                  }`
                : `${durationMinutes}m`;
            const isBookable = isSlotBookable(slot);
            return (
              <div key={slot.id} className="flex items-center gap-2">
                {isBookable ? (
                  <BookingDialog
                    slotId={slot.id}
                    slotParticipantsCount={slot.participants_count || 0}
                    slotStatus={slot.status}
                    allowFillPolicy={slot.allow_fill_policy}
                    trigger={
                      <button
                        className={cn(
                          "w-full text-left text-sm p-2 rounded cursor-pointer transition-opacity hover:opacity-80",
                          statusColor(slot)
                        )}
                        aria-label={`Apuntar-me ${startTime} · ${durationLabel}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <div>
                              <span>
                                {startTime} · {durationLabel}
                              </span>
                            </div>
                          </div>
                          {typeof slot.participants_count === "number" && (
                            <div className="flex items-center gap-1 text-xs">
                              <Users className="w-4 h-4" />
                              <span>
                                {slot.participants_count}/{slot.max_capacity}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    }
                  />
                ) : (
                  <div
                    className={cn(
                      "w-full text-left text-sm p-2 rounded",
                      statusColor(slot)
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2 justify-between">
                      {slot.user_booked ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="flex-1">
                            {startTime} · {durationLabel} · Reservada per tu
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span>
                                {startTime} · {durationLabel}
                              </span>
                              {(isSlotLocked(slot) ||
                                isSlotFull(slot) ||
                                slot.status === "full") && (
                                <span className="ml-2">· Complet</span>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                      {typeof slot.participants_count === "number" && (
                        <div className="flex items-center gap-1 text-xs">
                          <Users className="w-4 h-4" />
                          <span>
                            {slot.participants_count}/{slot.max_capacity}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default DaySlotsPanel;
