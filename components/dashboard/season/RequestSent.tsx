import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { Season } from "@/components/seasons/types";

interface RequestSentProps {
	season: Season;
}

export function RequestSent({ season }: RequestSentProps) {
	return (
		<div className="p-6 space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Sol·licitud enviada</CardTitle>
					<CardDescription>
						Estem revisant la teva sol·licitud per {season.name}. Rebràs una
						assignació quan estigui disponible.
					</CardDescription>
				</CardHeader>
				<CardContent />
			</Card>
		</div>
	);
}
