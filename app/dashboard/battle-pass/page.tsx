"use client";

import { Suspense, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Gamepad2, Sparkles } from "lucide-react";
import { 
	BattlePassTrack, 
	UserPointsDisplay, 
	useBattlePassProgress 
} from "@/components/battle-pass";




function BattlePassContent() {
	const { data, isLoading, error, refetch } = useBattlePassProgress();

	if (error) {
		return (
			<div className="space-y-6 h-screen">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-white mt-5 mb-2 flex items-center justify-center gap-3 transform transition-transform duration-300 hover:scale-105">
						<Gamepad2 className="w-8 h-8 text-padel-primary" />
						Battle Pass
					</h1>
					<p className="text-gray-400">La teva trajectòria dins de les recompenses de la temporada de pàdel</p>
				</div>

				<Alert className="border-red-500/50 bg-red-900/20">
					<AlertTriangle className="h-4 w-4 text-red-400" />
					<AlertDescription className="text-red-300">
						No s&apos;ha pogut carregar les dades del Battle Pass: {error.message}
						<button 
							onClick={() => refetch()}
							className="ml-2 underline hover:no-underline"
						>
							Torna-ho a intentar
						</button>
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	// Prefer server-provided count of completed claims; fallback to derive
	const completedPrizes = (data?.completed_prizes ?? data?.prizes.filter(p => p.is_claimed).length) || 0;

	return (
		<div className="space-y-6 max-w-[90vw] mx-auto">
			{/* Header */}
			<div className="text-center">
				<h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3 transform transition-transform duration-300 hover:scale-105">
					<div className="relative">
						<Gamepad2 className="w-8 h-8 text-padel-primary" />
						<Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-pulse" />
					</div>
					Battle Pass
				</h1>
				<p className="text-gray-400">
					Guanya punts participant en partits i tornejos per desbloquejar recompenses increïbles
				</p>
			</div>

			{/* User progress display */}
			<div className="max-w-full mx-auto w-[screen]">
				<UserPointsDisplay
					userPoints={data?.user_points || 0}
					totalPrizes={data?.total_prizes || 0}
					completedPrizes={completedPrizes}
					animate={data != null}
				/>
			</div>

			{/* Battle Pass Track */}
			<div className="relative transform transition-transform duration-300">
				{/* Background gradient */}
				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-padel-primary/5 to-transparent pointer-events-none" />
				
				<BattlePassTrack
					prizes={data?.prizes || []}
					userPoints={data?.user_points || 0}
					isLoading={isLoading}
				/>
			</div>

			{/* Instructions for new users */}
			{data && data.user_points === 0 && (
				<div className="max-w-md mx-auto text-center">
					<div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
						<h3 className="text-white font-semibold mb-2 flex items-center justify-center gap-2">
							<Sparkles className="w-5 h-5 text-padel-primary" />
							Comença
						</h3>
						<p className="text-gray-300 text-sm">
							Participa en tornejos i partits per guanyar punts i desbloquejar aquestes recompenses!
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

export default function BattlePassPage() {
	const particles = useMemo(() => {
		const count = 20;
		return new Array(count).fill(null).map(() => ({
			top: `${Math.random() * 100}%`,
			left: `${Math.random() * 100}%`,
			delay: `${Math.random() * 3}s`,
			duration: `${2 + Math.random() * 2}s`,
		}));
	}, []);

	return (
		<div className="min-h-[calc(100vh-8rem)] relative">
			{/* Background effects */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden">
				{/* Animated background particles */}
				<div className="absolute inset-0">
					{particles.map((p, i) => (
						<div
							key={i}
							className="absolute w-2 h-2 bg-padel-primary/10 rounded-full animate-pulse"
							style={{
								top: p.top,
								left: p.left,
								animationDelay: p.delay,
								animationDuration: p.duration,
							}}
						/>
					))}
				</div>
				
				{/* Gradient overlays */}
				<div className="absolute top-0 left-1/4 w-96 h-96 bg-padel-primary/5 rounded-full blur-3xl" />
				<div className="absolute bottom-0 right-1/4 w-80 h-80 bg-yellow-400/3 rounded-full blur-3xl" />
			</div>

			{/* Content */}
			<div className="relative z-10">
				<Suspense fallback={
					<div className="space-y-6">
						<div className="text-center">
							<h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
								<Gamepad2 className="w-8 h-8 text-padel-primary animate-pulse" />
								Battle Pass
							</h1>
							<p className="text-gray-400">Loading your rewards...</p>
						</div>
						<div className="flex justify-center">
							<div className="animate-spin w-8 h-8 border-2 border-padel-primary border-t-transparent rounded-full" />
						</div>
					</div>
				}>
					<BattlePassContent />
				</Suspense>
			</div>
		</div>
	);
}