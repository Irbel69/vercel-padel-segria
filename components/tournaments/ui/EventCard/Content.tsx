"use client";

import Image from "next/image";
import React from "react";
import Link from 'next/link';
import { Calendar, MapPin, Clock, Trophy } from "lucide-react";
import { generateMapsUrl } from '@/lib/maps';
import { shortLocation } from "./utils";
import type { Event } from "@/types";

type ContentProps = {
  event: Event;
  formatDate: (s: string) => string;
  formatDateTime: (s: string) => string;
  imageUrl?: string | null;
  // optional badge renderer passed from parent
  getRegistrationStatusBadge?: (s: string) => React.ReactNode;
  // optional effective status, e.g. 'closed' when registration deadline passed
  effectiveStatus?: string;
};

/**
 * Content section component for EventCard
 * Handles title, date, location, secondary info, and prizes
 */
export function Content({ event, formatDate, formatDateTime, imageUrl, getRegistrationStatusBadge, effectiveStatus }: ContentProps) {
  // derive partner initials for graceful fallback avatar
  const partnerFullName = event.partner ? [event.partner.name, event.partner.surname].filter(Boolean).join(' ') : '';
  const partnerInitials = partnerFullName
    ? partnerFullName.split(' ').map(n => n.charAt(0)).filter(Boolean).slice(0, 2).join('').toUpperCase()
    : 'P';

  return (
    <div className={`p-4 md:p-5 border-white/10 ${imageUrl ? 'text-white' : ''}`}>
      {/* Header with title and date */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-lg leading-tight line-clamp-2 drop-shadow-sm ${imageUrl ? 'text-white' : 'text-white'}`}>
            <span className="align-middle">{event.title}</span>
          </h3>
        </div>

        {/* Right side: date + registration badge on md+ */}
        <div className="flex items-center gap-2 flex-shrink-0">
             {event.user_registration_status && getRegistrationStatusBadge && (
            <div className="hidden md:block">{getRegistrationStatusBadge(event.user_registration_status)}</div>
          )}
          <div className={`flex items-center gap-1 ${imageUrl ? 'text-gray-100' : 'text-gray-300'} font-medium text-sm md:text-base`}>
            <Calendar className="h-4 w-4 drop-shadow-sm" />
            <span className="drop-shadow-sm">{formatDate(event.date)}</span>
          </div>
         
        </div>
      </div>

      {/* Location below title */}
      {event.location && (
        <div className={`flex items-center gap-2 mt-2 ${imageUrl ? 'text-gray-200' : 'text-gray-400'} font-medium text-sm my-1`}>
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            {/* Make the location text an underlined link that opens the maps URL in a new tab */}
            <Link
              className="block flex-1 min-w-0 truncate border-b border-current pb-0.5 text-current leading-none"
              href={generateMapsUrl(event.latitude!, event.longitude!, event.location)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Obre mapa per ${event.location}`}
            >
              {shortLocation(event.location)}
            </Link>
          </div>
        </div>
      )}

      {/* Secondary Information - Simplified */}
      <div className="flex flex-wrap gap-2 text-xs md:text-sm mb-4">
        {event.registration_deadline && (
          <div className={`flex items-center gap-1 mt-2 ${imageUrl ? 'text-gray-200' : 'text-gray-400'} font-medium text-sm my-1`}>
            {/* If event is effectively closed, render clock and text in red to indicate closed registration */}
            <Clock className={`h-4 w-4 flex-shrink-0 ${effectiveStatus === 'closed' ? 'text-red-400' : ''}`} />
            <span className={`${effectiveStatus === 'closed' ? 'text-red-400' : ''}`}>Límit d&apos;inscripció: {formatDateTime(event.registration_deadline)}</span>
          </div>
        )}

        {/* Partner info: render below the registration deadline for better hierarchy */}
        {event.user_registration_status === "confirmed" && event.partner && (
          <div className="w-full mt-2">
            <div className={`flex items-center gap-3 ${imageUrl ? 'text-emerald-200' : 'text-emerald-300'}`}>
              {/* Avatar with modern ring + subtle shadow. Use gradient fallback bg when no avatar image */}
              <div className="flex-shrink-0 rounded-full overflow-hidden w-11 h-11 ring-2 ring-white/12 shadow-sm bg-slate-700">
                {event.partner.avatar_url ? (
                  <Image
                    src={event.partner.avatar_url}
                    alt={partnerFullName || 'Perfil'}
                    width={44}
                    height={44}
                    className="object-cover w-full h-full"
                    // Ensure Google-hosted avatars load correctly (match <img referrerPolicy="no-referrer" /> used elsewhere)
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    role="img"
                    aria-label={partnerFullName ? `Avatar de ${partnerFullName}` : 'Avatar per defecte'}
                    title={partnerFullName || 'Perfil'}
                    className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-semibold text-sm"
                  >
                    {partnerInitials}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="text-sm font-medium leading-tight truncate">{[event.partner.name, event.partner.surname].filter(Boolean).join(' ') || 'Nom no disponible'}</div>
                <div className="text-xs text-gray-400">Parella</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prizes */}
      {event.prizes && (
        <div className={`mt-2 flex items-center gap-2 text-xs md:text-sm ${imageUrl ? 'text-yellow-200/95' : 'text-yellow-300/90'}`}>
          <Trophy className="h-4 w-4" />
          <span className="truncate">{event.prizes}</span>
        </div>
      )}
    </div>
  );
}