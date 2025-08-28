"use client";

import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationMapButtonProps {
	latitude: number;
	longitude: number;
	location: string;
  className?: string;
  ariaLabel?: string;
}

export function LocationMapButton({
	latitude,
	longitude,
	location,
  className,
  ariaLabel,
}: LocationMapButtonProps) {
	const openInMaps = () => {
		// Detect platform and open appropriate maps
		const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
		const mapsUrl = isMac
			? `maps://maps.apple.com/?q=${encodeURIComponent(location)}&ll=${latitude},${longitude}&z=15`
			: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

		window.open(mapsUrl, "_blank");
	};

	return (
			<Button
				variant="outline"
				size="sm"
				onClick={openInMaps}
				aria-label={ariaLabel ?? `Veure ubicació: ${location}`}
				className={"bg-padel-primary/20 text-padel-primary hover:bg-padel-primary/30 " + (className ?? "")}
			>
				<MapPin className="h-4 w-4 mr-1" />
				<span className="hidden sm:inline">Veure ubicació</span>
				<span className="sm:hidden">Mapa</span>
			</Button>
	);
}
