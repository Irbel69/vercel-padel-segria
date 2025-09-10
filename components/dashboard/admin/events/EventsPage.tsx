"use client";

import React, { useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

import { useEvents } from "./hooks/use-events";
import { useEventModal } from "./hooks/use-event-modal";
import { useParticipantsModal } from "./hooks/use-participants-modal";

import { EventsHeader } from "./ui/EventsHeader";
import { EventsSearch } from "./ui/EventsSearch";
import { EventsList } from "./ui/EventsList";
import { CreateEditEventModal } from "./ui/CreateEditEventModal";
import { ParticipantsModal } from "./ui/ParticipantsModal";

export default function AdminEventsPage() {
  const { user, profile, isLoading: userLoading } = useUser();
  
  // Events hook
  const {
    events,
    pagination,
    isLoading,
    error,
    search,
    setSearch,
    currentPage,
    fetchEvents,
    handlePageChange,
    handleDelete,
    setError,
  } = useEvents();

  // Event modal hook
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditing,
    editingEvent,
    isSubmitting,
    formData,
    setFormData,
    imageUploading,
    localImagePreview,
    selectedImageFile,
    imageDirty,
    openCreateModal,
    openEditModal,
    onImageSelected,
    onRemoveImage,
    handleSubmit,
  } = useEventModal();

  // Participants modal hook
  const {
    isParticipantsModalOpen,
    setIsParticipantsModalOpen,
    participantsLoading,
    participantsError,
    participantsEvent,
    participants,
    userSearch,
    setUserSearch,
    userSearchResults,
    userSearchLoading,
    addingUserId,
    removingUserId,
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
    openParticipantsModal,
    addUserToEvent,
    removeUserFromEvent,
    addPairToEvent,
    removePairFromEvent,
  } = useParticipantsModal();

  // Redirect if not admin
  useEffect(() => {
    if (!userLoading && (!profile || !profile.is_admin)) {
      redirect("/dashboard");
    }
  }, [profile, userLoading]);

  // Initial load
  useEffect(() => {
    if (profile?.is_admin) {
      fetchEvents(currentPage, search);
    }
  }, [profile?.is_admin, currentPage]);

  const handleEventSubmit = async (e: React.FormEvent) => {
    try {
      await handleSubmit(e, () => fetchEvents(currentPage, search));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconegut");
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
      <EventsHeader onCreateClick={openCreateModal} />

      {/* Search */}
      <EventsSearch search={search} onSearchChange={setSearch} />

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Events List */}
      <EventsList
        events={events}
        pagination={pagination}
        isLoading={isLoading}
        search={search}
        onPageChange={handlePageChange}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onParticipants={openParticipantsModal}
      />

      {/* Create/Edit Event Modal */}
      <CreateEditEventModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        isEditing={isEditing}
        isSubmitting={isSubmitting}
        formData={formData}
        setFormData={setFormData}
        localImagePreview={localImagePreview}
        imageUploading={imageUploading}
        onImageSelected={onImageSelected}
        onRemoveImage={onRemoveImage}
        onSubmit={handleEventSubmit}
      />

      {/* Participants Modal */}
      <ParticipantsModal
        isOpen={isParticipantsModalOpen}
        onOpenChange={setIsParticipantsModalOpen}
        participantsLoading={participantsLoading}
        participantsError={participantsError}
        participantsEvent={participantsEvent}
        participants={participants}
        userSearch={userSearch}
        setUserSearch={setUserSearch}
        userSearchResults={userSearchResults}
        userSearchLoading={userSearchLoading}
        addingUserId={addingUserId}
        removingUserId={removingUserId}
        userSearchA={userSearchA}
        setUserSearchA={setUserSearchA}
        userSearchB={userSearchB}
        setUserSearchB={setUserSearchB}
        userSearchResultsA={userSearchResultsA}
        userSearchResultsB={userSearchResultsB}
        userSearchLoadingA={userSearchLoadingA}
        userSearchLoadingB={userSearchLoadingB}
        selectedA={selectedA}
        setSelectedA={setSelectedA}
        selectedB={selectedB}
        setSelectedB={setSelectedB}
        addingPair={addingPair}
        removingPairId={removingPairId}
        onAddUser={addUserToEvent}
        onRemoveUser={removeUserFromEvent}
        onAddPair={addPairToEvent}
        onRemovePair={removePairFromEvent}
      />
    </div>
  );
}