"use client";

import Image from "next/image";
import React from "react";
import Link from 'next/link';
import { Calendar, MapPin, Clock, Trophy, User } from "lucide-react";
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

        {event.user_registration_status === "confirmed" && event.partner && (
          <div className={`flex items-center gap-1 ${imageUrl ? 'text-emerald-200' : 'text-emerald-300'}`}>
            {event.partner.avatar_url ? (
              <div className="flex items-center justify-center flex-shrink-0">
                <Image
                  src={event.partner.avatar_url}
                  alt={`${event.partner.name} ${event.partner.surname}`}
                  width={28}
                  height={28}
                  className="block rounded-full object-cover md:ring-0 md:bg-amber-400/10 md:shadow-none"
                />
              </div>
            ) : (
              // On md+ show a yellow circular bg and remove border for the people/assistance icon per request
              <div className="h-7 w-7 rounded-full flex items-center justify-center bg-emerald-0 md:bg-amber-400 md:text-yellow-900 md:shadow-none flex-shrink-0">
                <User className="h-4 w-4 md:h-4 md:w-4" />
              </div>
            )}
            <span className={`text-sm ${imageUrl ? 'text-gray-100' : ''} leading-none min-w-0 truncate`}> 
              {[event.partner.name, event.partner.surname].filter(Boolean).join(" ") || "Nom no disponible"}
            </span>
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