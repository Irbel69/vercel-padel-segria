"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Target,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LocationMapButton } from "@/components/LocationMapButton";
import type { Event, EventsListResponse, Registration } from "@/types";
import { useEventsList, useRegisterForEvent, useUnregisterFromEvent, useCreatePairInvite } from "@/hooks/use-events";

export default function TournamentsPage() {
  const { user, profile } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<Registration[]>([]);
  const [pagination, setPagination] = useState<EventsListResponse["pagination"] | null>(null);
  const [isRegistrationsLoading, setIsRegistrationsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [processingEvents, setProcessingEvents] = useState<Set<number>>(new Set());
  // Pair invite UI state
  const [inviteForEventId, setInviteForEventId] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [autoGeneratingCode, setAutoGeneratingCode] = useState(false);
  const [joinCodeOpen, setJoinCodeOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const { toast } = useToast();

  // React Query mutations
  const inviteMutation = useCreatePairInvite();

  const handleInviteSubmit = async (generateCodeOnly = false) => {
    if (!inviteForEventId) return;
    try {
      const result = await inviteMutation.mutateAsync({
        eventId: inviteForEventId,
        email: generateCodeOnly ? undefined : inviteEmail || undefined,
        generateCodeOnly: !!generateCodeOnly,
      });
      const code = result?.data?.short_code;
      if (code) setGeneratedCode(code);
      toast({
        title: "Invitació creada",
        description: generateCodeOnly
          ? "Comparteix el codi amb la teva parella"
          : "Hem enviat un correu si l'adreça és correcta",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "No s'ha pogut crear la invitació",
      });
    }
  };

  const handleJoinByCode = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/invites/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Error");
      const token = data?.data?.token as string | undefined;
      if (token) {
        // Navigate to accept page with token
        window.location.href = `/invite/accept?token=${encodeURIComponent(token)}`;
      } else {
        toast({
          title: "Informació",
          description: data.message || "Si el codi és correcte, pots continuar",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "No s'ha pogut validar el codi",
      });
    } finally {
      setJoining(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      // Prefer modern API when available and in secure context
      if (typeof navigator !== "undefined" && navigator.clipboard && (window as any).isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for iOS Safari and older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        // Avoid scrolling to bottom
        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "0";
        textarea.style.opacity = "0";
        textarea.setAttribute("readonly", "");
        document.body.appendChild(textarea);

        // Select the text (iOS-compatible)
        textarea.focus();
        textarea.select();
        try {
          textarea.setSelectionRange(0, text.length);
        } catch {}

        try {
          document.execCommand("copy");
        } finally {
          document.body.removeChild(textarea);
        }
      }
      toast({
        title: "Copiat!",
        description: "El codi s'ha copiat al portapapeles",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No s'ha pogut copiar el codi",
      });
    }
  };

  // Auto-generate code when dialog opens
  useEffect(() => {
    if (inviteForEventId && !generatedCode && !autoGeneratingCode) {
      setAutoGeneratingCode(true);
      setGeneratedCode(null);
      
      // Auto-generate code immediately
      (async () => {
        try {
          const result = await inviteMutation.mutateAsync({
            eventId: inviteForEventId,
            generateCodeOnly: true,
          });
          const code = result?.data?.short_code;
          if (code) setGeneratedCode(code);
        } catch (e: any) {
          toast({
            title: "Error",
            description: "No s'ha pogut generar el codi automàticament",
          });
        } finally {
          setAutoGeneratingCode(false);
        }
      })();
    }
  }, [inviteForEventId, generatedCode, autoGeneratingCode, inviteMutation, toast]);

  // React Query: events list
  const { data: eventsData, isLoading: isEventsLoading } = useEventsList({ page: currentPage, limit: 10 });

  useEffect(() => {
    if (eventsData) {
      setEvents(eventsData.events);
      setPagination(eventsData.pagination);
    }
  }, [eventsData]);

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

  // Initial load
  useEffect(() => {
    if (user) {
      fetchUserRegistrations();
    }
  }, [user]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const registerMutation = useRegisterForEvent();
  const unregisterMutation = useUnregisterFromEvent();

  const handleRegister = async (eventId: number) => {
    if (processingEvents.has(eventId)) return;

    setProcessingEvents((prev) => new Set(prev).add(eventId));
    setError(null);

    try {
      await registerMutation.mutateAsync(eventId);
      // Refresh registrations list
      fetchUserRegistrations();
    } catch (err: any) {
      console.error("Error registering:", err);
      setError(err instanceof Error ? err.message : "Error desconegut");
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
      // Refresh registrations list
      fetchUserRegistrations();
    } catch (err: any) {
      console.error("Error unregistering:", err);
      setError(err instanceof Error ? err.message : "Error desconegut");
    } finally {
      setProcessingEvents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

  const getShortLocation = (location: string) => {
    if (!location) return "";
    const parts = location.split(",");
    if (parts.length >= 3) {
      return parts[1]?.trim() || parts[0]?.trim();
    }
    return parts[0]?.trim();
  };

  const isRegistrationUrgent = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDeadline <= 24 && hoursUntilDeadline > 0;
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
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
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

  const getRegistrationStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmat
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            Pendent
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="bg-red-500/20 text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            Cancel·lat
          </Badge>
        );
      default:
        return null;
    }
  };

  const canRegister = (event: Event) => {
    const registrationDeadline = new Date(event.registration_deadline);
    const now = new Date();

    return (
      event.status === "open" &&
      registrationDeadline > now &&
      (event.current_participants || 0) < event.max_participants &&
      !event.user_registration_status
    );
  };

  const canUnregister = (event: Event) => {
    const eventDate = new Date(event.date);
    const now = new Date();
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    return event.user_registration_status === "confirmed" && hoursUntilEvent >= 24;
  };

  return (
    <div className="space-y-3 md:space-y-6 px-2 md:px-0 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-row items-center gap-2 md:gap-3">
        <div className="p-1.5 md:p-2 bg-padel-primary/20 rounded-lg">
          <Target className="h-5 w-5 md:h-6 md:w-6 text-padel-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-3xl font-bold text-white">Tornejos</h1>
          <p className="text-white/60 text-xs md:text-base">Participa en competicions i esdeveniments</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="available" className="space-y-3 md:space-y-6">
        <TabsList className="bg-white/5 border-white/10 w-full sm:w-auto">
          <TabsTrigger value="available" className="data-[state=active]:bg-padel-primary data-[state=active]:text-black text-xs sm:text-sm flex-1 sm:flex-initial">
            <span className="sm:hidden">Disponibles</span>
            <span className="hidden sm:inline">Esdeveniments Disponibles</span>
          </TabsTrigger>
          <TabsTrigger value="my-registrations" className="data-[state=active]:bg-padel-primary data-[state=active]:text-black text-xs sm:text-sm flex-1 sm:flex-initial">
            <span className="sm:hidden">Meves</span>
            <span className="hidden sm:inline">Les Meves Inscripcions</span>
          </TabsTrigger>
        </TabsList>

        {/* Available Events */}
        <TabsContent value="available">
          <Card className="bg-white/5 border-white/10 w-full max-w-full overflow-hidden">
            <CardHeader className="px-3 md:px-6 space-y-2">
              <CardTitle className="text-white text-lg md:text-xl text-center sm:text-left">
                Esdeveniments Disponibles
              </CardTitle>
              {pagination && (
                // Hide badge on mobile, show from sm and up
                <div className="hidden sm:flex justify-center">
                  <Badge variant="secondary" className="bg-padel-primary/20 text-padel-primary">
                    {pagination.totalEvents} esdeveniments
                  </Badge>
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  onClick={() => setJoinCodeOpen(true)}
                  className="w-full sm:w-auto bg-zinc-800/70 border border-white/20 text-white hover:bg-zinc-700 rounded-lg font-semibold"
                >
                  Unir-me amb codi
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-3 md:px-6 max-w-full overflow-hidden">
              {isEventsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No hi ha esdeveniments disponibles</p>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-4 max-w-full">
                  {events.map((event) => (
                    <div key={event.id} className="p-2 md:p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors max-w-full overflow-hidden">
                      {/* Mobile Layout */}
                      <div className="md:hidden max-w-full">
                        {/* Title and Status */}
                        <div className="flex items-start justify-between gap-2 mb-2 max-w-full">
                          <h3 className="text-white font-semibold text-base leading-tight flex-1 min-w-0 truncate">{event.title}</h3>
                          <div className="flex-shrink-0">{getStatusBadge(event.status)}</div>
                        </div>
                        {/* Date and Participants */}
                        <div className="flex items-center justify-between mb-2 text-sm text-white/70 max-w-full">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{formatDate(event.date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Users className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="text-xs whitespace-nowrap">{event.current_participants || 0}/{event.max_participants}</span>
                          </div>
                        </div>
                        {/* Location */}
                        {event.location && (
                          <div className="mb-3 text-sm text-white/60 max-w-full">
                            <div className="flex items-center gap-1.5 p-1">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-padel-primary" />
                              <span className="truncate flex-1">{getShortLocation(event.location)}</span>
                              {event.latitude && event.longitude && (
                                <button
                                  onClick={() => {
                                    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
                                    const mapsUrl = isMac
                                      ? `maps://maps.apple.com/?q=${encodeURIComponent(event.location)}&ll=${event.latitude},${event.longitude}&z=15`
                                      : `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;
                                    window.open(mapsUrl, "_blank");
                                  }}
                                  className="text-xs text-padel-primary opacity-70 whitespace-nowrap flex-shrink-0"
                                >
                                  toca aquí
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Registration Status */}
                        {event.user_registration_status && (
                          <div className="mb-2">{getRegistrationStatusBadge(event.user_registration_status)}</div>
                        )}
                        {/* Urgent Registration Deadline */}
                        {isRegistrationUrgent(event.registration_deadline) && (
                          <div className="mb-2 text-xs text-orange-400 flex items-center gap-1.5 max-w-full">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">Límit: {formatDateTime(event.registration_deadline)}</span>
                          </div>
                        )}
                        {/* Action Button */}
                        <div className="pt-2 max-w-full">
                          {canUnregister(event) && (
                            <Button variant="outline" onClick={() => handleUnregister(event.id)} disabled={processingEvents.has(event.id)} className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm w-full">
                              {processingEvents.has(event.id) ? "Cancel·lant..." : "Cancel·lar"}
                            </Button>
                          )}
                          {event.user_registration_status && !canUnregister(event) && (
                            <Button variant="outline" disabled className="bg-white/10 border-white/20 text-white/50 text-sm w-full">
                              Inscrit
                            </Button>
                          )}
                          {canRegister(event) && (
                            <Button
                              onClick={() => {
                                setInviteForEventId(event.id);
                                setInviteEmail("");
                                setGeneratedCode(null);
                              }}
                              className="bg-padel-primary text-black hover:bg-padel-primary/90 text-sm w-full font-semibold"
                            >
                              Inscriure'm amb parella
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:block">
                        <div className="space-y-3">
                          {/* Header with title and badges */}
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-white font-semibold text-lg">{event.title}</h3>
                            <div className="flex gap-2">
                              {getStatusBadge(event.status)}
                              {event.user_registration_status && getRegistrationStatusBadge(event.user_registration_status)}
                            </div>
                          </div>
                          {/* Main info grid */}
                          <div className="grid grid-cols-2 gap-4 text-sm text-white/70">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 flex-shrink-0" />
                              <span>{event.current_participants || 0}/{event.max_participants} participants</span>
                            </div>
                          </div>
                          {/* Location */}
                          {event.location && (
                            <div className="text-sm text-white/60">
                              <div className="flex items-center gap-2 p-2">
                                <MapPin className="h-4 w-4 flex-shrink-0 text-padel-primary" />
                                <span className="truncate">{getShortLocation(event.location)}</span>
                                {event.latitude && event.longitude && (
                                  <button
                                    onClick={() => {
                                      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
                                      const mapsUrl = isMac
                                        ? `maps://maps.apple.com/?q=${encodeURIComponent(event.location)}&ll=${event.latitude},${event.longitude}&z=15`
                                        : `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;
                                      window.open(mapsUrl, "_blank");
                                    }}
                                    className="ml-1 text-xs text-padel-primary hover:text-padel-primary/80 hover:underline transition-colors flex-shrink-0"
                                  >
                                    toca aquí
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          {/* Prizes */}
                          {event.prizes && (
                            <div className="flex items-center gap-2 text-sm text-white/60">
                              <Trophy className="h-4 w-4 flex-shrink-0" />
                              <span>{event.prizes}</span>
                            </div>
                          )}
                          {/* Registration deadline and action buttons */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="text-xs text-white/50">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span>Límit inscripció: {formatDateTime(event.registration_deadline)}</span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {canRegister(event) && (
                                <Button
                                  onClick={() => {
                                    setInviteForEventId(event.id);
                                    setInviteEmail("");
                                    setGeneratedCode(null);
                                  }}
                                  className="bg-padel-primary text-black hover:bg-padel-primary/90 font-semibold"
                                >
                                  Inscriure'm amb parella
                                </Button>
                              )}
                              {canUnregister(event) && (
                                <Button
                                  variant="outline"
                                  onClick={() => handleUnregister(event.id)}
                                  disabled={processingEvents.has(event.id)}
                                  className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                                >
                                  {processingEvents.has(event.id) ? "Cancel·lant..." : "Cancel·lar"}
                                </Button>
                              )}
                              {event.user_registration_status && !canUnregister(event) && (
                                <Button variant="outline" disabled className="bg-white/10 border-white/20 text-white/50">
                                  Inscrit
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t border-white/10 gap-4">
                  <p className="text-white/60 text-sm text-center sm:text-left">Pàgina {pagination.currentPage} de {pagination.totalPages}</p>
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
        </TabsContent>

        {/* User Registrations */}
        <TabsContent value="my-registrations">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-lg md:text-xl">Les Meves Inscripcions</span>
                <Badge variant="secondary" className="bg-padel-primary/20 text-padel-primary self-start sm:self-auto">
                  {userRegistrations.length} inscripcions
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isRegistrationsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ))}
                </div>
              ) : userRegistrations.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No tens cap inscripció activa</p>
                  <p className="text-white/40 text-sm mt-2">Explora els esdeveniments disponibles per participar en tornejos</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {userRegistrations.map((registration) => (
                    <div key={registration.id} className="p-3 md:p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="text-white font-semibold text-base md:text-lg">{registration.event?.title}</h3>
                            {getRegistrationStatusBadge(registration.status)}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 text-sm text-white/70">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{formatDate(registration.event?.date || "")}</span>
                            </div>
                            {registration.event?.location && (
                              <div className="flex items-center gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <MapPin className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{registration.event.location}</span>
                                </div>
                                {registration.event.latitude && registration.event.longitude && (
                                  <LocationMapButton latitude={registration.event.latitude} longitude={registration.event.longitude} location={registration.event.location} />
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{registration.event?.current_participants || 0}/{registration.event?.max_participants} participants</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-white/50">
                            <span>Inscrit el: {formatDateTime(registration.registered_at)}</span>
                          </div>
                          {registration.event?.prizes && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2 text-sm text-white/60">
                                <Trophy className="h-4 w-4 flex-shrink-0" />
                                <span className="break-words">{registration.event.prizes}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        {registration.status === "confirmed" && registration.event && canUnregister({ ...registration.event, user_registration_status: registration.status }) && (
                          <div className="flex justify-end lg:ml-4">
                            <Button
                              variant="outline"
                              onClick={() => handleUnregister(registration.event_id)}
                              disabled={processingEvents.has(registration.event_id)}
                              className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm w-full sm:w-auto"
                            >
                              <span className="sm:hidden">{processingEvents.has(registration.event_id) ? "..." : "Cancel·lar"}</span>
                              <span className="hidden sm:inline">{processingEvents.has(registration.event_id) ? "Cancel·lant..." : "Cancel·lar"}</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Invite dialog */}
      <Dialog 
        open={inviteForEventId !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setInviteForEventId(null);
            setInviteEmail("");
            setGeneratedCode(null);
            setAutoGeneratingCode(false);
          }
        }}
      >
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="bg-zinc-900/90 backdrop-blur-md border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Inscripció amb Parella</DialogTitle>
            <DialogDescription>
              Crea una invitació per inscriure't amb parella. Copia el codi o envia'l per correu.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Code section - primary */}
            <div className="space-y-3">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Codi d'invitació</h3>
                {autoGeneratingCode ? (
                  <div className="flex items-center justify-center space-x-2 py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-padel-primary" />
                    <span className="text-white/60">Generant codi...</span>
                  </div>
                ) : generatedCode ? (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Copiar codi d'invitació"
                    onClick={() => copyToClipboard(generatedCode)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        copyToClipboard(generatedCode);
                      }
                    }}
                    className="bg-padel-primary rounded-lg p-5 cursor-pointer hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-padel-primary/60 focus:ring-offset-zinc-900 shadow-lg transition-all duration-200 group select-none"
                  >
                    <div className="text-center space-y-3">
                      <div className="font-mono text-3xl md:text-4xl font-extrabold tracking-[0.4em] text-black drop-shadow-sm select-all">
                        {generatedCode}
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-black/80 group-hover:text-black transition-colors">
                        <Copy className="h-4 w-4" />
                        <span className="text-sm font-semibold">Clic per copiar</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    Error generant el codi. Tanca i torna a intentar-ho.
                  </div>
                )}
              </div>
              
              {generatedCode && (
                <p className="text-xs text-white/60 text-center">
                  Comparteix aquest codi amb la teva parella per unir-se al torneig
                </p>
              )}
            </div>

            {/* Email section - secondary */}
            <div className="border-t border-white/10 pt-4 space-y-3">
              <div className="text-sm">
                <label className="text-white/80 font-medium">Enviar per email (opcional)</label>
                <p className="text-xs text-white/60 mt-1">Envia directament la invitació al correu de la teva parella</p>
              </div>
              <div className="space-y-2">
                <Input 
                  type="email" 
                  placeholder="correu@exemple.com" 
                  value={inviteEmail} 
                  onChange={(e) => setInviteEmail(e.target.value)} 
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                <Button 
                  onClick={() => handleInviteSubmit(false)} 
                  disabled={inviteSubmitting || !inviteEmail.trim()} 
                  className="bg-padel-primary text-black hover:bg-padel-primary/90 w-full"
                  size="sm"
                >
                  {inviteSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviant...
                    </>
                  ) : (
                    "Enviar invitació"
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setInviteForEventId(null);
                setInviteEmail("");
                setGeneratedCode(null);
                setAutoGeneratingCode(false);
              }} 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Tancar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Join by code dialog */}
      <Dialog open={joinCodeOpen} onOpenChange={setJoinCodeOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="bg-zinc-900/90 backdrop-blur-md border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Unir-me amb codi</DialogTitle>
            <DialogDescription>
              Introdueix el codi d'invitació que t'ha compartit la teva parella per unir-te al torneig.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Introdueix el codi" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="bg-white/10 border-white/20 text-white placeholder:text-white/40 uppercase tracking-widest" />
            <div className="flex gap-2 pt-1">
              <Button onClick={handleJoinByCode} disabled={joining || !joinCode} className="bg-padel-primary text-black hover:bg-padel-primary/90 font-semibold">
                {joining ? "Validant..." : "Continuar"}
              </Button>
              <Button variant="outline" onClick={() => setJoinCodeOpen(false)} className="bg-white/10 border-white/20 text-white hover:bg-white/20">Cancel·lar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
