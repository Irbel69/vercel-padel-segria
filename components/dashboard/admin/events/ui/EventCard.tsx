import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  Edit,
  Trash2,
  Swords,
} from "lucide-react";
import type { Event } from "@/types";

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (eventId: number) => void;
  onParticipants: (event: Event) => void;
}

export function EventCard({ event, onEdit, onDelete, onParticipants }: EventCardProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ca-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ca-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
            Obert
          </Badge>
        );
      case "soon":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-500/20 text-yellow-400"
          >
            Aviat
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="secondary" className="bg-red-500/20 text-red-400">
            Tancat
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-white/10 text-white/70">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="p-2 md:p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-2 md:gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-1.5 md:gap-2 mb-1 md:mb-2">
            <h3 className="text-white font-semibold text-sm md:text-lg leading-tight">
              {event.title}
            </h3>
            {getStatusBadge(event.status)}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 md:gap-4 text-[11px] md:text-sm text-white/70">
            <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
              <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="truncate">
                {formatDate(event.date)}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
              <Users className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="truncate">
                {event.current_participants || 0}/{event.max_participants} part.
              </span>
            </div>
          </div>

          <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-white/50">
            <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                Límit: {formatDateTime(event.registration_deadline)}
              </span>
            </div>
          </div>

          {event.prizes && (
            <div className="mt-1 md:mt-2">
              <div className="flex items-start gap-1.5 md:gap-2 text-[11px] md:text-sm text-white/60">
                <Trophy className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 mt-0.5" />
                <span className="break-words leading-snug">
                  {event.prizes}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-row lg:flex-col flex-wrap gap-1.5 md:gap-2 justify-end lg:ml-4 max-w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/dashboard/admin/events/${event.id}/matches`)
            }
            className="bg-padel-primary/20 border-padel-primary/30 text-padel-primary hover:bg-padel-primary/30 flex-1 lg:flex-initial h-7 md:h-8 px-2 md:px-3"
          >
            <Swords className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="ml-1 hidden sm:inline text-[11px]">
              Partits
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onParticipants(event)}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 lg:flex-initial h-7 md:h-8 px-2 md:px-3"
          >
            <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="ml-1 hidden sm:inline text-[11px]">
              Inscrits
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(event)}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 lg:flex-initial h-7 md:h-8 px-2 md:px-3"
          >
            <Edit className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="ml-1 hidden sm:inline text-[11px]">
              Editar
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(event.id)}
            className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 flex-1 lg:flex-initial h-7 md:h-8 px-2 md:px-3"
          >
            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="ml-1 hidden sm:inline text-[11px]">
              Eliminar
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}