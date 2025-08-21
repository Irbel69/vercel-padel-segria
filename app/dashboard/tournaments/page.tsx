"use client";

import { useState, useEffect, useRef } from "react";
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
  RotateCcw,
  UserCheck,
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
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [autoGeneratingCode, setAutoGeneratingCode] = useState(false);
  const [regeneratingCode, setRegeneratingCode] = useState(false);
  const [joinCodeOpen, setJoinCodeOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const { toast } = useToast();

  // Ref to the visible code text so we can auto-select it (helps on mobile)
  const inviteCodeRef = useRef<HTMLSpanElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const [copyConfirmed, setCopyConfirmed] = useState(false);
  
  // Ref to the join code input for auto-focus
  const joinCodeInputRef = useRef<HTMLInputElement | null>(null);

  // Safari sometimes blocks programmatic focus/select immediately after opening a dialog.
  // retryFocus will attempt to focus/select multiple times with short delays to improve reliability.
  const retryFocus = (attempts = 6, delay = 120) => {
    let tries = 0;
    const tick = () => {
      tries += 1;
      try {
        const el = joinCodeInputRef.current;
        if (el) {
          el.focus();
          try { el.select(); } catch {}
        }
      } catch {}
      if (tries < attempts && (!joinCodeInputRef.current || document.activeElement !== joinCodeInputRef.current)) {
        try { window.setTimeout(tick, delay); } catch {}
      }
    };
    try { window.setTimeout(tick, delay); } catch {}
  };

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
      if (code) {
        setGeneratedCode(code);
        setCodeExpiresAt(null); // Don't store expiration on frontend
      }
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

  const handleRegenerateCode = async () => {
    if (!inviteForEventId || regeneratingCode) return;
    try {
      setRegeneratingCode(true);
      const result = await inviteMutation.mutateAsync({
        eventId: inviteForEventId,
        generateCodeOnly: true,
        forceNew: true, // Force generation of new code
      });
      const code = result?.data?.short_code;
      if (code) {
        setGeneratedCode(code);
        setCodeExpiresAt(null); // Don't store expiration on frontend
      }
      toast({
        title: "Codi regenerat",
        description: "S'ha generat un nou codi d'invitació",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "No s'ha pogut regenerar el codi",
      });
    } finally {
      setRegeneratingCode(false);
    }
  };

  const handleJoinByCode = async () => {
    setJoinError(null);
    setJoining(true);
    try {
      const res = await fetch(`/api/invites/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Map API error/message to inline field error
        setJoinError(data.error || data.message || "No s'ha pogut validar el codi");
        return;
      }
      const token = data?.data?.token as string | undefined;
      if (token) {
        // Navigate to accept page with token
        window.location.href = `/invite/accept?token=${encodeURIComponent(token)}`;
      } else {
        // No token returned => treat as invalid/unknown code (privacy-preserving)
        setJoinError(data.message || "Codi incorrecte o expirat");
      }
    } catch (e: any) {
      // Network or unexpected error -> toast and inline fallback
      const msg = e?.message || "No s'ha pogut validar el codi";
      setJoinError(msg);
      toast({ title: "Error", description: msg });
    } finally {
      setJoining(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    let success = false;
    // Strategy 1: Clipboard API (requires secure context and user gesture)
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && (window as any).isSecureContext) {
        await navigator.clipboard.writeText(text);
        success = true;
      }
    } catch {}

    // Strategy 2: Use the currently selected visible code (execCommand from selection)
    if (!success) {
      try {
        // If the code in the dialog is visible and selected, this can succeed on iOS Safari
        const attempted = document.execCommand && document.execCommand("copy");
        if (attempted) success = true;
      } catch {}
    }

    // Strategy 3: Hidden textarea fallback (works in most browsers including older iOS)
    if (!success) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try { textarea.setSelectionRange(0, text.length); } catch {}
        success = document.execCommand && document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {}
    }

    // Strategy 4: ContentEditable fallback (notably helps with some iOS Safari versions)
    if (!success) {
      try {
        const container = document.createElement("div");
        container.contentEditable = "true";
        container.style.position = "fixed";
        container.style.left = "-9999px";
        container.style.top = "0";
        const span = document.createElement("span");
        span.textContent = text;
        container.appendChild(span);
        document.body.appendChild(container);
        const range = document.createRange();
        range.selectNodeContents(container);
        const selection = window.getSelection?.();
        selection?.removeAllRanges();
        selection?.addRange(range);
        success = document.execCommand && document.execCommand("copy");
        document.body.removeChild(container);
      } catch {}
    }

    if (success) {
      // Inline confirmation and auto-hide
      try {
        if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      } catch {}
      setCopyConfirmed(true);
      try {
        copyTimerRef.current = window.setTimeout(() => setCopyConfirmed(false), 2000);
      } catch {}
      toast({
        title: "Copiat!",
        description: "El codi s'ha copiat al portapapeles",
      });
    } else {
      // As último recurso, dejamos el texto seleccionado para que el usuario pueda copiar manualmente
      selectInviteCodeText();
      toast({
        title: "No s'ha pogut copiar",
        description: "Mantén premut sobre el codi per copiar-lo manualment",
      });
    }
  };

  const selectInviteCodeText = () => {
    try {
      const el = inviteCodeRef.current;
      if (!el) return;
      // Support modern browsers
      const selection = window.getSelection?.();
      if (selection && typeof document.createRange === "function") {
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(el);
        selection.addRange(range);
      } else if ((document as any).body?.createTextRange) {
        // Legacy IE fallback
        const range = (document as any).body.createTextRange();
        range.moveToElementText(el);
        range.select();
      }
    } catch {
      // no-op; selection is a best-effort enhancement for mobile UX
    }
  };

  // Auto-generate code when dialog opens
  useEffect(() => {
    if (inviteForEventId && !generatedCode && !autoGeneratingCode) {
      setAutoGeneratingCode(true);
      setGeneratedCode(null);
      setCodeExpiresAt(null);
      
      // Auto-generate code immediately
      (async () => {
        try {
          const result = await inviteMutation.mutateAsync({
            eventId: inviteForEventId,
            generateCodeOnly: true,
          });
          const code = result?.data?.short_code;
          if (code) {
            setGeneratedCode(code);
            setCodeExpiresAt(null);
          }
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

  // Auto-focus join code input when dialog opens
  useEffect(() => {
    if (joinCodeOpen && joinCodeInputRef.current) {
      // Use a small delay to ensure the dialog is fully rendered
      const timer = setTimeout(() => {
        joinCodeInputRef.current?.focus();
        joinCodeInputRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [joinCodeOpen]);

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
                        {/* Registration Status and Partner Information */}
                        {event.user_registration_status === "confirmed" && event.partner ? (
                          <div className="mb-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-sm text-white/70">
                                <UserCheck className="h-4 w-4 flex-shrink-0" />
                                <span>Parella: {[event.partner.name, event.partner.surname].filter(Boolean).join(" ") || "Nom no disponible"}</span>
                              </div>
                              <div className="flex-shrink-0">
                                {getRegistrationStatusBadge(event.user_registration_status)}
                              </div>
                            </div>
                          </div>
                        ) : event.user_registration_status ? (
                          <div className="mb-2">{getRegistrationStatusBadge(event.user_registration_status)}</div>
                        ) : null}
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
                                setCodeExpiresAt(null);
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
                          {/* Partner Information */}
                          {event.partner && event.user_registration_status === "confirmed" && (
                            <div className="text-sm text-white/70">
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 flex-shrink-0" />
                                <span>Parella: {[event.partner.name, event.partner.surname].filter(Boolean).join(" ") || "Nom no disponible"}</span>
                              </div>
                            </div>
                          )}
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
                                    setCodeExpiresAt(null);
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
                              {registration.partner && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2 text-sm text-white/70">
                                <UserCheck className="h-4 w-4 flex-shrink-0" />
                                <span>Parella: {[registration.partner.name, registration.partner.surname].filter(Boolean).join(" ") || "Nom no disponible"}</span>
                              </div>
                            </div>
                          )}
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
            setCodeExpiresAt(null);
            setAutoGeneratingCode(false);
            setRegeneratingCode(false);
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
                {/* Header with title centered and reload button on the right */}
                <div className="relative mb-2">
                  <h3 className="text-lg font-semibold text-white">Codi d'invitació</h3>
                  {generatedCode && (
                    <button
                      onClick={handleRegenerateCode}
                      disabled={regeneratingCode}
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-zinc-800/90 border border-white/20 text-white hover:bg-zinc-700 rounded-full p-2 shadow-lg transition-all duration-200 disabled:opacity-50"
                      title="Generar nou codi"
                    >
                      {regeneratingCode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                
                {autoGeneratingCode ? (
                  <div className="flex items-center justify-center space-x-2 py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-padel-primary" />
                    <span className="text-white/60">Generant codi...</span>
                  </div>
                ) : generatedCode ? (
                  <div className="space-y-3">
                    {/* Code display centered */}
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Copiar codi d'invitació"
                      onClick={() => {
                        selectInviteCodeText();
                        copyToClipboard(generatedCode);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectInviteCodeText();
                          copyToClipboard(generatedCode);
                        }
                      }}
                      className={`bg-padel-primary rounded-lg p-5 cursor-pointer hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-padel-primary/60 focus:ring-offset-zinc-900 shadow-lg transition-all duration-200 group`}
                    >
                      <div className="text-center space-y-3">
                        <div className="font-mono text-3xl md:text-4xl font-extrabold tracking-[0.4em] text-black drop-shadow-sm">
                          <span ref={inviteCodeRef} className="select-all">{generatedCode}</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-black/80 group-hover:text-black transition-colors">
                          <Copy className="h-4 w-4" />
                          <span className="text-sm font-semibold">Clic per copiar</span>
                        </div>
                      </div>
                    </div>

                    {/* Expiration info - removed since we don't check client-side anymore */}
                  </div>
                ) : (
                  <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    Error generant el codi. Tanca i torna a intentar-ho.
                  </div>
                )}
              </div>
              {copyConfirmed && (
                <div aria-live="polite" className="flex items-center justify-center gap-2 text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Codi copiat al portapapers</span>
                </div>
              )}
              
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
                setCodeExpiresAt(null);
                setAutoGeneratingCode(false);
                setRegeneratingCode(false);
                try { if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current); } catch {}
                setCopyConfirmed(false);
              }} 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Tancar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Join by code dialog */}
      <Dialog open={joinCodeOpen} onOpenChange={(open) => {
        setJoinCodeOpen(open);
        if (!open) {
          setJoinError(null);
          setJoinCode("");
        }
      }}>
        <DialogContent
          onOpenAutoFocus={(e) => {
            // Prevent the dialog's default auto-focus behavior so we can focus the inner input
            e.preventDefault();
            // Use retryFocus to handle Safari focus restrictions by retrying a few times
            try { retryFocus(6, 120); } catch {}
          }}
          className="bg-zinc-900/90 backdrop-blur-md border-white/10 text-white max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Unir-me amb codi</DialogTitle>
            <DialogDescription>
              Introdueix el codi d'invitació que t'ha compartit la teva parella per unir-te al torneig.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {(() => {
              const validPattern = /^[A-Z0-9]{6}$/;
              const isValid = validPattern.test(joinCode);
              return (
                <div>
                  <Input
                    ref={joinCodeInputRef}
                    placeholder="Introdueix el codi"
                    value={joinCode}
                    onChange={(e) => {
                      const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                      setJoinCode(raw);
                      if (joinError) setJoinError(null);
                    }}
                    aria-invalid={!!joinError || (!isValid && joinCode.length > 0)}
                    aria-describedby="join-code-help"
                    className={
                      `bg-white/10 text-white placeholder:text-white/40 uppercase tracking-widest ` +
                      `border ${joinError || (!isValid && joinCode.length > 0) ? "border-red-500/50 focus-visible:ring-red-500" : "border-white/20 focus-visible:ring-padel-primary"}`
                    }
                    maxLength={6}
                  />
                  <p id="join-code-help" className={`mt-2 text-xs ${joinError ? "text-red-400" : "text-white/60"}`}>
                    {joinError ? joinError : "El codi té 6 caràcters (lletres i números). Exemple: ABC123"}
                  </p>
                </div>
              );
            })()}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleJoinByCode}
                disabled={joining || !/^[A-Z0-9]{6}$/.test(joinCode)}
                className="bg-padel-primary text-black hover:bg-padel-primary/90 font-semibold"
              >
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
