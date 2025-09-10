"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Event } from "@/types";

type SimpleUser = {
  id: string;
  name: string | null;
  surname: string | null;
  email: string;
  avatar_url: string | null;
};

type ParticipantsGroupItem =
  | { kind: "single"; user: SimpleUser }
  | { kind: "pair"; pair_id: string; users: [SimpleUser, SimpleUser] };

export function useParticipantsModal() {
  const { toast } = useToast();
  
  // Modal state
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [participantsEvent, setParticipantsEvent] = useState<
    (Event & { participants?: any[] }) | null
  >(null);
  const [participants, setParticipants] = useState<ParticipantsGroupItem[]>([]);
  
  // Single user search
  const [userSearch, setUserSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<{
    id: string;
    name: string | null;
    surname: string | null;
    avatar_url: string | null;
  }[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // Pair search
  const [userSearchA, setUserSearchA] = useState("");
  const [userSearchB, setUserSearchB] = useState("");
  const [userSearchResultsA, setUserSearchResultsA] = useState<{
    id: string;
    name: string | null;
    surname: string | null;
    avatar_url: string | null;
  }[]>([]);
  const [userSearchResultsB, setUserSearchResultsB] = useState<{
    id: string;
    name: string | null;
    surname: string | null;
    avatar_url: string | null;
  }[]>([]);
  const [userSearchLoadingA, setUserSearchLoadingA] = useState(false);
  const [userSearchLoadingB, setUserSearchLoadingB] = useState(false);
  const [selectedA, setSelectedA] = useState<SimpleUser | null>(null);
  const [selectedB, setSelectedB] = useState<SimpleUser | null>(null);
  const [addingPair, setAddingPair] = useState(false);
  const [removingPairId, setRemovingPairId] = useState<string | null>(null);

  const openParticipantsModal = async (event: Event) => {
    setParticipantsEvent(event as any);
    setParticipants([]);
    setParticipantsError(null);
    setIsParticipantsModalOpen(true);
    setParticipantsLoading(true);
    setUserSearch("");
    setUserSearchResults([]);
    setUserSearchA("");
    setUserSearchB("");
    setUserSearchResultsA([]);
    setUserSearchResultsB([]);
    setSelectedA(null);
    setSelectedB(null);

    try {
      const res = await fetch(`/api/admin/events/${event.id}`);
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Error carregant participants");

      // Group by pair_id when two confirmed users share same pair_id
      const regs: any[] = data.participants || [];
      const byPair: Record<string, any[]> = {};
      const singles: any[] = [];
      
      for (const r of regs) {
        const pid = r.pair_id as string | null;
        if (pid) {
          byPair[pid] = byPair[pid] || [];
          byPair[pid].push(r);
        } else {
          singles.push(r);
        }
      }
      
      const grouped: ParticipantsGroupItem[] = [];
      
      // Pairs only when exactly two users in that pair_id
      for (const [pid, arr] of Object.entries(byPair)) {
        if (arr.length === 2) {
          const uA: SimpleUser = {
            id: arr[0].users?.id,
            name: arr[0].users?.name ?? null,
            surname: arr[0].users?.surname ?? null,
            email: arr[0].users?.email,
            avatar_url: arr[0].users?.avatar_url ?? null,
          };
          const uB: SimpleUser = {
            id: arr[1].users?.id,
            name: arr[1].users?.name ?? null,
            surname: arr[1].users?.surname ?? null,
            email: arr[1].users?.email,
            avatar_url: arr[1].users?.avatar_url ?? null,
          };
          grouped.push({ kind: "pair", pair_id: pid, users: [uA, uB] });
        } else {
          // Incomplete pair -> treat each as single
          for (const r of arr) {
            grouped.push({
              kind: "single",
              user: {
                id: r.users?.id,
                name: r.users?.name ?? null,
                surname: r.users?.surname ?? null,
                email: r.users?.email,
                avatar_url: r.users?.avatar_url ?? null,
              },
            });
          }
        }
      }
      
      for (const r of singles) {
        grouped.push({
          kind: "single",
          user: {
            id: r.users?.id,
            name: r.users?.name ?? null,
            surname: r.users?.surname ?? null,
            email: r.users?.email,
            avatar_url: r.users?.avatar_url ?? null,
          },
        });
      }
      
      setParticipants(grouped);
      setParticipantsEvent({
        ...event,
        current_participants: data.current_participants,
        participants: data.participants,
      });
    } catch (e: any) {
      setParticipantsError(e.message);
    } finally {
      setParticipantsLoading(false);
    }
  };

  // Search users to add (single)
  useEffect(() => {
    if (!isParticipantsModalOpen) return;
    if (userSearch.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }
    let active = true;
    setUserSearchLoading(true);
    fetch(`/api/admin/users/search?search=${encodeURIComponent(userSearch)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setUserSearchResults(data.users || []);
      })
      .catch(() => {})
      .finally(() => active && setUserSearchLoading(false));
    return () => {
      active = false;
    };
  }, [userSearch, isParticipantsModalOpen]);

  // Pair search A
  useEffect(() => {
    if (!isParticipantsModalOpen) return;
    if (userSearchA.trim().length < 2) {
      setUserSearchResultsA([]);
      return;
    }
    let active = true;
    setUserSearchLoadingA(true);
    fetch(`/api/admin/users/search?search=${encodeURIComponent(userSearchA)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setUserSearchResultsA(data.users || []);
      })
      .catch(() => {})
      .finally(() => active && setUserSearchLoadingA(false));
    return () => {
      active = false;
    };
  }, [userSearchA, isParticipantsModalOpen]);

  // Pair search B
  useEffect(() => {
    if (!isParticipantsModalOpen) return;
    if (userSearchB.trim().length < 2) {
      setUserSearchResultsB([]);
      return;
    }
    let active = true;
    setUserSearchLoadingB(true);
    fetch(`/api/admin/users/search?search=${encodeURIComponent(userSearchB)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setUserSearchResultsB(data.users || []);
      })
      .catch(() => {})
      .finally(() => active && setUserSearchLoadingB(false));
    return () => {
      active = false;
    };
  }, [userSearchB, isParticipantsModalOpen]);

  const addUserToEvent = async (userId: string) => {
    if (!participantsEvent) return;
    setAddingUserId(userId);
    try {
      const res = await fetch(
        `/api/admin/events/${participantsEvent.id}/participants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error afegint usuari");
      
      // Refresh list
      openParticipantsModal(participantsEvent);
      toast({
        title: "Usuari afegit",
        description: "S'ha afegit correctament a l'esdeveniment.",
      });
    } catch (e: any) {
      setParticipantsError(e.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: e.message || "No s'ha pogut afegir l'usuari",
      });
    } finally {
      setAddingUserId(null);
    }
  };

  const removeUserFromEvent = async (userId: string) => {
    if (!participantsEvent) return;
    setRemovingUserId(userId);
    try {
      const res = await fetch(
        `/api/admin/events/${participantsEvent.id}/participants?user_id=${userId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error eliminant usuari");
      
      setParticipants((prev) =>
        prev.filter((p) => !(p.kind === "single" && p.user.id === userId))
      );
      setParticipantsEvent((prev) =>
        prev
          ? {
              ...prev,
              current_participants: (prev.current_participants || 1) - 1,
            }
          : prev
      );
      toast({
        title: "Usuari eliminat",
        description: "S'ha eliminat de l'esdeveniment.",
      });
    } catch (e: any) {
      setParticipantsError(e.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: e.message || "No s'ha pogut eliminar l'usuari",
      });
    } finally {
      setRemovingUserId(null);
    }
  };

  const addPairToEvent = async (userIdA: string, userIdB: string) => {
    if (!participantsEvent) return;
    setAddingPair(true);
    try {
      const res = await fetch(
        `/api/admin/events/${participantsEvent.id}/participants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userIdA, pair_user_id: userIdB }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error afegint parella");
      
      // Refresh list
      await openParticipantsModal(participantsEvent);
      setUserSearchA("");
      setUserSearchB("");
      setSelectedA(null);
      setSelectedB(null);
      toast({
        title: "Parella afegida",
        description: "La parella s'ha afegit correctament.",
      });
    } catch (e: any) {
      setParticipantsError(e.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: e.message || "No s'ha pogut afegir la parella",
      });
    } finally {
      setAddingPair(false);
    }
  };

  const removePairFromEvent = async (pairId: string) => {
    if (!participantsEvent) return;
    setRemovingPairId(pairId);
    try {
      const res = await fetch(
        `/api/admin/events/${
          participantsEvent.id
        }/participants?pair_id=${encodeURIComponent(pairId)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error eliminant parella");
      
      setParticipants((prev) =>
        prev.filter((p) => !(p.kind === "pair" && p.pair_id === pairId))
      );
      setParticipantsEvent((prev) =>
        prev
          ? {
              ...prev,
              current_participants: (prev.current_participants || 2) - 2,
            }
          : prev
      );
      toast({
        title: "Parella eliminada",
        description: "La parella s'ha eliminat correctament.",
      });
    } catch (e: any) {
      setParticipantsError(e.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: e.message || "No s'ha pogut eliminar la parella",
      });
    } finally {
      setRemovingPairId(null);
    }
  };

  return {
    // Modal state
    isParticipantsModalOpen,
    setIsParticipantsModalOpen,
    participantsLoading,
    participantsError,
    participantsEvent,
    participants,
    
    // Single user search
    userSearch,
    setUserSearch,
    userSearchResults,
    userSearchLoading,
    addingUserId,
    removingUserId,
    
    // Pair search
    userSearchA,
    setUserSearchA,
    userSearchB,
    setUserSearchB,
    userSearchResultsA,
    userSearchResultsB,
    userSearchLoadingA,
    userSearchLoadingB,
    selectedA,
    setSelectedA,
    selectedB,
    setSelectedB,
    addingPair,
    removingPairId,
    
    // Actions
    openParticipantsModal,
    addUserToEvent,
    removeUserFromEvent,
    addPairToEvent,
    removePairFromEvent,
  };
}