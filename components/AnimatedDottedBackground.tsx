"use client";

import { useEffect, useRef } from "react";

const AnimatedDottedBackground = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Set canvas size
		const handleResize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		handleResize();
		window.addEventListener("resize", handleResize);

		// Dot properties
		const dotDensity = 0.0003; // Adjust for more/fewer dots
		const dotSize = 1.5;
		const dotColor = "#c3fb12";
		const dotOpacity = 0.3;
		const animationSpeed = 0.2;

		// Calculate number of dots based on screen size
		const totalDots = Math.floor(canvas.width * canvas.height * dotDensity);

		// Create dots
		const dots = Array.from({ length: totalDots }).map(() => ({
			x: Math.random() * canvas.width,
			y: Math.random() * canvas.height,
			vx: (Math.random() - 0.5) * animationSpeed,
			vy: (Math.random() - 0.5) * animationSpeed,
			opacity: Math.random() * dotOpacity,
		}));

		// Animation loop
		const animate = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Draw and update dots
			dots.forEach((dot) => {
				// Update position
				dot.x += dot.vx;
				dot.y += dot.vy;

				// Wrap around edges
				if (dot.x < 0) dot.x = canvas.width;
				if (dot.x > canvas.width) dot.x = 0;
				if (dot.y < 0) dot.y = canvas.height;
				if (dot.y > canvas.height) dot.y = 0;

				// Draw dot
				ctx.beginPath();
				ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(195, 251, 18, ${dot.opacity})`;
				ctx.fill();
			});

			requestAnimationFrame(animate);
		};

		const animationId = requestAnimationFrame(animate);

		// Cleanup
		return () => {
			window.removeEventListener("resize", handleResize);
			cancelAnimationFrame(animationId);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="absolute inset-0 z-0 h-screen pointer-events-none bg-black"
			style={{ opacity: 0.9 }}
		/>
	);
};

export default AnimatedDottedBackground;
