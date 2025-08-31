"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";

// Map of quality names to their icons (same as before)
import {
  Crown,
  Eye,
  Flame,
  Zap,
  Heart,
  Activity,
  Wind,
  Target,
  ArrowUpRight,
  Shield,
  Swords,
  BrainCircuit,
  Award,
  Trophy,
  Medal,
  Star,
  Users,
  Gamepad2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const qualityIconMap: Record<string, LucideIcon> = {
  Lideratge: Crown,
  Anticipació: Eye,
  Potència: Flame,
  Velocitat: Zap,
  Resistència: Heart,
  Reflexos: Activity,
  Flexibilitat: Wind,
  Equilibri: Target,
  Mobilitat: ArrowUpRight,
  Defensa: Shield,
  Atac: Swords,
  Control: BrainCircuit,
  "Col·locació": Target,
  Volea: Award,
  Globo: Trophy,
  Rematada: Flame,
  Vibora: Zap,
  Servei: Star,
  Sortida: ArrowUpRight,
  Contraatac: Activity,
  "Baixada de pared": Shield,
  Bandeja: Medal,
  Comunicació: Users,
  Adaptació: Wind,
  X3: Gamepad2,
};

export const getQualityIcon = (qualityName: string): LucideIcon => {
  return qualityIconMap[qualityName] || Award;
};

export default function useDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userQualities, setUserQualities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/signin");
        return;
      }

      setUser(authUser);

      const [profileRes, qualitiesRes] = await Promise.all([
        supabase
          .from("users")
          .select(
            "id,name,surname,trend,email,phone,observations,created_at,is_admin"
          )
          .eq("id", authUser.id)
          .single(),
        supabase
          .from("user_qualities")
          .select(
            `
                  quality_id,
                  qualities!inner (
                      id,
                      name
                  )
              `
          )
          .eq("user_id", authUser.id),
      ]);

      if (!profileRes.data) {
        router.push("/complete-profile");
        return;
      }

      setUserProfile(profileRes.data);
      setUserQualities(qualitiesRes.data || []);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const updateProfileField = async (field: string, value: string) => {
    const response = await fetch("/api/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ [field]: value }),
    });

    if (!response.ok) {
      throw new Error("Failed to update profile");
    }

    setUserProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  return {
    user,
    userProfile,
    userQualities,
    loading,
    updateProfileField,
    getQualityIcon,
  };
}
