/**
 * Utility functions for EventCard components
 */

/**
 * Shortens a location string by taking the second part if it has multiple parts
 * @param location - The full location string
 * @returns Shortened location string
 */
export function shortLocation(location: string): string {
  if (!location) return "";
  const parts = location.split(",");
  if (parts.length >= 3) return parts[1]?.trim() || parts[0]?.trim();
  return parts[0]?.trim();
}