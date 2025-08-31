import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { usePlayerSearch } from './hooks/use-player-search';
import type { PlayerSelectorProps } from './types';
import { Checkbox } from '@/components/ui/checkbox';

export function PlayerSelector({
	open,
	onOpenChange,
	onPlayerSelect,
	selectedPlayers,
	eventId,
}: PlayerSelectorProps) {

	const [onlyInscritos, setOnlyInscritos] = useState(false);

	const {
		players: fetchedPlayers,
		searchTerm,
		isLoading,
		error,
		setSearchTerm,
		getFilteredPlayers,
	} = usePlayerSearch({ eventId, onlyInscritos });

	const selectedPlayerIds = selectedPlayers
		.filter((p) => p !== null)
		.map((p) => p!.id);

	const filteredPlayers = getFilteredPlayers(selectedPlayerIds);

	// Mostrar mensaje de error si hay alguno
	if (error) {
		console.error('Error loading players:', error);
	}

	return (
		<Command>
			<CommandInput
				placeholder="Buscar jugador..."
				value={searchTerm}
				onValueChange={setSearchTerm}
			/>
			<CommandList>
				<CommandEmpty>
					{isLoading ? "Carregant..." : error ? "Error carregant jugadors" : "No s'han trobat jugadors"}
				</CommandEmpty>
				<CommandGroup>
					{filteredPlayers.map((player) => (
						<CommandItem
							key={player.id}
							onSelect={() => {
								onPlayerSelect(player);
								onOpenChange(false);
							}}
							className="flex items-center gap-2">
							<Avatar className="w-8 h-8">
								<AvatarImage src={player.avatar_url || ""} />
								<AvatarFallback>
									{((player.name || "")[0] || "") +
										((player.surname || "")[0] || "")}
								</AvatarFallback>
							</Avatar>
							<div>
								<div className="font-medium">
									{player.name} {player.surname}
								</div>
								{player.score !== undefined && (
									<div className="text-sm text-muted-foreground">
										Puntuació: {player.score}
									</div>
								)}
							</div>
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</Command>
	);
}