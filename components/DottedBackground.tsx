import React from "react";
import clsx from "clsx";

/**
 * Global dotted background layer.
 * Renders a lightweight pure-CSS radial dot grid (no canvas) so it is cheap and consistent.
 * Place once near the root layout (Option A) under all content.
 */
export interface DottedBackgroundProps {
	className?: string;
	/** Dot color including alpha. Default: rgba(255,255,255,0.08) */
	dotColor?: string;
	/** Dot radius in px (visual, we simulate by gradient stop). Default: 1 */
	dotSize?: number;
	/** Gap between dots (both axes). Default: 26 */
	gap?: number;
	/** Optional backdrop tint (e.g. a subtle vertical fade) */
	withVerticalFade?: boolean;
}

export function DottedBackground({
	className,
	dotColor = "rgba(255,255,255,0.08)",
	dotSize = 1,
	gap = 26,
	withVerticalFade = false,
}: DottedBackgroundProps) {
	const pattern = `radial-gradient(circle at center, ${dotColor} ${dotSize}px, transparent ${dotSize + 0.5}px)`;
	return (
		<div
			aria-hidden
			className={clsx(
				"pointer-events-none absolute inset-0 -z-10 select-none",
				withVerticalFade && "[mask-image:linear-gradient(to_bottom,black,black,transparent)]",
				className,
			)}
			style={{
				backgroundImage: pattern,
				backgroundSize: `${gap}px ${gap}px`,
			}}
		/>
	);
}

export default DottedBackground;
