import {
	Crown,
	Eye,
	Flame,
	Zap,
	Heart,
	Activity,
	Wind,
	Target,
	ArrowUpRight,
	Shield,
	Swords,
	BrainCircuit,
	Award,
	Trophy,
	Star,
	Medal,
	Users,
	Gamepad2,
	Sparkles,
	type LucideIcon,
} from "lucide-react";

interface Quality {
	id: number;
	name: string;
	icon?: string;
}

// Map of icon names to their components
const iconComponentMap: Record<string, LucideIcon> = {
	Crown,
	Eye,
	Flame,
	Zap,
	Heart,
	Activity,
	Wind,
	Target,
	ArrowUpRight,
	Shield,
	Swords,
	BrainCircuit,
	Award,
	Trophy,
	Star,
	Medal,
	Users,
	Gamepad2,
	Sparkles,
	Battery: Heart, // Fallback for Battery -> Heart
};

// Legacy mapping for backward compatibility (using quality names)
const qualityNameIconMap: Record<string, string> = {
	Lideratge: "Crown",
	Anticipació: "Eye",
	Potència: "Flame",
	Velocitat: "Zap",
	Resistència: "Heart",
	Reflexos: "Activity",
	Flexibilitat: "Wind",
	Equilibri: "Target",
	Mobilitat: "ArrowUpRight",
	Defensa: "Shield",
	Atac: "Swords",
	Control: "BrainCircuit",
	"Col·locació": "Target",
	Volea: "Award",
	Globo: "Trophy",
	Rematada: "Flame",
	Vibora: "Zap",
	Servei: "Star",
	Sortida: "ArrowUpRight",
	Contraatac: "Activity",
	"Baixada de pared": "Shield",
	Bandeja: "Medal",
	Comunicació: "Users",
	Adaptació: "Wind",
	X3: "Gamepad2",
};

/**
 * Get the icon component for a quality
 * Supports both legacy (string name) and new (Quality object) approaches
 */
export function getQualityIcon(input: string | Quality): LucideIcon {
	let iconName: string;

	if (typeof input === "string") {
		// Legacy support - use name to look up icon
		iconName = qualityNameIconMap[input] || "Sparkles";
	} else {
		// New approach - use icon field from database
		iconName = input.icon || "Sparkles";
	}

	// Map icon name to actual icon component
	return iconComponentMap[iconName] || Sparkles;
}

/**
 * Get available icon names for the admin panel
 */
export function getAvailableIcons(): Record<string, LucideIcon> {
	return iconComponentMap;
}
