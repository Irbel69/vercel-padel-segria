"use client";

import React from "react";
import { Calendar, MapPin, Users, Trophy, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateMapsUrl } from '@/lib/maps';
import Link from 'next/link';
import type { Registration } from "@/types";

type Props = {
  registrations: Registration[];
  isLoading: boolean;
  processingEvents: Set<number>;
  onUnregister: (eventId: number) => void;
  formatDate: (s: string) => string;
  formatDateTime: (s: string) => string;
  canUnregister: (e: any) => boolean;
};

export default function RegistrationsList({ registrations, isLoading, processingEvents, onUnregister, formatDate, formatDateTime, canUnregister }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="h-20 w-full bg-white/5 rounded-md animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="h-12 w-12 bg-white/10 mx-auto mb-4 rounded-full" />
        <p className="text-white/60">No tens cap inscripció activa</p>
        <p className="text-white/40 text-sm mt-2">Explora els esdeveniments disponibles per participar en tornejos</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {registrations.map((registration) => (
        <div key={registration.id} className="p-3 md:p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h3 className="text-white font-semibold text-base md:text-lg">{registration.event?.title}</h3>
                {/* status badge is rendered by parent via CSS in original; keep simple here */}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{formatDate(registration.event?.date || "")}</span>
                </div>
                {registration.event?.location && (
                  <div className="flex items-center gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <Link
                        className="block flex-1 min-w-0 truncate border-b border-current pb-0.5 text-current leading-none"
                        href={generateMapsUrl(registration.event.latitude!, registration.event.longitude!, registration.event.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Obre mapa per ${registration.event.location}`}
                      >
                        {registration.event.location}
                      </Link>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{registration.event?.current_participants || 0}/{registration.event?.max_participants} participants</span>
                </div>
              </div>
              {registration.partner && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <UserCheck className="h-4 w-4 flex-shrink-0" />
                    <span>Parella: {[registration.partner.name, registration.partner.surname].filter(Boolean).join(" ") || "Nom no disponible"}</span>
                  </div>
                </div>
              )}
              <div className="mt-2 text-xs text-white/50">
                <span>Inscrit el: {formatDateTime(registration.registered_at)}</span>
              </div>

              {registration.event?.prizes && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Trophy className="h-4 w-4 flex-shrink-0" />
                    <span className="break-words">{registration.event.prizes}</span>
                  </div>
                </div>
              )}
            </div>
            {registration.status === "confirmed" && registration.event && canUnregister({ ...registration.event, user_registration_status: registration.status }) && (
              <div className="flex justify-end lg:ml-4">
                <Button
                  variant="outline"
                  onClick={() => onUnregister(registration.event_id)}
                  disabled={processingEvents.has(registration.event_id)}
                  className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm w-full sm:w-auto"
                >
                  <span className="sm:hidden">{processingEvents.has(registration.event_id) ? "..." : "Cancel·lar"}</span>
                  <span className="hidden sm:inline">{processingEvents.has(registration.event_id) ? "Cancel·lant..." : "Cancel·lar"}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
