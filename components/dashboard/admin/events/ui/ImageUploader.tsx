import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ImageUploaderProps {
  localImagePreview: string | null;
  imageUrl?: string | null;
  imageUploading: boolean;
  onImageSelected: (file: File | null) => void;
  onRemoveImage: () => void;
}

export function ImageUploader({
  localImagePreview,
  imageUrl,
  imageUploading,
  onImageSelected,
  onRemoveImage,
}: ImageUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onImageSelected(file);
  };

  return (
    <div className="md:col-span-2">
      <Label className="text-white">Imatge de portada</Label>
      <div className="mt-2 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          disabled={imageUploading}
          className="text-sm file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-white/10 file:text-white file:hover:bg-white/20 file:cursor-pointer"
        />
        {(localImagePreview || imageUrl) && (
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-28 rounded overflow-hidden border border-white/10">
              <Image
                src={(localImagePreview || imageUrl) as string}
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
        {imageUploading && <p className="text-xs text-white/60">Pujant...</p>}
        <p className="text-xs text-white/50">
          Formats: JPG, PNG, WEBP. Màx 5MB.
        </p>
      </div>
    </div>
  );
}