"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { RotateCw, ZoomIn, ZoomOut } from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string; // can be original or current cropped preview
  onCropComplete: (croppedImageBlob: Blob, context: { originalBlob?: Blob; cropPixels: CroppedAreaPixels; rotation: number; zoom: number }) => void;
  aspectRatio?: number;
  title?: string;
  originalBlob?: Blob; // when provided we pass it back unchanged to allow re-cropping without fetching again
}

/**
 * createImage
 * Loads an image element with CORS enabled so we can export the canvas safely.
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

// Convert degrees to radians
const getRadianAngle = (degreeValue: number) => (degreeValue * Math.PI) / 180;

// Compute the bounding box size after rotation so we can safely draw the full image
const getRotatedSize = (width: number, height: number, rotation: number) => {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

/**
 * getCroppedImg
 * Creates a cropped image Blob that matches exactly the selection reported by react-easy-crop.
 *
 * IMPORTANT on coordinate system:
 * - react-easy-crop gives `croppedAreaPixels` in the ORIGINAL (natural) image pixel space.
 * - This already accounts for current zoom & pan; no extra math needed for zoom.
 * - If rotation is applied, the library still reports the crop box relative to the original image.
 *   Therefore we rotate the image around its center inside a temporary (larger) canvas, then extract
 *   the requested rectangle.
 */
const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: CroppedAreaPixels,
  rotation: number
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const rotRad = getRadianAngle(rotation);

  // 1. Draw the (possibly rotated) image into an offscreen canvas large enough to contain it.
  const { width: bWidth, height: bHeight } = getRotatedSize(
    image.width,
    image.height,
    rotation
  );
  const offCanvas = document.createElement("canvas");
  offCanvas.width = bWidth;
  offCanvas.height = bHeight;
  const offCtx = offCanvas.getContext("2d");
  if (!offCtx) throw new Error("No 2D context");

  // Move to center, rotate, then draw image centered.
  offCtx.translate(bWidth / 2, bHeight / 2);
  offCtx.rotate(rotRad);
  offCtx.drawImage(image, -image.width / 2, -image.height / 2);

  // 2. Extract the crop from the rotated image data.
  // Because pixelCrop is in the original image coordinate space, we need to align that with the rotated canvas.
  // Strategy: create a second canvas sized to original image, draw *unrotated* image there, rotate similarly,
  // OR simpler: compute how the top-left of the original image maps inside the rotated canvas.
  // The rotated image we drew has its original (0,0) located at:
  // (bWidth/2 - image.width/2, bHeight/2 - image.height/2) BEFORE rotation. After rotation, that corner moved.
  // Easiest robust approach: create an additional mask canvas and re-run transform while shifting so we can directly get the crop via drawImage clipping.

  const resultCanvas = document.createElement("canvas");
  resultCanvas.width = pixelCrop.width;
  resultCanvas.height = pixelCrop.height;
  const rCtx = resultCanvas.getContext("2d");
  if (!rCtx) throw new Error("No 2D context");

  // We replicate the original transform pipeline but shift so that the desired crop area ends up at (0,0).
  // Start by translating so the crop origin aligns with canvas (0,0)
  rCtx.translate(-pixelCrop.x, -pixelCrop.y);
  // Then translate to center of rotated bounding box
  rCtx.translate(bWidth / 2, bHeight / 2);
  rCtx.rotate(rotRad);
  rCtx.drawImage(image, -image.width / 2, -image.height / 2);

  return new Promise((resolve) => {
    resultCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
      },
      "image/jpeg",
      0.9
    );
  });
};

export function ImageCropper({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1, // Square by default
  title = "Retallar Imatge",
  originalBlob
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteHandler = useCallback(
    (croppedArea: Area, croppedAreaPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCrop = useCallback(async () => {
    if (!croppedAreaPixels) return;
    
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedImage, { originalBlob, cropPixels: croppedAreaPixels, rotation, zoom });
      onClose();
    } catch (e) {
      console.error('Error cropping image:', e);
    } finally {
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, imageSrc, onCropComplete, onClose, rotation, zoom, originalBlob]);

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Force the cropper modal to appear pinned to the top on small viewports
          and keep center behavior on larger screens. Use explicit env() safe-area
          padding so mobile Safari bottom UI doesn't cover action buttons. */}
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col bg-black border-white/20 z-[10000] top-[env(safe-area-inset-top)] sm:top-1/2 -translate-y-0 sm:-translate-y-1/2">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 relative bg-black rounded-lg overflow-hidden mb-4">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            showGrid={true}
            style={{
              containerStyle: {
                background: '#000',
                borderRadius: '8px',
              },
            }}
          />
        </div>

  <div className="space-y-4 pt-4 border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
          {/* Zoom Control */}
          <div className="flex items-center gap-4">
            <ZoomOut className="h-4 w-4 text-white/60" />
            <div className="flex-1">
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(value) => setZoom(value[0])}
                className="flex-1"
              />
            </div>
            <ZoomIn className="h-4 w-4 text-white/60" />
            <span className="text-white/60 text-sm min-w-[3rem]">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Rotation Control */}
          <div className="flex items-center gap-4">
            <RotateCw className="h-4 w-4 text-white/60" />
            <div className="flex-1">
              <Slider
                value={[rotation]}
                min={0}
                max={360}
                step={1}
                onValueChange={(value) => setRotation(value[0])}
                className="flex-1"
              />
            </div>
            <span className="text-white/60 text-sm min-w-[3rem]">
              {rotation}°
            </span>
          </div>
        </div>

  <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 pb-[env(safe-area-inset-bottom)]">
          <Button
            variant="outline"
            onClick={resetCrop}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Reiniciar
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Cancel·lar
          </Button>
          <Button
            onClick={handleCrop}
            disabled={!croppedAreaPixels || isProcessing}
            className="bg-padel-primary text-black hover:bg-padel-primary/90"
          >
            {isProcessing ? "Processant..." : "Aplicar Retall"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}