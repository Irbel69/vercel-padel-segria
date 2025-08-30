"use client";

import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import TournamentsHeader from "@/components/tournaments/TournamentsHeader";
import AvailableEventsSection from "@/components/tournaments/ui/AvailableEventsSection";
import MyRegistrationsSection from "@/components/tournaments/ui/MyRegistrationsSection";
import InviteDialogContainer from "@/components/tournaments/ui/InviteDialogContainer";
import JoinByCodeDialogContainer from "@/components/tournaments/ui/JoinByCodeDialogContainer";
import { useEventsPagination } from "@/components/tournaments/hooks/useEventsPagination";
import { useUserRegistrations } from "@/components/tournaments/hooks/useUserRegistrations";
import { useDateFormatting } from "@/components/tournaments/hooks/useDateFormatting";
import { useEventLogic } from "@/components/tournaments/hooks/useEventLogic";
import { useBadges } from "@/components/tournaments/hooks/useBadges";

export default function TournamentsPage() {
  const { user } = useUser();

  // Data hooks
  const { events, pagination, isEventsLoading, setPage } = useEventsPagination(10);
  const {
    userRegistrations,
    isRegistrationsLoading,
    processingEvents,
    handleUnregister,
    error,
  } = useUserRegistrations(user);
  const { formatDate, formatDateTime } = useDateFormatting();
  const { canRegister, canUnregister, isRegistrationUrgent } = useEventLogic();
  const { getStatusBadge, getRegistrationStatusBadge } = useBadges();

  // UI state controlled at page level
  const [inviteForEventId, setInviteForEventId] = useState<number | null>(null);
  const [inviteForEventTitle, setInviteForEventTitle] = useState<string | null>(null);
  const [joinCodeOpen, setJoinCodeOpen] = useState(false);

  const isUserRegistered = !!(inviteForEventId && userRegistrations?.some((r) => r.event_id === inviteForEventId));

  return (
    <div className="space-y-3 md:space-y-6 px-2 md:px-0 max-w-full overflow-hidden">
      <TournamentsHeader
        totalEvents={pagination?.totalEvents ?? null}
        onOpenJoinCode={() => setJoinCodeOpen(true)}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="available" className="space-y-3 md:space-y-6 w-full">
        <TabsList className=" bg-gray-800/80 border-gray-600/50 backdrop-blur-sm shadow-lg w-full mx-auto sm:w-auto p-1 rounded-xl">
          <TabsTrigger
            value="available"
            className="data-[state=active]:bg-padel-primary data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-padel-primary/20 text-xs sm:text-sm flex-1 sm:flex-initial text-gray-300 hover:text-white transition-all duration-200 rounded-lg font-medium"
          >
            <span className="sm:hidden">Disponibles</span>
            <span className="hidden sm:inline">Esdeveniments Disponibles</span>
          </TabsTrigger>
          <TabsTrigger
            value="my-registrations"
            className="data-[state=active]:bg-padel-primary data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-padel-primary/20 text-xs sm:text-sm flex-1 sm:flex-initial text-gray-300 hover:text-white transition-all duration-200 rounded-lg font-medium"
          >
            <span className="sm:hidden">Inscrit</span>
            <span className="hidden sm:inline">Les Meves Inscripcions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <AvailableEventsSection
            events={events}
            pagination={pagination}
            isEventsLoading={isEventsLoading}
            processingEvents={processingEvents}
            onInvite={(id) => {
              const ev = events?.find((e) => e.id === id);
              setInviteForEventTitle(ev?.title ?? null);
              setInviteForEventId(id);
            }}
            onUnregister={handleUnregister}
            onPageChange={setPage}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            getStatusBadge={getStatusBadge}
            getRegistrationStatusBadge={getRegistrationStatusBadge}
            canRegister={canRegister}
            canUnregister={canUnregister}
            isRegistrationUrgent={isRegistrationUrgent}
            onShowCode={(id) => {
              const ev = events?.find((e) => e.id === id);
              setInviteForEventTitle(ev?.title ?? null);
              setInviteForEventId(id);
            }}
          />
        </TabsContent>

        <TabsContent value="my-registrations">
          <MyRegistrationsSection
            registrations={userRegistrations}
            isLoading={isRegistrationsLoading}
            processingEvents={processingEvents}
            onUnregister={handleUnregister}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            canUnregister={canUnregister}
            getStatusBadge={getStatusBadge}
            getRegistrationStatusBadge={getRegistrationStatusBadge}
            canRegister={canRegister}
            isRegistrationUrgent={isRegistrationUrgent}
            onShowCode={(id) => setInviteForEventId(id)}
          />
        </TabsContent>
      </Tabs>

      <InviteDialogContainer
        openForEventId={inviteForEventId}
        onClose={() => {
          setInviteForEventId(null);
          setInviteForEventTitle(null);
        }}
        isUserRegistered={isUserRegistered}
        eventTitle={inviteForEventTitle}
      />

      <JoinByCodeDialogContainer
        open={joinCodeOpen}
        onOpenChange={setJoinCodeOpen}
      />
    </div>
  );
}
