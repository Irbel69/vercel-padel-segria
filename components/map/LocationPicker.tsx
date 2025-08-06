"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search } from "lucide-react";

// Interfaces
interface LocationData {
	name: string;
	latitude: number | null;
	longitude: number | null;
}

interface LocationPickerProps {
	value: LocationData;
	onChange: (location: LocationData) => void;
}

// Dynamically import the MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import("./MapComponent"), {
	ssr: false,
	loading: () => (
		<div className="h-[300px] w-full rounded-md bg-white/5 border border-white/20 flex items-center justify-center">
			<div className="text-white/60">Carregant mapa...</div>
		</div>
	),
});

export default function LocationPicker({
	value,
	onChange,
}: LocationPickerProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearching, setIsSearching] = useState(false);

	const handleMapClick = useCallback(
		(lat: number, lng: number) => {
			// Update coordinates and try to reverse geocode
			onChange({
				...value,
				latitude: lat,
				longitude: lng,
			});

			// Optional: Reverse geocoding to get address
			reverseGeocode(lat, lng);
		},
		[value, onChange]
	);

	const reverseGeocode = async (lat: number, lng: number) => {
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ca,es,en`
			);
			const data = await response.json();

			if (data.display_name && !value.name) {
				// Only update name if it's empty
				onChange({
					name: data.display_name,
					latitude: lat,
					longitude: lng,
				});
			}
		} catch (error) {
			console.error("Error reverse geocoding:", error);
		}
	};

	const handleSearch = async () => {
		if (!searchQuery.trim()) return;

		setIsSearching(true);
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
					searchQuery
				)}&accept-language=ca,es,en&limit=1`
			);
			const data = await response.json();

			if (data.length > 0) {
				const result = data[0];
				onChange({
					name: result.display_name,
					latitude: parseFloat(result.lat),
					longitude: parseFloat(result.lon),
				});
			}
		} catch (error) {
			console.error("Error searching location:", error);
		} finally {
			setIsSearching(false);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSearch();
		}
	};

	return (
		<div className="space-y-4">
			{/* Location Name Input */}
			<div>
				<Label htmlFor="location-name" className="text-white">
					Nom de la ubicació
				</Label>
				<Input
					id="location-name"
					value={value.name}
					onChange={(e) => onChange({ ...value, name: e.target.value })}
					className="bg-white/10 border-white/20 text-white"
					placeholder="Club de pàdel, poliesportiu..."
				/>
			</div>

			{/* Search Box */}
			<div>
				<Label className="text-white">Cercar ubicació</Label>
				<div className="flex gap-2">
					<Input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyPress={handleKeyPress}
						className="bg-white/10 border-white/20 text-white"
						placeholder="Escriu una adreça per cercar..."
					/>
					<Button
						type="button"
						onClick={handleSearch}
						disabled={isSearching}
						className="bg-padel-primary text-black hover:bg-padel-primary/90">
						{isSearching ? (
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
						) : (
							<Search className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>

			{/* Map */}
			<div>
				<Label className="text-white">Selecciona la ubicació al mapa</Label>
				<div className="mt-2">
					<MapComponent
						center={
							value.latitude && value.longitude
								? [value.latitude, value.longitude]
								: [41.6183, 0.6333] // Default to Lleida, Catalonia
						}
						markerPosition={
							value.latitude && value.longitude
								? [value.latitude, value.longitude]
								: null
						}
						onMapClick={handleMapClick}
					/>
				</div>
			</div>

			{/* Coordinates Display */}
			{value.latitude && value.longitude && (
				<div className="text-xs text-white/60">
					<MapPin className="h-3 w-3 inline mr-1" />
					Coordenades: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
				</div>
			)}
		</div>
	);
}
