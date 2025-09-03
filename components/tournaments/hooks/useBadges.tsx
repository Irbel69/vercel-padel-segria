import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";

export function useBadges() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge
            variant="secondary"
            className="bg-green-700/55 text-white backdrop-blur-sm ring-1 ring-green-400/70 drop-shadow-[0_0_0.5rem_rgba(34,197,94,0.55)]"
          >
            Obert
          </Badge>
        );
      case "soon":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-500/25 text-amber-200 backdrop-blur-sm ring-1 ring-amber-300/50 drop-shadow-[0_0_0.45rem_rgba(245,158,11,0.45)]"
          >
            Aviat
          </Badge>
        );
      case "closed":
        return (
          <Badge
            variant="secondary"
            className="bg-red-600/25 text-red-200 backdrop-blur-sm ring-1 ring-red-400/50 drop-shadow-[0_0_0.45rem_rgba(239,68,68,0.45)]"
          >
            Tancat
          </Badge>
        );
      case "full":
        return (
          <Badge
            variant="secondary"
            className="bg-slate-800/80 text-slate-100 backdrop-blur-sm ring-1 ring-slate-300/30 drop-shadow-[0_0_0.4rem_rgba(148,163,184,0.25)]"
          >
            Complet
          </Badge>
        );
         case "almost_full":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-500/25 text-amber-200 backdrop-blur-sm ring-1 ring-amber-300/50 drop-shadow-[0_0_0.45rem_rgba(245,158,11,0.45)]"
          >
            Últimes Places
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-slate-800/80 text-slate-100 backdrop-blur-sm ring-1 ring-slate-300/30 drop-shadow-[0_0_0.4rem_rgba(148,163,184,0.25)]"
          >
            {status}
          </Badge>
        );
    }
  };

  const getRegistrationStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          // Add responsive classes so on md+ we show a compact badge suitable to be placed next to the title
          <Badge
            variant="secondary"
            className="bg-green-600/25 text-white backdrop-blur-sm ring-1 ring-green-300/60 drop-shadow-[0_0_0.45rem_rgba(34,197,94,0.55)] md:bg-transparent md:text-emerald-300 md:ring-0 md:drop-shadow-[0_0_0.25rem_rgba(52,211,153,0.35)] md:backdrop-blur-0"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            <span className="hidden md:inline">Confirmat</span>
            <span className="md:hidden">Confirmat</span>
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-500/25 text-amber-200 backdrop-blur-sm ring-1 ring-amber-300/50 drop-shadow-[0_0_0.45rem_rgba(245,158,11,0.45)]"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pendent
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="secondary"
            className="bg-red-600/25 text-red-200 backdrop-blur-sm ring-1 ring-red-400/50 drop-shadow-[0_0_0.45rem_rgba(239,68,68,0.45)]"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Cancel·lat
          </Badge>
        );
      default:
        return null;
    }
  };

  return { getStatusBadge, getRegistrationStatusBadge } as const;
}
