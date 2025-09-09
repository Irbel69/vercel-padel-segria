"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  X, 
  Package,
  Monitor,
  MapPin,
  Coins,
  Sparkles,
  Crop
} from "lucide-react";
import { usePrizeForm, PrizeFormData } from "../hooks/use-prize-form";
import { uploadPrizeImage, deletePrizeImage, uploadPrizeImageWithOriginal } from "@/libs/supabase/storage";
import { useToast } from "@/hooks/use-toast";
import { createClient as createSbBrowser } from "@/libs/supabase/client";
import { BattlePassPrize } from "../hooks/use-battle-pass-prizes";
import { ImageCropper } from "@/components/ui/image-cropper";

interface PrizeFormProps {
  initialData?: Partial<BattlePassPrize>;
  onSubmit: (data: PrizeFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const prizeTypeOptions = [
  { value: "physical", label: "Físic", icon: Package, description: "Objectes físics que es poden enviar" },
  { value: "digital", label: "Digital", icon: Monitor, description: "Contingut digital, códis, etc." },
  { value: "experience", label: "Experiència", icon: MapPin, description: "Activitats, esdeveniments, cursos" },
  { value: "currency", label: "Moneda", icon: Coins, description: "Punts, crèdits, monedes virtuals" },
] as const;

export function PrizeForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  submitLabel = "Guardar"
  , onImageFileSelected
}: PrizeFormProps & { onImageFileSelected?: (file: File | null) => void }) {
  const {
    formData,
    errors,
    isDirty,
    updateField,
    validateForm,
    resetForm,
    getTierLabel,
    getTierColor
  } = usePrizeForm(initialData);
  
  
  

  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null); // keep original for future re-crops
  // New state to defer uploads until the user clicks save
  const [pendingCroppedFile, setPendingCroppedFile] = useState<File | null>(null);
  const [pendingOriginalFile, setPendingOriginalFile] = useState<File | null>(null);
  const [imageMarkedForRemoval, setImageMarkedForRemoval] = useState(false);
  const { toast } = useToast();

  // Flag indicating there are pending image-only changes that should allow saving
  const hasPendingImageChanges = Boolean(pendingCroppedFile || pendingOriginalFile || imageMarkedForRemoval);

  // Prevent automatic focus when the form is mounted inside dialogs. Some
  // dialog implementations (Radix) may move focus into the dialog which ends
  // up focusing the first input and opening mobile keyboards. We explicitly
  // blur the active element briefly after mount so nothing is focused by
  // default. This runs only on the client.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    // small timeout to run after any focus management done by the dialog
    const t = setTimeout(() => {
      try {
        const active = document.activeElement as HTMLElement | null;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
          active.blur();
        }
      } catch (e) {
        // ignore
      }
    }, 50);
    return () => clearTimeout(t);
  }, []);

  // Keep local image preview in sync with incoming initialData when
  // the form is used for editing an existing prize. Do this in an effect
  // so hook order stays stable across renders.
  useEffect(() => {
    // Ensure form fields are reset to the incoming initialData when
    // the form is used for editing. Also sync the local image preview.
    // Calling resetForm here is safe and keeps form state in the hook
    // and the local preview in sync.
  console.log("[PrizeForm] effect initialData ->", initialData?.id, initialData?.name);
  resetForm?.(initialData);
  setImagePreview(initialData?.image_url || null);
    // Note: we intentionally don't revoke previous previews here because
    // handleRemoveImage already revokes blob URLs when the user removes
    // the image. If you programmatically replace blob URLs often, add
    // a ref to track and revoke the previous blob URL.
  }, [initialData, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // If there are pending image operations for an existing prize, perform them now
    const prizeId = (initialData as any)?.id as number | undefined;

    setImageUploading(true);
    try {
      // 1) If user marked existing image for removal, delete from storage and clear image_url
      if (prizeId && imageMarkedForRemoval && initialData?.image_url) {
        try {
          await deletePrizeImage(initialData.image_url as string);
        } catch (err) {
          console.warn('[PrizeForm] deletePrizeImage failed during submit', err);
        }
        // ensure DB will be updated to remove image_url
        try {
          const sb = createSbBrowser();
          const { data: sessionData } = await sb.auth.getSession();
          const accessToken = sessionData.session?.access_token;
          let resp = await fetch(`/api/admin/battle-pass/prizes/${prizeId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            credentials: 'include',
            body: JSON.stringify({ image_url: null }),
          });

          if (resp.status === 401) {
            await sb.auth.getSession();
            const { data: s2 } = await sb.auth.getSession();
            const at2 = s2.session?.access_token;
            resp = await fetch(`/api/admin/battle-pass/prizes/${prizeId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                ...(at2 ? { Authorization: `Bearer ${at2}` } : {}),
              },
              credentials: 'include',
              body: JSON.stringify({ image_url: null }),
            });
          }
          if (!resp.ok) {
            console.warn('[PrizeForm] Failed to persist image removal', resp.status);
          }
        } catch (err) {
          console.warn('[PrizeForm] Failed to persist image removal (API)', err);
        }
        // update local form data
        updateField('image_url', undefined);
      }

      // 2) If there's a pending cropped file for an existing prize, upload it now and persist
      if (prizeId && pendingCroppedFile) {
        try {
          let publicUrl: string | undefined;
          let originalUrl: string | undefined;
          if (pendingOriginalFile) {
            const result = await uploadPrizeImageWithOriginal({ originalFile: pendingOriginalFile, croppedFile: pendingCroppedFile, prizeId });
            publicUrl = result.publicUrl;
            originalUrl = result.originalUrl;
          } else {
            const single = await uploadPrizeImage(pendingCroppedFile, prizeId);
            publicUrl = single.publicUrl;
          }

          if (publicUrl) {
            updateField('image_url', publicUrl);
            // persist the image_url to DB (and original if available)
            try {
              const sb = createSbBrowser();
              const { data: sessionData } = await sb.auth.getSession();
              const accessToken = sessionData.session?.access_token;
              let resp = await fetch(`/api/admin/battle-pass/prizes/${prizeId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                credentials: 'include',
                body: JSON.stringify({ image_url: publicUrl, ...(originalUrl ? { original_image_url: originalUrl } : {}) }),
              });

              if (resp.status === 401) {
                await sb.auth.getSession();
                const { data: s2 } = await sb.auth.getSession();
                const at2 = s2.session?.access_token;
                resp = await fetch(`/api/admin/battle-pass/prizes/${prizeId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(at2 ? { Authorization: `Bearer ${at2}` } : {}),
                  },
                  credentials: 'include',
                  body: JSON.stringify({ image_url: publicUrl, ...(originalUrl ? { original_image_url: originalUrl } : {}) }),
                });
              }
              if (!resp.ok) console.warn('[PrizeForm] PUT image_url failed', resp.status);
            } catch (e) {
              console.warn('[PrizeForm] Failed to persist image_url immediately:', e);
            }
          }
        } catch (e) {
          console.error('[PrizeForm] Error uploading pending image during submit', e);
          toast({ variant: 'destructive', title: 'Error pujant imatge', description: (e as Error)?.message || "No s'ha pogut pujar la imatge." });
        }
      }

      // 3) For create flows: notify parent of pending file so it can upload after creating the prize
      if (!prizeId) {
        if (pendingCroppedFile && onImageFileSelected) onImageFileSelected(pendingCroppedFile);
        if (imageMarkedForRemoval && onImageFileSelected) onImageFileSelected(null);
      }

      // Finally call parent's onSubmit with the (possibly updated) formData
      onSubmit(formData);
    } finally {
      setImageUploading(false);
      // cleanup pending states after submit
      setPendingCroppedFile(null);
      setPendingOriginalFile(null);
      setImageMarkedForRemoval(false);
      // keep originalImageFile around to allow re-crops if desired
    }
  };

  // When the mobile action bar is rendered via portal it's outside the <form> so
  // its "submit" button cannot use type="submit" to submit the form. Provide
  // an explicit handler that validates and calls onSubmit with the current form data.
  const handleMobileSubmit = async () => {
    // reuse logic from handleSubmit but without an event
    if (!validateForm()) return;
    // We call the same submit flow: create a fake event-less submission
    // to perform pending image ops before delegating to onSubmit.
    // Simpler: call handleSubmit with a fake event object that has preventDefault
    await handleSubmit({ preventDefault() {} } as unknown as React.FormEvent);
  };

  const handleImageFileSelect = (file: File) => {
    if (!file || imageUploading) return;
    
    // Create preview URL for cropper
    const previewUrl = URL.createObjectURL(file);
    setSelectedImageForCrop(previewUrl);
    setPendingFile(file);
    setOriginalImageFile(file); // store original reference
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedImageBlob: Blob, meta: { originalBlob?: Blob }) => {
    if (!croppedImageBlob) return;
    if (imageUploading) return;

    setShowCropper(false);

    try {
      // Convert blob to file and keep it pending until the user saves
      const croppedFile = new File([croppedImageBlob], pendingFile?.name || 'cropped-image.jpg', {
        type: 'image/jpeg',
      });
      const originalFile = (meta.originalBlob as File) || originalImageFile || pendingFile || undefined;

      const previewUrl = URL.createObjectURL(croppedFile);
      setImagePreview(previewUrl);

      // If editing (existing prize) we DO NOT upload now; just keep files pending and update local preview.
      const prizeId = (initialData as any)?.id as number | undefined;
      if (prizeId) {
        setPendingCroppedFile(croppedFile);
        if (originalFile) setPendingOriginalFile(originalFile as File);
        setImageMarkedForRemoval(false); // replacing an existing image
        toast({ title: 'Imatge preparada', description: "La imatge es pujarà quan es guardin els canvis." });
      } else {
        // Create flow: parent expects the selected file so it can upload after create
        setPendingCroppedFile(croppedFile);
        if (originalFile) setPendingOriginalFile(originalFile as File);
        if (onImageFileSelected) onImageFileSelected(croppedFile);
        toast({ title: 'Imatge retallada', description: "Es pujarà en crear el premi." });
      }
    } catch (error) {
      console.error('Error processing cropped image:', error);
      toast({ variant: 'destructive', title: 'Error processant imatge', description: "No s'ha pogut processar la imatge retallada." });
    } finally {
      // Clean up temporary crop preview URL
      if (selectedImageForCrop) {
        URL.revokeObjectURL(selectedImageForCrop);
        setSelectedImageForCrop(null);
      }
      setPendingFile(null);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    if (selectedImageForCrop) {
      URL.revokeObjectURL(selectedImageForCrop);
      setSelectedImageForCrop(null);
    }
    setPendingFile(null);
  };

  const handleRemoveImage = () => {
    // If the preview is a temporary blob URL (user hasn't uploaded yet), revoke it and clear pending files.
    const isBlob = !!(imagePreview && imagePreview.startsWith('blob:'));
    const currentUrl = imagePreview;

    if (isBlob && currentUrl) URL.revokeObjectURL(currentUrl);
    setImagePreview(null);

    // Clear pending cropped/original files (they won't be uploaded)
    setPendingCroppedFile(null);
    setPendingOriginalFile(null);
    setPendingFile(null);
    if (onImageFileSelected) onImageFileSelected(null);

    // If the prize exists and the current preview was a persisted URL, mark it for removal and defer actual deletion until save
    const prizeId = (initialData as any)?.id as number | undefined;
    if (prizeId && initialData?.image_url && !isBlob) {
      setImageMarkedForRemoval(true);
      // do not call deletePrizeImage or API here; it will run on submit
      toast({ title: "Imatge marcada per eliminar", description: "La imatge es eliminarà quan es guardin els canvis." });
      // keep form field unset locally until submit
      updateField('image_url', undefined);
    }
  };

  return (
  // Add extra bottom padding on small screens to avoid content being
  // hidden behind the fixed mobile action bar. We add the safe-area
  // inset and the expected action bar height (approx 10rem).
  <form onSubmit={handleSubmit} className="space-y-6 pb-[calc(env(safe-area-inset-bottom)+10rem)] md:pb-0 rounded-lg">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-padel-primary" />
          Informació bàsica
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prize Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Nom del premi *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Ex: Raqueta de Pàdel Professional"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
            {errors.name && (
              <p className="text-red-400 text-sm">{errors.name}</p>
            )}
          </div>

          {/* Prize Type */}
          <div className="space-y-2">
            <Label className="text-white">Tipus de premi *</Label>
            <Select 
              value={formData.prize_type} 
              onValueChange={(value) => updateField("prize_type", value as PrizeFormData["prize_type"])}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Selecciona el tipus" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20">
                {prizeTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="text-white focus:bg-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-padel-primary" />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-white/60">{option.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-white">
            Descripció
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Descripció detallada del premi..."
            rows={3}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none"
          />
        </div>

        {/* Prize Value */}
        <div className="space-y-2">
          <Label htmlFor="prize_value" className="text-white">
            Valor del premi
          </Label>
          <Input
            id="prize_value"
            value={formData.prize_value}
            onChange={(e) => updateField("prize_value", e.target.value)}
            placeholder="Ex: 150€, 500 punts, Experiència única..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>
      </div>

      {/* Points */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Punts requerits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="required_points" className="text-white">
              Punts requerits *
            </Label>
            <Input
              id="required_points"
              type="number"
              min="1"
              value={formData.required_points}
              onChange={(e) => updateField("required_points", parseInt(e.target.value) || 1)}
              className="bg-white/10 border-white/20 text-white"
            />
            {errors.required_points && (
              <p className="text-red-400 text-sm">{errors.required_points}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stock and Display */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Inventari i visualització</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stock Quantity */}
          <div className="space-y-2">
            <Label htmlFor="stock_quantity" className="text-white">
              Quantitat en estoc
            </Label>
            <Input
              id="stock_quantity"
              type="number"
              min="0"
              value={formData.stock_quantity || ""}
              onChange={(e) => updateField("stock_quantity", e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Deixar buit per estoc il·limitat"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
            {errors.stock_quantity && (
              <p className="text-red-400 text-sm">{errors.stock_quantity}</p>
            )}
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <Label htmlFor="display_order" className="text-white">
              Ordre de visualització
            </Label>
            <Input
              id="display_order"
              type="number"
              min="0"
              value={formData.display_order}
              onChange={(e) => updateField("display_order", parseInt(e.target.value) || 0)}
              className="bg-white/10 border-white/20 text-white"
            />
            {errors.display_order && (
              <p className="text-red-400 text-sm">{errors.display_order}</p>
            )}
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="space-y-1">
            <Label className="text-white">Premi actiu</Label>
            <p className="text-sm text-white/60">
              Els premis inactius no es mostren als usuaris
            </p>
          </div>
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => updateField("is_active", checked)}
          />
        </div>
      </div>

      {/* Image Upload */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Imatge del premi</h3>
        
        <div className="space-y-4">
          {imagePreview ? (
            <div className="relative">
              <div className="relative h-48 w-full rounded-lg overflow-hidden bg-white/5 border border-white/10">
                <Image
                  src={imagePreview}
                  alt="Vista prèvia del premi"
                  fill
                  className="object-cover"
                />
                {imageUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div role="status" aria-live="polite" className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full border-4 border-t-transparent border-white animate-spin" />
                      <span className="text-white/90 text-sm">Pujant...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Use originalImageFile if we have it for higher quality re-crop
                    if (originalImageFile) {
                      const blobUrl = URL.createObjectURL(originalImageFile);
                      setSelectedImageForCrop(blobUrl);
                    } else if (imagePreview) {
                      setSelectedImageForCrop(imagePreview);
                    }
                    setShowCropper(true);
                  }}
                  className="bg-black/60 text-white hover:bg-padel-primary/60 backdrop-blur-sm"
                  title="Retallar imatge"
                >
                  <Crop className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="bg-black/60 text-white hover:bg-red-500/60 backdrop-blur-sm"
                  title="Eliminar imatge"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFileSelect(file);
                }}
                disabled={imageUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="image-upload"
              />
              <Label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center h-48 w-full rounded-lg bg-white/5 border-2 border-dashed border-white/20 hover:border-padel-primary/50 hover:bg-white/10 transition-all cursor-pointer"
              >
                <Upload className="h-8 w-8 text-white/40 mb-2" />
                <p className="text-white/60 text-center">
                  {imageUploading ? "Pujant imatge..." : "Clica per pujar una imatge"}
                </p>
                <p className="text-white/40 text-sm mt-1">
                  PNG, JPG o WebP (màx. 5MB)
                </p>
              </Label>
              {imageUploading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div role="status" aria-live="polite" className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full border-4 border-t-transparent border-white animate-spin" />
                    <span className="text-white/90 text-sm">Pujant...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      {/* Desktop: keep actions in-flow so they appear at the bottom of the form */}
      <div className="hidden md:flex justify-end gap-3 pt-6 border-t border-white/10">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          Cancel·lar
        </Button>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            disabled={isSubmitting || !(isDirty || hasPendingImageChanges)}
            className="bg-padel-primary text-black hover:bg-padel-primary/90 font-medium"
          >
            {isSubmitting ? "Guardant..." : submitLabel}
          </Button>
        </motion.div>
      </div>

      {/* Mobile: render fixed actions into a portal so they're positioned relative to the viewport
          (DialogContent applies transforms which would otherwise create a containing block). */}
      {typeof document !== "undefined" && !showCropper && createPortal(
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] pointer-events-auto bg-black/60 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-3 pb-[calc(env(safe-area-inset-bottom))]">
            <div className="flex mb-2 items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancel·lar
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                <Button
                  type="button"
                  onClick={handleMobileSubmit}
                  disabled={isSubmitting || !(isDirty || hasPendingImageChanges)}
                  className="w-full bg-padel-primary text-black hover:bg-padel-primary/90 font-medium"
                >
                  {isSubmitting ? "Guardant..." : submitLabel}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Image Cropper Modal */}
      {selectedImageForCrop && (
        <ImageCropper
          isOpen={showCropper}
          onClose={handleCropCancel}
          imageSrc={selectedImageForCrop}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
          title="Retallar Imatge del Premi"
          originalBlob={originalImageFile || undefined}
        />
      )}
    </form>
  );
}