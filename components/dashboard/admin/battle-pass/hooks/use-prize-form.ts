"use client";

import { useState, useCallback, useEffect } from "react";
import { BattlePassPrize } from "./use-battle-pass-prizes";

export interface PrizeFormData {
  name: string;
  description: string;
  required_points: number;
  prize_type: "physical" | "digital" | "experience" | "currency";
  prize_value: string;
  image_url?: string;
  is_active: boolean;
  stock_quantity?: number;
  display_order: number;
}

export const defaultPrizeForm: PrizeFormData = {
  name: "",
  description: "",
  required_points: 100,
  prize_type: "physical",
  prize_value: "",
  image_url: undefined,
  is_active: true,
  stock_quantity: undefined,
  display_order: 0,
};

export function usePrizeForm(initialData?: Partial<BattlePassPrize>) {
  const [formData, setFormData] = useState<PrizeFormData>(() => {
    if (initialData) {
      return {
        name: (initialData.name as string) || (initialData as any).title || "",
        description: initialData.description || (initialData as any).desc || "",
        required_points:
          initialData.required_points ?? (initialData as any).points_required ?? (initialData as any).pointsRequired ?? 100,
        prize_type: initialData.prize_type || "physical",
        prize_value: initialData.prize_value || (initialData as any).value || "",
        image_url: initialData.image_url || (initialData as any).imageUrl || undefined,
        is_active: initialData.is_active ?? true,
        stock_quantity: initialData.stock_quantity ?? (initialData as any).stockQuantity ?? undefined,
        display_order: initialData.display_order ?? (initialData as any).displayOrder ?? 0,
      };
    }
    return defaultPrizeForm;
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PrizeFormData, string>>>({});
  const [isDirty, setIsDirty] = useState(false);

  const updateField = useCallback(<K extends keyof PrizeFormData>(
    field: K,
    value: PrizeFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors: Partial<Record<keyof PrizeFormData, string>> = {};
    
    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = "El nom del premi és obligatori";
    }
    
    
    if (formData.required_points < 1) {
      newErrors.required_points = "Els punts requerits han de ser majors que 0";
    }
    
    if (formData.stock_quantity !== undefined && formData.stock_quantity < 0) {
      newErrors.stock_quantity = "L'estoc no pot ser negatiu";
    }
    
    if (formData.display_order < 0) {
      newErrors.display_order = "L'ordre de visualització no pot ser negatiu";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback((newData?: Partial<BattlePassPrize>) => {
    console.log("[usePrizeForm] resetForm called with ->", newData?.id, newData?.name);
    if (newData) {
      setFormData({
        name: (newData.name as string) || (newData as any).title || "",
        description: newData.description || (newData as any).desc || "",
        required_points:
          newData.required_points ?? (newData as any).points_required ?? (newData as any).pointsRequired ?? 100,
        prize_type: newData.prize_type || "physical",
        prize_value: newData.prize_value || (newData as any).value || "",
        image_url: newData.image_url || (newData as any).imageUrl || undefined,
        is_active: newData.is_active ?? true,
        stock_quantity: newData.stock_quantity ?? (newData as any).stockQuantity ?? undefined,
        display_order: newData.display_order ?? (newData as any).displayOrder ?? 0,
      });
    } else {
      setFormData(defaultPrizeForm);
    }
    setErrors({});
    setIsDirty(false);
  }, []);

  // Keep form in sync when initialData changes (e.g. opening edit dialog)
  useEffect(() => {
    // If initialData is provided, populate form with it; otherwise reset to defaults
    resetForm(initialData);
  }, [initialData, resetForm]);

  const getPrizeTypeLabel = useCallback((type: PrizeFormData["prize_type"]) => {
    switch (type) {
      case "physical": return "Físic";
      case "digital": return "Digital";
      case "experience": return "Experiència";
      case "currency": return "Moneda";
      default: return type;
    }
  }, []);

  const getTierLabel = useCallback((tier: number) => {
    return ""; // Tiers removed
  }, []);

  const getTierColor = useCallback((tier: number) => {
    return "";
  }, []);

  return {
    formData,
    errors,
    isDirty,
    updateField,
    validateForm,
    resetForm,
    getPrizeTypeLabel,
    getTierLabel,
    getTierColor,
  };
}