/**
 * EventCard - Re-export wrapper for backward compatibility
 *
 * This file now serves as a lightweight wrapper that re-exports the modular
 * EventCard implementation from the EventCard/ folder. This ensures existing
 * imports continue to work while benefiting from the new modular structure.
 */

// Re-export the default EventCard component
export { default } from "./EventCard/EventCard";

// Re-export individual components for advanced usage
export { Hero } from "./EventCard/Hero";
export { Content } from "./EventCard/Content";
export { ProgressBar } from "./EventCard/ProgressBar";
export { Actions } from "./EventCard/Actions";

// Re-export utilities
export * from "./EventCard/utils";
