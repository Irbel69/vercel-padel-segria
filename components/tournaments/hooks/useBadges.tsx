import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";

export function useBadges() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="secondary" className=" bg-green-500/20 text-green-400">
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
      case "full":
        return (
          <Badge variant="secondary" className="bg-slate-700 text-slate-200">
            Complet
          </Badge>
        );
         case "almost_full":
        return (
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-300">
            Últimes Places
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-slate-700 text-slate-200">
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
            className="bg-green-500/20 text-green-400 md:bg-transparent md:text-emerald-300 md:!border-transparent md:backdrop-blur-none"
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
            className="bg-yellow-500/20 text-yellow-400"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pendent
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="bg-red-500/20 text-red-400">
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
