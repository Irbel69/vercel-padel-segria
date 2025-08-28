"use client";

import { useEffect, useState } from "react";
import type { Registration } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useRegisterForEvent, useUnregisterFromEvent } from "@/hooks/use-events";

export function useUserRegistrations(user: any | null) {
  const [userRegistrations, setUserRegistrations] = useState<Registration[]>([]);
  const [isRegistrationsLoading, setIsRegistrationsLoading] = useState(true);
  const [processingEvents, setProcessingEvents] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const registerMutation = useRegisterForEvent();
  const unregisterMutation = useUnregisterFromEvent();

  const fetchUserRegistrations = async () => {
    try {
      setIsRegistrationsLoading(true);

      const response = await fetch("/api/user/registrations");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error carregant les inscripcions");
      }

      setUserRegistrations(data.registrations || []);
    } catch (err) {
      console.error("Error fetching user registrations:", err);
    } finally {
      setIsRegistrationsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserRegistrations();
    }
  }, [user]);

  const handleRegister = async (eventId: number): Promise<boolean> => {
    if (processingEvents.has(eventId)) return false;

    setProcessingEvents((prev) => new Set(prev).add(eventId));
    setError(null);

    try {
      await registerMutation.mutateAsync(eventId);
      fetchUserRegistrations();
      return true;
    } catch (err: any) {
      console.error("Error registering:", err);
      const msg = err instanceof Error ? err.message : "Error desconegut";
      setError(msg);
      toast({ title: "No s'ha pogut inscriure", description: msg });
      return false;
    } finally {
      setProcessingEvents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

  const handleUnregister = async (eventId: number) => {
    if (processingEvents.has(eventId)) return;
    if (!confirm("Estàs segur que vols cancel·lar la inscripció?")) return;

    setProcessingEvents((prev) => new Set(prev).add(eventId));
    setError(null);

    try {
      await unregisterMutation.mutateAsync(eventId);
      fetchUserRegistrations();
    } catch (err: any) {
      console.error("Error unregistering:", err);
      setError(err instanceof Error ? err.message : "Error desconegut");
      toast({ title: "No s'ha pogut cancel·lar", description: "Revisa la connexió i torna-ho a provar" });
    } finally {
      setProcessingEvents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

  return {
    userRegistrations,
    isRegistrationsLoading,
    processingEvents,
    error,
    setError,
    fetchUserRegistrations,
    handleRegister,
    handleUnregister,
  } as const;
}
