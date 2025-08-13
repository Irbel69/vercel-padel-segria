import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Hero Section - Padel Segria Landing Page
 *
 * Context: Este Hero Section es para la landing page de Padel Segria, una plataforma para gestionar torneos de pádel en la provincia de Segrià (España).
 * Objetivo: Transmitir energía, competitividad y motivar a los jugadores a unirse y competir.
 */
export default function HeroSection() {
	return (
		<section id="hero" className="relative min-h-screen w-full overflow-hidden">
			{/* Background Ball Logo - Positioned on the left side for visibility */}
			<div className="absolute top-1/2 left-8 lg:left-16 transform -translate-y-1/2 pointer-events-none z-0">
				<div className="relative">
					<Image
						src="/hero/background_ball_logo.png"
						alt="Padel Ball Background"
						width={1200}
						height={1200}
						className="object-contain w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] lg:w-[600px] lg:h-[600px] xl:w-[700px] xl:h-[700px] opacity-30 lg:opacity-40 blur-sm"
						priority
					/>
				</div>
			</div>

			{/* Tennis Player Image - Only visible on desktop */}
			<div className="hidden lg:block absolute bottom-0 right-[5%] xl:right-[10%] 2xl:right-[15%] pointer-events-none z-10">
				<div className="relative">
					<Image
						src="/hero/tennis_player.png"
						alt="Tennis Player"
						width={700}
						height={1000}
						className="object-contain h-[90vh] w-auto"
						style={{
							maskImage: "linear-gradient(to top, transparent 0%, black 15%, black 100%)",
							WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 15%, black 100%)"
						}}
						priority
					/>
				</div>
			</div>

			{/* Main Content Container */}
			<div className="relative z-20 container mx-auto px-4 lg:px-8 min-h-screen flex items-center">
				<div className="w-full">
					{/* Text Content */}
					<div className="flex flex-col space-y-8 text-center md:text-left">
						{/* Main Headlines */}
						<div className="space-y-3">
							<h1 className="mt-[8rem] md:mt-[10rem] text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight">
								<span className="block text-gray-300 font-condensed uppercase">
									Entrena dur
								</span>
								<span className="block text-padel-primary font-condensed leading-none mt-3 uppercase">
									Juga fàcil
								</span>
							</h1>
						</div>

						{/* Subheadline */}
						<p className="text-white/90 text-lg sm:text-xl md:text-2xl lg:text-3xl font-light max-w-2xl mx-auto md:mx-0 leading-relaxed px-4 md:px-0">
							The mark of great players is not how good they are at their best,
							but how good they are at their worst.
						</p>

						{/* Call-to-Action Button */}
						<div className="pt-8 flex justify-center md:justify-start">
							<Button
								size="lg"
								className="bg-padel-primary text-padel-secondary hover:bg-padel-primary/90 hover:text-white transition-all duration-300 px-10 py-7 text-xl font-semibold rounded-2xl transform hover:scale-105 shadow-lg hover:shadow-xl">
								Uneix-te!
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Bottom fade */}
			{/* Section bottom gradient removed (now scoped to image) */}
		</section>
	);
}
