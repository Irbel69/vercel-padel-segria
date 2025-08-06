/**
 * Utility functions for generating map URLs
 */

/**
 * Generates a maps URL for the given coordinates
 * Automatically detects the platform to use the appropriate map service
 * - iOS devices: Apple Maps
 * - Other devices: Google Maps
 */
export function generateMapsUrl(
	latitude: number,
	longitude: number,
	title?: string
): string {
	// Check if we're in a browser environment
	if (typeof window === "undefined") {
		// Fallback for server-side rendering
		return `https://www.google.com/maps?q=${latitude},${longitude}`;
	}

	// Detect if it's an iOS device
	const isIOS =
		/iPad|iPhone|iPod/.test(navigator.userAgent) &&
		!(window as any).MSStream;

	if (isIOS) {
		// Apple Maps URL format
		// Using the maps.apple.com format which works on both iOS Safari and other browsers
		const encodedTitle = title ? encodeURIComponent(title) : "";
		return `https://maps.apple.com/?q=${encodedTitle}&ll=${latitude},${longitude}`;
	} else {
		// Google Maps URL format
		// This format works well across different platforms
		const query = title
			? `${encodeURIComponent(title)}@${latitude},${longitude}`
			: `${latitude},${longitude}`;
		return `https://www.google.com/maps/search/?api=1&query=${query}`;
	}
}

/**
 * Opens the maps URL in a new tab/window
 */
export function openInMaps(
	latitude: number,
	longitude: number,
	title?: string
): void {
	const url = generateMapsUrl(latitude, longitude, title);
	window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Gets a user-friendly name for the map service based on the platform
 */
export function getMapServiceName(): string {
	if (typeof window === "undefined") {
		return "Google Maps";
	}

	const isIOS =
		/iPad|iPhone|iPod/.test(navigator.userAgent) &&
		!(window as any).MSStream;

	return isIOS ? "Apple Maps" : "Google Maps";
}
