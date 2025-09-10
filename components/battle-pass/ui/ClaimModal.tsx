"use client";

import Image from "next/image";
import { BattlePassPrizeProgress } from "../hooks/use-battle-pass-progress";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Trophy, Loader2, Sparkles } from "lucide-react";

interface ClaimModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	prize: BattlePassPrizeProgress;
	isLoading?: boolean;
}

export function ClaimModal({ 
	isOpen, 
	onClose, 
	onConfirm, 
	prize, 
	isLoading = false 
}: ClaimModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md bg-gray-900/95 border-gray-700">
				<DialogHeader className="text-center">
					<DialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
						<Gift className="w-6 h-6 text-padel-primary" />
						Reclamar premi
					</DialogTitle>
					<DialogDescription className="text-gray-300">
						Estàs a punt de reclamar aquest fantàstic premi!
					</DialogDescription>
				</DialogHeader>

				{/* Prize Preview */}
				<div className="py-6">
					<div className="relative">
						{/* Background glow */}
						<div className="absolute inset-0 bg-gradient-to-r from-padel-primary/20 via-padel-primary/30 to-padel-primary/20 rounded-2xl blur-xl" />
						
						{/* Prize card */}
						<div className="relative bg-gradient-to-br from-gray-800/50 via-gray-700/60 to-gray-800/50 rounded-2xl border border-padel-primary/30 p-6">
							{/* Decorative particles */}
							<div className="absolute inset-0 overflow-hidden rounded-2xl">
								{[...Array(6)].map((_, i) => (
									<Sparkles 
										key={i}
										className={`absolute w-4 h-4 text-padel-primary/40 animate-pulse`}
										style={{
											top: `${20 + (i * 15)}%`,
											left: `${10 + (i * 12)}%`,
											animationDelay: `${i * 0.3}s`
										}}
									/>
								))}
							</div>

							<div className="relative text-center">
								{/* Prize image */}
								<div className="mb-4">
									{prize.image_url ? (
										<div className="relative w-24 h-24 mx-auto">
											<Image
												src={prize.image_url}
												alt={prize.title}
												fill
												className="object-contain rounded-lg"
											/>
										</div>
									) : (
										<div className="w-24 h-24 mx-auto bg-padel-primary/20 rounded-2xl flex items-center justify-center">
											<Trophy className="w-12 h-12 text-padel-primary" />
										</div>
									)}
								</div>

								{/* Prize details */}
								<h3 className="text-xl font-bold text-white mb-2">
									{prize.title}
								</h3>
								
								{prize.description && (
									<p className="text-sm text-gray-300 mb-4 line-clamp-3">
										{prize.description}
									</p>
								)}

								{/* Points required badge */}
								<Badge className="bg-padel-primary/20 text-padel-primary border-padel-primary/30">
									<Trophy className="w-3 h-3 mr-1" />
									Es requereixen {prize.points_required} punts
								</Badge>
							</div>
						</div>
					</div>
				</div>

				<DialogFooter className="sm:justify-center gap-3">
					<Button
						variant="outline"
						onClick={onClose}
						disabled={isLoading}
						className="border-gray-600 text-gray-300 hover:bg-gray-700"
					>
						Cancel·la
					</Button>
					<Button
						onClick={onConfirm}
						disabled={isLoading}
						className="bg-padel-primary text-black hover:bg-padel-primary/90 min-w-[120px]"
					>
						{isLoading ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Reclamant...
							</>
						) : (
							<>
								<Gift className="w-4 h-4 mr-2" />
								Reclamar premi
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}