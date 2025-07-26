"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function EventsSectionErrorBoundary({
	children,
}: {
	children: React.ReactNode;
}) {
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		const handleError = (event: ErrorEvent) => {
			console.error(
				"Error caught by EventsSection error boundary:",
				event.error
			);
			setHasError(true);
		};

		window.addEventListener("error", handleError);

		return () => {
			window.removeEventListener("error", handleError);
		};
	}, []);

	if (hasError) {
		return (
			<section className="py-24 relative">
				<div className="container mx-auto px-4">
					<div className="text-center mb-8">
						<h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
							Propers Tornejos
						</h2>
						<p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
							Hi ha hagut un problema carregant aquesta secció. Si us plau,
							actualitza la pàgina per tornar-ho a provar.
						</p>
						<Button
							className="mt-6 bg-padel-primary text-padel-secondary hover:bg-padel-primary/90"
							onClick={() => window.location.reload()}>
							Actualitzar pàgina
						</Button>
					</div>
				</div>
			</section>
		);
	}

	return <>{children}</>;
}
