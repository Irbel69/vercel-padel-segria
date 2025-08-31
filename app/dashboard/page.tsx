"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ButtonAccount from "@/components/ButtonAccount";
import { useUserStats } from "@/hooks/use-user-stats";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Trophy,
  Target,
  Award,
  Star,
  Crown,
  Medal,
  ArrowUpRight,
  User,
  Calendar,
  CheckCircle,
  BarChart3,
  Eye,
  Flame,
  Zap,
  Heart,
  Wind,
  Shield,
  Swords,
  BrainCircuit,
  Users,
  Gamepad2,
  Mail,
  Phone,
  Edit3,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import useDashboard, {
  getQualityIcon as hookGetQualityIcon,
} from "@/hooks/use-dashboard";
import CountUp from "react-countup";
import { useRouter } from "next/navigation";
import EditFieldDialog from "@/components/EditFieldDialog";
import UpcomingBookingsList from "@/components/lessons/UpcomingBookingsList";
import StatsGrid from "@/components/dashboard/main/stats-grid";
import QualitiesList from "@/components/dashboard/main/qualities-list";
import ContactInfo from "@/components/dashboard/main/contact-info";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Map of quality names to their icons (same as QualityManager)
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

// Function to get quality icon
const getQualityIcon = (qualityName: string): LucideIcon => {
  return qualityIconMap[qualityName] || Award;
};

export default function Dashboard() {
  const router = useRouter();
  const { stats, loading: statsLoading, error: statsError } = useUserStats();
  const { toast } = useToast();
  // Edit dialog states
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  // Hook for loading dashboard data (user, profile, qualities)
  const {
    user,
    userProfile,
    userQualities,
    loading,
    updateProfileField,
    getQualityIcon,
  } = useDashboard();

  // prefer hook's getQualityIcon but fallback to imported one if not present
  const getQualityIconToUse = getQualityIcon || hookGetQualityIcon;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-12 w-96 bg-white/10 rounded animate-pulse" />
        <div className="h-64 w-full bg-white/10 rounded animate-pulse" />
      </div>
    );
  }

  if (!user || !userProfile) {
    return null;
  }

  // Use stats from API or fallback to 0
  const matchesPlayed = stats?.matchesPlayed || 0;
  const matchesWon = stats?.matchesWon || 0;
  const winPercentage = stats?.winPercentage || 0;
  const userScore = stats?.userScore || 0;

  // Show error message if stats failed to load
  if (statsError && !statsLoading) {
    console.error("Error loading stats:", statsError);
  }

  return (
    <div className="space-y-4 md:space-y-8 h-full ">
      {/* Welcome Header - Optimized for mobile */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 md:gap-4">
        <div className="space-y-1 md:space-y-2">
          <h1 className="text-xl md:text-4xl font-bold tracking-tight text-white">
            Hola, {userProfile.name}! 👋
          </h1>
          <p className="text-white/70 text-sm md:text-lg">
            Benvingut al teu tauler de control de Padel Segrià
          </p>
        </div>
      </div>

      {/* Single outer Card wrapping all dashboard sections */}
      <div className="block">
        <Card className="border-0 relative overflow-hidden rounded-2xl [background:rgba(255,255,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] ring-1 ring-white/20">
          <CardContent className="space-y-6">
            {/* Stats */}
            <StatsGrid
              userProfile={userProfile}
              matchesPlayed={matchesPlayed}
              matchesWon={matchesWon}
              winPercentage={winPercentage}
              userScore={userScore}
            />

            {/* Qualities */}
            <div className="space-y-4">
              <QualitiesList
                userQualities={userQualities}
                getQualityIcon={getQualityIconToUse}
              />
            </div>

            {/* Bookings section (inside same Card) */}
            <div className="space-y-2 md:space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-semibold text-white">
                  Les meves reserves
                </h2>
                  <Link href="/dashboard/lessons" className="shrink-0">
                    <Button className="bg-padel-primary rounded-full md:rounded-lg text-black hover:opacity-90 inline-flex items-center justify-center h-10 w-10 md:h-auto md:w-auto md:px-3 md:py-1">
                      <Calendar className="hidden md:block mr-1 h-4 w-4" aria-hidden="true" />
                      <span className="hidden md:block">Nova Reserva</span>
                      <span className="block md:hidden">+</span>
                    </Button>
                  </Link>
              </div>
              <UpcomingBookingsList />
            </div>
            {/* Contact Info */}
            <ContactInfo userProfile={userProfile} />
          </CardContent>
        </Card>
      </div>

      {/* (Bookings are now inside the Card above for all sizes) */}

      {/* Edit Dialogs */}
      <EditFieldDialog
        isOpen={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        fieldName="email"
        fieldLabel="Correu electrònic"
        currentValue={userProfile?.email || ""}
        fieldType="email"
        onSave={(value) => updateProfileField("email", value)}
      />

      <EditFieldDialog
        isOpen={phoneDialogOpen}
        onClose={() => setPhoneDialogOpen(false)}
        fieldName="phone"
        fieldLabel="Telèfon"
        currentValue={userProfile?.phone || ""}
        fieldType="phone"
        onSave={(value) => updateProfileField("phone", value)}
      />
    </div>
  );
}
