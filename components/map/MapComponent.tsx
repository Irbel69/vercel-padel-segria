"use client";

import { useEffect, useRef } from "react";
import {
	MapContainer,
	TileLayer,
	Marker,
	useMapEvents,
	useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
const DefaultIcon = L.icon({
	iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
	iconRetinaUrl:
		"https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
	shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
	center: [number, number];
	markerPosition: [number, number] | null;
	onMapClick: (lat: number, lng: number) => void;
}

// Component to handle map clicks
function MapClickHandler({
	onMapClick,
}: {
	onMapClick: (lat: number, lng: number) => void;
}): null {
	useMapEvents({
		click(e) {
			onMapClick(e.latlng.lat, e.latlng.lng);
		},
	});
	return null;
}

// Component to update map center when coordinates change
function MapCenterUpdater({ center }: { center: [number, number] }): null {
	const map = useMap();

	useEffect(() => {
		map.setView(center, map.getZoom());
	}, [center, map]);

	return null;
}

export default function MapComponent({
	center,
	markerPosition,
	onMapClick,
}: MapComponentProps) {
	const mapRef = useRef<L.Map | null>(null);

	return (
		<div className="h-[300px] w-full rounded-md overflow-hidden border border-white/20">
			<MapContainer
				center={center}
				zoom={13}
				scrollWheelZoom={true}
				style={{ height: "100%", width: "100%" }}
				ref={mapRef}>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>

				<MapClickHandler onMapClick={onMapClick} />
				<MapCenterUpdater center={center} />

				{markerPosition && <Marker position={markerPosition}></Marker>}
			</MapContainer>
		</div>
	);
}
