"use client";

import { cn } from "@/lib/utils";

interface EnrollmentStepsProps {
	currentStep: 1 | 2;
}

export function EnrollmentSteps({ currentStep }: EnrollmentStepsProps) {
	return (
		<div className="flex items-center gap-2 text-xs">
			<div
				className={cn(
					"flex-1 h-1 rounded",
					currentStep >= 1 ? "bg-padel-primary" : "bg-white/10"
				)}
			/>
			<div
				className={cn(
					"flex-1 h-1 rounded",
					currentStep >= 2 ? "bg-padel-primary" : "bg-white/10"
				)}
			/>
		</div>
	);
}
