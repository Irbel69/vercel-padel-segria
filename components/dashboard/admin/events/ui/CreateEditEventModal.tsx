import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LocationPicker from "@/components/map/LocationPicker";
import { ImageUploader } from "./ImageUploader";
import type { CreateEventData } from "@/types";

interface CreateEditEventModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  isSubmitting: boolean;
  formData: CreateEventData;
  setFormData: React.Dispatch<React.SetStateAction<CreateEventData>>;
  localImagePreview: string | null;
  imageUploading: boolean;
  onImageSelected: (file: File | null) => void;
  onRemoveImage: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreateEditEventModal({
  isOpen,
  onOpenChange,
  isEditing,
  isSubmitting,
  formData,
  setFormData,
  localImagePreview,
  imageUploading,
  onImageSelected,
  onRemoveImage,
  onSubmit,
}: CreateEditEventModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
          <form id="event-form" onSubmit={onSubmit} className="space-y-4">
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

              <div className="flex flex-col gap-2">
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
                <div className="flex items-center gap-3">
                  <label className="text-white text-sm flex items-center gap-2" htmlFor="pair_required">
                    <input
                      id="pair_required"
                      type="checkbox"
                      checked={!!formData.pair_required}
                      onChange={(e) => setFormData((prev) => ({ ...prev, pair_required: e.target.checked }))}
                      className="h-4 w-4 rounded border-white/30 bg-white/10"
                    />
                    Requereix inscriure&apos;s amb parella
                  </label>
                </div>
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

              <ImageUploader
                localImagePreview={localImagePreview}
                imageUrl={formData.image_url}
                imageUploading={imageUploading}
                onImageSelected={onImageSelected}
                onRemoveImage={onRemoveImage}
              />
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
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
  );
}