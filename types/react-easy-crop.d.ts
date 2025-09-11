declare module "react-easy-crop" {
	import * as React from "react";
	export interface CropperProps {
		image?: string;
		crop?: { x: number; y: number };
		zoom?: number;
		aspect?: number;
		onCropChange?: (crop: { x: number; y: number }) => void;
		onZoomChange?: (zoom: number) => void;
		onCropComplete?: (croppedArea: any, croppedAreaPixels: any) => void;
		// allow any other props
		[key: string]: any;
	}
	const Cropper: React.ComponentType<CropperProps>;
	export default Cropper;
}
