"use client";

import { useState, useCallback } from "react";

export type ViewMode = "grid" | "table";

export function useViewMode(defaultMode: ViewMode = "grid") {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Try to get from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("battle-pass-view-mode");
      if (saved === "grid" || saved === "table") {
        return saved;
      }
    }
    return defaultMode;
  });

  const toggleViewMode = useCallback(() => {
    setViewMode(prev => {
      const newMode = prev === "grid" ? "table" : "grid";
      
      // Save to localStorage if available
      if (typeof window !== "undefined") {
        localStorage.setItem("battle-pass-view-mode", newMode);
      }
      
      return newMode;
    });
  }, []);

  const setView = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    
    // Save to localStorage if available
    if (typeof window !== "undefined") {
      localStorage.setItem("battle-pass-view-mode", mode);
    }
  }, []);

  return {
    viewMode,
    toggleViewMode,
    setView,
    isGrid: viewMode === "grid",
    isTable: viewMode === "table",
  };
}