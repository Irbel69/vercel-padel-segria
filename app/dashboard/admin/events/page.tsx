"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { redirect, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LocationPicker from "@/components/map/LocationPicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Search,
  Plus,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Swords,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Event, EventsListResponse, CreateEventData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { uploadEventCover } from "@/libs/supabase/storage";

export default function AdminEventsPage() {
  const { user, profile, isLoading: userLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState<
    EventsListResponse["pagination"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  // Create/Edit Event Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Participants modal state
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(
    null
  );
  const [participantsEvent, setParticipantsEvent] = useState<
    (Event & { participants?: any[] }) | null
  >(null);
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

  const [participants, setParticipants] = useState<ParticipantsGroupItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<
    {
      id: string;
      name: string | null;
      surname: string | null;
      avatar_url: string | null;
    }[]
  >([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  // Pair add states
  const [userSearchA, setUserSearchA] = useState("");
  const [userSearchB, setUserSearchB] = useState("");
  const [userSearchResultsA, setUserSearchResultsA] = useState<
    {
      id: string;
      name: string | null;
      surname: string | null;
      avatar_url: string | null;
    }[]
  >([]);
  const [userSearchResultsB, setUserSearchResultsB] = useState<
    {
      id: string;
      name: string | null;
      surname: string | null;
      avatar_url: string | null;
    }[]
  >([]);
  const [userSearchLoadingA, setUserSearchLoadingA] = useState(false);
  const [userSearchLoadingB, setUserSearchLoadingB] = useState(false);
  const [selectedA, setSelectedA] = useState<SimpleUser | null>(null);
  const [selectedB, setSelectedB] = useState<SimpleUser | null>(null);
  const [addingPair, setAddingPair] = useState(false);
  const [removingPairId, setRemovingPairId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateEventData>({
    title: "",
    date: "",
    location: "",
    latitude: undefined,
    longitude: undefined,
    prizes: "",
    max_participants: 16,
    registration_deadline: "",
    image_url: undefined,
  });

  // Image upload state
  const [imageUploading, setImageUploading] = useState(false);
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(
    null
  );
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  // Track if the image was changed to control whether we include image_url in save payload
  const [imageDirty, setImageDirty] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!userLoading && (!profile || !profile.is_admin)) {
      redirect("/dashboard");
    }
  }, [profile, userLoading]);

  const fetchEvents = async (page: number = 1, searchTerm: string = "") => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/admin/events?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error carregant els esdeveniments");
      }

      const typedData = data as EventsListResponse;
      setEvents(typedData.events);
      setPagination(typedData.pagination);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err instanceof Error ? err.message : "Error desconegut");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchEvents(1, search);
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [search]);

  // Initial load
  useEffect(() => {
    if (profile?.is_admin) {
      fetchEvents(currentPage, search);
    }
  }, [profile?.is_admin, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchEvents(newPage, search);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ca-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ca-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      date: "",
      location: "",
      latitude: undefined,
      longitude: undefined,
      prizes: "",
      max_participants: 16,
      registration_deadline: "",
      image_url: undefined,
    });
    setIsEditing(false);
    setEditingEvent(null);
    setLocalImagePreview(null);
    setSelectedImageFile(null);
    setImageDirty(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (event: Event) => {
    setFormData({
      title: event.title,
      date: event.date,
      location: event.location || "",
      latitude: event.latitude || undefined,
      longitude: event.longitude || undefined,
      prizes: event.prizes || "",
      max_participants: event.max_participants,
      registration_deadline: event.registration_deadline,
      image_url: event.image_url || undefined,
    });
    setEditingEvent(event);
    setIsEditing(true);
    setIsCreateModalOpen(true);
    setLocalImagePreview(event.image_url || null);
    setSelectedImageFile(null);
    setImageDirty(false);
  };

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

  // Search users to add
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

  const onImageSelected = async (file?: File | null) => {
    if (!file) return;
    try {
      setImageUploading(true);
      if (!isEditing || !editingEvent?.id) {
        const url = URL.createObjectURL(file);
        setLocalImagePreview(url);
        setSelectedImageFile(file);
        setImageDirty(true);
        toast({
          title: "Imatge preparada",
          description: "Es pujarà en crear l'esdeveniment.",
        });
      } else {
        const { publicUrl } = await uploadEventCover(file, editingEvent.id);
        setFormData((prev) => ({ ...prev, image_url: publicUrl }));
        setLocalImagePreview(publicUrl);
        setSelectedImageFile(null);
        setImageDirty(true);
        // Persist immediately on edit so DB reflects change
        try {
          console.debug("[AdminEvents] PUT image_url immediately", {
            eventId: editingEvent.id,
            image_url: publicUrl,
          });
          await fetch(`/api/admin/events/${editingEvent.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_url: publicUrl }),
          });
          console.debug("[AdminEvents] PUT image_url done");
          // Since we persisted, we can mark as not dirty (no need to resend on save)
          setImageDirty(false);
        } catch (e) {
          console.warn(
            "[AdminEvents] Failed to persist image_url immediately:",
            e
          );
        }
        toast({
          title: "Imatge pujada",
          description: "S'ha actualitzat la portada.",
        });
      }
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error pujant imatge",
        description: e.message || "Intenta-ho de nou",
      });
    } finally {
      setImageUploading(false);
    }
  };

  const onRemoveImage = async () => {
    setFormData((prev) => ({ ...prev, image_url: null }));
    setLocalImagePreview(null);
    setSelectedImageFile(null);
    setImageDirty(true);
    // If editing, persist immediately so DB clears the image_url
    if (isEditing && editingEvent?.id) {
      try {
        console.debug("[AdminEvents] PUT image_url null immediately", {
          eventId: editingEvent.id,
        });
        await fetch(`/api/admin/events/${editingEvent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: null }),
        });
        console.debug("[AdminEvents] PUT image_url null done");
        setImageDirty(false);
      } catch (e) {
        console.warn("[AdminEvents] Failed to clear image_url immediately:", e);
      }
    }
    toast({
      title: "Imatge eliminada",
      description: "Desa per aplicar canvis.",
    });
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditing
        ? `/api/admin/events/${editingEvent?.id}`
        : "/api/admin/events";
      const method = isEditing ? "PUT" : "POST";

      // Build payload explicitly to control inclusion of optional fields
      const payload: any = {
        title: formData.title,
        date: formData.date,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        prizes: formData.prizes,
        max_participants: formData.max_participants,
        registration_deadline: formData.registration_deadline,
      };
      // Only include image_url when it changed or on create flow with selected file uploaded later
      if (!isEditing) {
        // On create, if user didn’t select file yet, we won’t send image_url now; a post-create upload will patch it.
        if (typeof formData.image_url !== "undefined") {
          payload.image_url = formData.image_url ?? null;
        }
      } else if (imageDirty) {
        payload.image_url =
          typeof formData.image_url === "undefined" ? null : formData.image_url;
      }

      console.debug("[AdminEvents] Submitting event payload", {
        keys: Object.keys(payload),
        image_url: payload.image_url ?? null,
      });
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error processant la sol·licitud");
      }

      // If we just created and there's a selected image file, upload and patch image_url
      if (!isEditing && selectedImageFile && data?.data?.id) {
        try {
          setImageUploading(true);
          const { publicUrl } = await uploadEventCover(
            selectedImageFile,
            data.data.id
          );
          await fetch(`/api/admin/events/${data.data.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              // send only image_url so other fields remain unchanged
              image_url: publicUrl,
              // minimal required fields to satisfy server validation
              title: data.data.title,
              date: data.data.date,
              registration_deadline: data.data.registration_deadline,
              max_participants: data.data.max_participants,
            }),
          });
        } catch (e) {
          console.warn("Unable to upload image post-create:", e);
        }
      }

      setIsCreateModalOpen(false);
      resetForm();
      fetchEvents(currentPage, search);
    } catch (err) {
      console.error("Error submitting event:", err);
      setError(err instanceof Error ? err.message : "Error desconegut");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (eventId: number) => {
    // First simple confirmation
    if (!confirm("Estàs segur que vols eliminar aquest esdeveniment?")) {
      return;
    }

    try {
      // Try to delete without force to check if there are registrations
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      // If successful deletion (no registrations)
      if (response.ok) {
        fetchEvents(currentPage, search);
        return;
      }

      // If the tournament has registrations, show warning dialog
      if (data.error === "tournament_has_registrations") {
        const registrationsCount = data.registrations_count;
        const confirmed = confirm(
          `Aquest torneig té ${registrationsCount} inscripció${
            registrationsCount > 1 ? "s" : ""
          }.\n\n` +
            "S'eliminaran també les reserves de tots els usuaris.\n" +
            "Es recomana comunicar-ho als usuaris inscrits prèviament.\n\n" +
            "Estàs segur que vols continuar amb l'eliminació?"
        );

        if (!confirmed) {
          return;
        }

        // Force delete if confirmed
        const forceResponse = await fetch(
          `/api/admin/events/${eventId}?force=true`,
          {
            method: "DELETE",
          }
        );

        const forceData = await forceResponse.json();

        if (!forceResponse.ok) {
          throw new Error(forceData.error || "Error eliminant l'esdeveniment");
        }

        fetchEvents(currentPage, search);
        return;
      }

      // Handle other errors
      throw new Error(data.error || "Error eliminant l'esdeveniment");
    } catch (err) {
      console.error("Error deleting event:", err);
      setError(err instanceof Error ? err.message : "Error desconegut");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
            Obert
          </Badge>
        );
      case "soon":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-500/20 text-yellow-400"
          >
            Aviat
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="secondary" className="bg-red-500/20 text-red-400">
            Tancat
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-white/10 text-white/70">
            {status}
          </Badge>
        );
    }
  };

  // Show loading while checking user permissions
  if (userLoading || (!profile?.is_admin && !error)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-padel-primary/20 rounded-lg">
            <Calendar className="h-6 w-6 text-padel-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-white truncate">
              Gestió d&apos;Esdeveniments
            </h1>
            <p className="text-white/60 text-sm md:text-base">
              Administra tornejos i competicions
            </p>
          </div>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-padel-primary text-black hover:bg-padel-primary/90 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="sm:hidden">Nou</span>
          <span className="hidden sm:inline">Nou Esdeveniment</span>
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-4 w-4" />
            <Input
              placeholder="Cerca per títol o ubicació..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Events List */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-lg md:text-xl">Esdeveniments</span>
            {pagination && (
              <Badge
                variant="secondary"
                className="bg-padel-primary/20 text-padel-primary self-start sm:self-auto"
              >
                {pagination.totalEvents} esdeveniments
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">
                {search
                  ? "No s'han trobat esdeveniments"
                  : "No hi ha esdeveniments creats"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-2 md:p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-2 md:gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5 md:gap-2 mb-1 md:mb-2">
                        <h3 className="text-white font-semibold text-sm md:text-lg leading-tight">
                          {event.title}
                        </h3>
                        {getStatusBadge(event.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 md:gap-4 text-[11px] md:text-sm text-white/70">
                        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                          <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="truncate">
                            {formatDate(event.date)}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                            <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                          <Users className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="truncate">
                            {event.current_participants || 0}/
                            {event.max_participants} part.
                          </span>
                        </div>
                      </div>

                      <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-white/50">
                        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            Límit: {formatDateTime(event.registration_deadline)}
                          </span>
                        </div>
                      </div>

                      {event.prizes && (
                        <div className="mt-1 md:mt-2">
                          <div className="flex items-start gap-1.5 md:gap-2 text-[11px] md:text-sm text-white/60">
                            <Trophy className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 mt-0.5" />
                            <span className="break-words leading-snug">
                              {event.prizes}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row lg:flex-col flex-wrap gap-1.5 md:gap-2 justify-end lg:ml-4 max-w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/dashboard/admin/events/${event.id}/matches`
                          )
                        }
                        className="bg-padel-primary/20 border-padel-primary/30 text-padel-primary hover:bg-padel-primary/30 flex-1 lg:flex-initial h-7 md:h-8 px-2 md:px-3"
                      >
                        <Swords className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="ml-1 hidden sm:inline text-[11px]">
                          Partits
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openParticipantsModal(event)}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 lg:flex-initial h-7 md:h-8 px-2 md:px-3"
                      >
                        <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="ml-1 hidden sm:inline text-[11px]">
                          Inscrits
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(event)}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 lg:flex-initial h-7 md:h-8 px-2 md:px-3"
                      >
                        <Edit className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="ml-1 hidden sm:inline text-[11px]">
                          Editar
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                        className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 flex-1 lg:flex-initial h-7 md:h-8 px-2 md:px-3"
                      >
                        <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="ml-1 hidden sm:inline text-[11px]">
                          Eliminar
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t border-white/10 gap-4">
              <p className="text-white/60 text-sm text-center sm:text-left">
                Pàgina {pagination.currentPage} de {pagination.totalPages}
              </p>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 sm:flex-initial"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasMore}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 sm:flex-initial"
                >
                  <span className="hidden sm:inline">Següent</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Event Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-black/90 border-white/20 text-white max-w-4xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Esdeveniment" : "Crear Nou Esdeveniment"}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {isEditing
                ? "Modifica les dades de l'esdeveniment"
                : "Omple la informació per crear un nou torneig"}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto px-1">
            <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-white">
                    Títol *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="date" className="text-white">
                    Data de l&apos;esdeveniment *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-white">Ubicació</Label>
                  <LocationPicker
                    value={{
                      name: formData.location || "",
                      latitude: formData.latitude || null,
                      longitude: formData.longitude || null,
                    }}
                    onChange={(location) => {
                      setFormData((prev) => ({
                        ...prev,
                        location: location.name,
                        latitude: location.latitude || undefined,
                        longitude: location.longitude || undefined,
                      }));
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="max_participants" className="text-white">
                    Màxim de participants *
                  </Label>
                  <Input
                    id="max_participants"
                    type="number"
                    min="4"
                    max="64"
                    value={formData.max_participants}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        max_participants: parseInt(e.target.value),
                      }))
                    }
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="registration_deadline" className="text-white">
                    Data límit d&apos;inscripció *
                  </Label>
                  <Input
                    id="registration_deadline"
                    type="date"
                    value={formData.registration_deadline}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        registration_deadline: e.target.value,
                      }))
                    }
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="prizes" className="text-white">
                    Premis
                  </Label>
                  <Textarea
                    id="prizes"
                    value={formData.prizes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        prizes: e.target.value,
                      }))
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="1r premi: 500€, 2n premi: 200€..."
                    rows={3}
                  />
                </div>

                {/* Image upload */}
                <div className="md:col-span-2">
                  <Label className="text-white">Imatge de portada</Label>
                  <div className="mt-2 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) =>
                        onImageSelected(e.target.files?.[0] || null)
                      }
                      disabled={imageUploading}
                      className="text-sm file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-white/10 file:text-white file:hover:bg-white/20 file:cursor-pointer"
                    />
                    {(localImagePreview || formData.image_url) && (
                      <div className="flex items-center gap-3">
                        <div className="relative h-16 w-28 rounded overflow-hidden border border-white/10">
                          <Image
                            src={
                              (localImagePreview ||
                                formData.image_url) as string
                            }
                            alt="Portada"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={onRemoveImage}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          Treure imatge
                        </Button>
                      </div>
                    )}
                    {imageUploading && (
                      <p className="text-xs text-white/60">Pujant...</p>
                    )}
                    <p className="text-xs text-white/50">
                      Formats: JPG, PNG, WEBP. Màx 5MB.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancel·lar
            </Button>
            <Button
              type="submit"
              form="event-form"
              disabled={isSubmitting}
              className="bg-padel-primary text-black hover:bg-padel-primary/90"
            >
              {isSubmitting
                ? isEditing
                  ? "Actualitzant..."
                  : "Creant..."
                : isEditing
                ? "Actualitzar"
                : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Participants Modal */}
      <Dialog
        open={isParticipantsModalOpen}
        onOpenChange={setIsParticipantsModalOpen}
      >
        <DialogContent className="bg-black/90 border-white/20 text-white max-w-3xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Inscrits {participantsEvent ? `- ${participantsEvent.title}` : ""}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Llista d&apos;usuaris confirmats{" "}
              {participantsEvent && (
                <span
                  className={
                    (participantsEvent.current_participants ||
                      participants.length) > participantsEvent.max_participants
                      ? "text-red-400"
                      : ""
                  }
                >
                  (
                  {participantsEvent.current_participants ||
                    participants.length}
                  /{participantsEvent.max_participants})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Add user search */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-white/60">
                Afegir usuari
              </label>
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Cerca per nom o cognom (mínim 2 caràcters)"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              {userSearchLoading && (
                <p className="text-xs text-white/40">Cercant...</p>
              )}
              {!userSearchLoading &&
                userSearch.length >= 2 &&
                userSearchResults.length > 0 && (
                  <ul className="max-h-40 overflow-y-auto bg-white/5 border border-white/10 rounded-md divide-y divide-white/10">
                    {userSearchResults.map((u) => {
                      const already = participants.some((p) =>
                        p.kind === "single"
                          ? p.user.id === u.id
                          : p.users.some((x) => x.id === u.id)
                      );
                      return (
                        <li
                          key={u.id}
                          className="p-2 flex items-center gap-3 text-sm"
                        >
                          <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                            {(u.name?.[0] || "?") + (u.surname?.[0] || "")}
                          </div>
                          <div className="flex-1 min-w-0 truncate">
                            {u.name || u.surname
                              ? `${u.name || ""} ${u.surname || ""}`.trim()
                              : u.id}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={already || addingUserId === u.id}
                            onClick={() => addUserToEvent(u.id)}
                            className="h-6 px-2 text-[10px] bg-padel-primary/20 border-padel-primary/30 text-padel-primary hover:bg-padel-primary/30"
                          >
                            {already
                              ? "Afegit"
                              : addingUserId === u.id
                              ? "..."
                              : "Afegir"}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
            </div>

            {/* Add pair search */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-white/60">
                Afegir parella
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Input
                    value={userSearchA}
                    onChange={(e) => {
                      setUserSearchA(e.target.value);
                      setSelectedA(null);
                    }}
                    placeholder="Jugador A (mínim 2 car.)"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                  {userSearchLoadingA && (
                    <p className="text-xs text-white/40">Cercant...</p>
                  )}
                  {!userSearchLoadingA &&
                    userSearchA.length >= 2 &&
                    userSearchResultsA.length > 0 && (
                      <ul className="max-h-40 overflow-y-auto bg-white/5 border border-white/10 rounded-md divide-y divide-white/10 mt-1">
                        {userSearchResultsA.map((u) => {
                          const already = participants.some((p) =>
                            p.kind === "single"
                              ? p.user.id === u.id
                              : p.users.some((x) => x.id === u.id)
                          );
                          return (
                            <li
                              key={u.id}
                              className="p-2 flex items-center gap-3 text-sm cursor-pointer hover:bg-white/10"
                              onClick={() => {
                                if (already) {
                                  toast({
                                    variant: "destructive",
                                    title: "Ja inscrit",
                                    description:
                                      "Aquest jugador ja està inscrit en aquest esdeveniment.",
                                  });
                                  return;
                                }
                                setSelectedA({
                                  id: u.id,
                                  name: u.name ?? null,
                                  surname: u.surname ?? null,
                                  email: "",
                                  avatar_url: u.avatar_url ?? null,
                                });
                              }}
                            >
                              <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                                {(u.name?.[0] || "?") + (u.surname?.[0] || "")}
                              </div>
                              <div className="flex-1 min-w-0 truncate">
                                {u.name || u.surname
                                  ? `${u.name || ""} ${u.surname || ""}`.trim()
                                  : u.id}
                              </div>
                              {already && (
                                <span className="text-[10px] text-white/40">
                                  Ja inscrit
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  {selectedA && (
                    <p className="text-xs text-white/60 mt-1">
                      Seleccionat:{" "}
                      {selectedA.name || selectedA.surname
                        ? `${selectedA.name || ""} ${
                            selectedA.surname || ""
                          }`.trim()
                        : selectedA.id}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    value={userSearchB}
                    onChange={(e) => {
                      setUserSearchB(e.target.value);
                      setSelectedB(null);
                    }}
                    placeholder="Jugador B (mínim 2 car.)"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                  {userSearchLoadingB && (
                    <p className="text-xs text-white/40">Cercant...</p>
                  )}
                  {!userSearchLoadingB &&
                    userSearchB.length >= 2 &&
                    userSearchResultsB.length > 0 && (
                      <ul className="max-h-40 overflow-y-auto bg-white/5 border border-white/10 rounded-md divide-y divide-white/10 mt-1">
                        {userSearchResultsB.map((u) => {
                          const already = participants.some((p) =>
                            p.kind === "single"
                              ? p.user.id === u.id
                              : p.users.some((x) => x.id === u.id)
                          );
                          return (
                            <li
                              key={u.id}
                              className="p-2 flex items-center gap-3 text-sm cursor-pointer hover:bg-white/10"
                              onClick={() => {
                                if (already) {
                                  toast({
                                    variant: "destructive",
                                    title: "Ja inscrit",
                                    description:
                                      "Aquest jugador ja està inscrit en aquest esdeveniment.",
                                  });
                                  return;
                                }
                                setSelectedB({
                                  id: u.id,
                                  name: u.name ?? null,
                                  surname: u.surname ?? null,
                                  email: "",
                                  avatar_url: u.avatar_url ?? null,
                                });
                              }}
                            >
                              <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                                {(u.name?.[0] || "?") + (u.surname?.[0] || "")}
                              </div>
                              <div className="flex-1 min-w-0 truncate">
                                {u.name || u.surname
                                  ? `${u.name || ""} ${u.surname || ""}`.trim()
                                  : u.id}
                              </div>
                              {already && (
                                <span className="text-[10px] text-white/40">
                                  Ja inscrit
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  {selectedB && (
                    <p className="text-xs text-white/60 mt-1">
                      Seleccionat:{" "}
                      {selectedB.name || selectedB.surname
                        ? `${selectedB.name || ""} ${
                            selectedB.surname || ""
                          }`.trim()
                        : selectedB.id}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    addingPair ||
                    !selectedA ||
                    !selectedB ||
                    selectedA.id === selectedB.id
                  }
                  onClick={() =>
                    selectedA &&
                    selectedB &&
                    addPairToEvent(selectedA.id, selectedB.id)
                  }
                  className="h-7 px-3 text-[11px] bg-padel-primary/20 border-padel-primary/30 text-padel-primary hover:bg-padel-primary/30"
                >
                  {addingPair ? "Afegint..." : "Afegir parella"}
                </Button>
              </div>
            </div>
            {participantsLoading && (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            )}
            {participantsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{participantsError}</AlertDescription>
              </Alert>
            )}
            {!participantsLoading &&
              !participantsError &&
              participants.length === 0 && (
                <p className="text-white/60 text-sm">
                  Encara no hi ha inscrits confirmats.
                </p>
              )}
            {!participantsLoading && participants.length > 0 && (
              <ul className="divide-y divide-white/10">
                {participants.map((item) =>
                  item.kind === "single" ? (
                    <li
                      key={`single-${item.user.id}`}
                      className="py-2 flex items-center gap-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">
                        {(item.user.name?.[0] || "?") +
                          (item.user.surname?.[0] || "")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {item.user.name || item.user.surname
                            ? `${item.user.name || ""} ${
                                item.user.surname || ""
                              }`.trim()
                            : item.user.email}
                        </p>
                        <p className="text-xs text-white/50 truncate">
                          {item.user.email}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={removingUserId === item.user.id}
                        onClick={() => removeUserFromEvent(item.user.id)}
                        className="h-6 px-2 text-[10px] bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                      >
                        {removingUserId === item.user.id ? "..." : "Treure"}
                      </Button>
                    </li>
                  ) : (
                    <li
                      key={`pair-${item.pair_id}`}
                      className="py-2 flex items-center gap-3"
                    >
                      <div className="relative h-8 w-8">
                        <div className="absolute left-0 top-0 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                          {(item.users[0].name?.[0] || "?") +
                            (item.users[0].surname?.[0] || "")}
                        </div>
                        <div className="absolute left-4 top-0 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] border border-white/10">
                          {(item.users[1].name?.[0] || "?") +
                            (item.users[1].surname?.[0] || "")}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {`${
                            item.users[0].name || item.users[0].surname
                              ? `${item.users[0].name || ""} ${
                                  item.users[0].surname || ""
                                }`.trim()
                              : item.users[0].email
                          } + ${
                            item.users[1].name || item.users[1].surname
                              ? `${item.users[1].name || ""} ${
                                  item.users[1].surname || ""
                                }`.trim()
                              : item.users[1].email
                          }`}
                        </p>
                        <p className="text-xs text-white/50 truncate">
                          Parella
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={removingPairId === item.pair_id}
                        onClick={() => removePairFromEvent(item.pair_id)}
                        className="h-6 px-2 text-[10px] bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                      >
                        {removingPairId === item.pair_id
                          ? "..."
                          : "Treure parella"}
                      </Button>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
