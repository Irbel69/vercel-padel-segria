"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createClient as createSbBrowser } from "@/libs/supabase/client";
import { uploadEventCover } from "@/libs/supabase/storage";
import type { Event, CreateEventData } from "@/types";

export function useEventModal() {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateEventData>({
    title: "",
    date: "",
    location: "",
    latitude: undefined,
    longitude: undefined,
    prizes: "",
    max_participants: 16,
    pair_required: true,
    registration_deadline: "",
    image_url: undefined,
  });

  // Image upload state
  const [imageUploading, setImageUploading] = useState(false);
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(
    null
  );
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imageDirty, setImageDirty] = useState(false);

  // Convert an ISO datetime to YYYY-MM-DD for date inputs
  const toDateInputValue = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
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
      date: toDateInputValue(event.date),
      location: event.location || "",
      latitude: event.latitude || undefined,
      longitude: event.longitude || undefined,
      prizes: event.prizes || "",
      max_participants: event.max_participants,
      pair_required: event.pair_required ?? true,
      registration_deadline: toDateInputValue(event.registration_deadline),
      image_url: event.image_url || undefined,
    });
    setEditingEvent(event);
    setIsEditing(true);
    setIsCreateModalOpen(true);
    setLocalImagePreview(event.image_url || null);
    setSelectedImageFile(null);
    setImageDirty(false);
  };

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
        
        // Persist immediately on edit
        try {
          const sb = createSbBrowser();
          const { data: sessionData } = await sb.auth.getSession();
          const accessToken = sessionData.session?.access_token;
          let resp = await fetch(`/api/admin/events/${editingEvent.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            credentials: "include",
            body: JSON.stringify({ image_url: publicUrl }),
          });
          if (resp.status === 401) {
            await sb.auth.getSession();
            const { data: s2 } = await sb.auth.getSession();
            const at2 = s2.session?.access_token;
            resp = await fetch(`/api/admin/events/${editingEvent.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(at2 ? { Authorization: `Bearer ${at2}` } : {}),
              },
              credentials: "include",
              body: JSON.stringify({ image_url: publicUrl }),
            });
          }
          if (resp.ok) {
            setImageDirty(false);
          }
        } catch (e) {
          console.warn("Failed to persist image_url immediately:", e);
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
    
    if (isEditing && editingEvent?.id) {
      try {
        const sb = createSbBrowser();
        const { data: sessionData } = await sb.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        let resp = await fetch(`/api/admin/events/${editingEvent.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({ image_url: null }),
        });
        if (resp.status === 401) {
          await sb.auth.getSession();
          const { data: s2 } = await sb.auth.getSession();
          const at2 = s2.session?.access_token;
          resp = await fetch(`/api/admin/events/${editingEvent.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(at2 ? { Authorization: `Bearer ${at2}` } : {}),
            },
            credentials: "include",
            body: JSON.stringify({ image_url: null }),
          });
        }
        if (resp.ok) {
          setImageDirty(false);
        }
      } catch (e) {
        console.warn("Failed to clear image_url immediately:", e);
      }
    }
    toast({
      title: "Imatge eliminada",
      description: "Desa per aplicar canvis.",
    });
  };

  const handleSubmit = async (e: React.FormEvent, onSuccess: () => void) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/admin/events/${editingEvent?.id}`
        : "/api/admin/events";
      const method = isEditing ? "PUT" : "POST";

      const payload: any = {
        title: formData.title,
        date: formData.date,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        prizes: formData.prizes,
        max_participants: formData.max_participants,
        pair_required: formData.pair_required,
        registration_deadline: formData.registration_deadline,
      };

      if (!isEditing) {
        if (typeof formData.image_url !== "undefined") {
          payload.image_url = formData.image_url ?? null;
        }
      } else if (imageDirty) {
        payload.image_url =
          typeof formData.image_url === "undefined" ? null : formData.image_url;
      }

      const sb = createSbBrowser();
      const { data: sessionData } = await sb.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      let response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      
      if (response.status === 401) {
        await sb.auth.getSession();
        const { data: s2 } = await sb.auth.getSession();
        const at2 = s2.session?.access_token;
        response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...(at2 ? { Authorization: `Bearer ${at2}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

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
          const { data: sessionData2 } = await sb.auth.getSession();
          const accessToken2 = sessionData2.session?.access_token;
          let putResp = await fetch(`/api/admin/events/${data.data.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken2 ? { Authorization: `Bearer ${accessToken2}` } : {}),
            },
            credentials: "include",
            body: JSON.stringify({
              image_url: publicUrl,
              title: data.data.title,
              date: data.data.date,
              registration_deadline: data.data.registration_deadline,
              max_participants: data.data.max_participants,
            }),
          });
          if (putResp.status === 401) {
            await sb.auth.getSession();
            const { data: s3 } = await sb.auth.getSession();
            const at3 = s3.session?.access_token;
            putResp = await fetch(`/api/admin/events/${data.data.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(at3 ? { Authorization: `Bearer ${at3}` } : {}),
              },
              credentials: "include",
              body: JSON.stringify({
                image_url: publicUrl,
                title: data.data.title,
                date: data.data.date,
                registration_deadline: data.data.registration_deadline,
                max_participants: data.data.max_participants,
              }),
            });
          }
        } catch (e) {
          console.warn("Unable to upload image post-create:", e);
        }
      }

      setIsCreateModalOpen(false);
      resetForm();
      onSuccess();
    } catch (err) {
      console.error("Error submitting event:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
}