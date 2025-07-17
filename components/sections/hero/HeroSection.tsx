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
		<section className="relative min-h-screen w-full bg-dotted-pattern overflow-hidden">
			{/* Background Ball Logo - Behind text on mobile and tablets, to the right on larger screens */}
			<div className="absolute top-[10%] lg:top-0 right-0 lg:right-[0%] pointer-events-none z-0 lg:z-5 w-full lg:w-auto flex justify-center lg:block">
				<Image
					src="/hero/background_ball_logo.png"
					alt="Padel Ball Background"
					width={1200}
					height={1200}
					className="object-contain w-[650px] sm:w-[700px] md:w-[950px] lg:w-[900px] xl:w-[1100px] 2xl:w-[1200px] opacity-60 lg:opacity-70 blur-sm lg:blur-md"
					priority
				/>
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
						priority
					/>
					{/* Blur gradient at bottom of player image */}
					<div className="absolute bottom-0 left-0 right-0 h-[100px] bg-gradient-to-t from-black to-transparent"></div>
				</div>
			</div>

			{/* Main Content Container */}
			<div className="relative z-20 container mx-auto px-4 lg:px-8 min-h-screen flex items-center">
				<div className="w-full">
					{/* Text Content */}
					<div className="flex flex-col space-y-8 text-left">
						{/* Main Headlines */}
						<div className="space-y-3">
							<h1 className="mt-[10rem] text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight">
								<span className="block text-gray-300 font-condensed uppercase">
									Entrena dur
								</span>
								<span className="block text-padel-primary font-condensed leading-none mt-3 uppercase">
									Juga fàcil
								</span>
							</h1>
						</div>

						{/* Subheadline */}
						<p className="text-white/90 text-xl md:text-2xl lg:text-3xl font-light max-w-2xl leading-relaxed">
							The mark of great players is not how good they are at their best,
							but how good they are at their worst.
						</p>

						{/* Call-to-Action Button */}
						<div className="pt-8">
							<Button
								size="lg"
								className="bg-padel-primary text-padel-secondary hover:bg-padel-primary/90 hover:text-white transition-all duration-300 px-10 py-7 text-xl font-semibold rounded-2xl transform hover:scale-105 shadow-lg hover:shadow-xl">
								Join Us Now!
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Gradient Overlay for depth */}
			<div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black/50 pointer-events-none"></div>

			{/* Bottom fade */}
			<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
		</section>
	);
}
