"use client";
import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactInfoBlocksProps {
	className?: string;
	itemClassName?: string;
	animated?: boolean;
}

const cardStyle: React.CSSProperties = {
	background: "rgba(255, 255, 255, 0.1)",
	borderRadius: "16px",
	boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
	backdropFilter: "blur(5px)",
	WebkitBackdropFilter: "blur(5px)",
	border: "1px solid rgba(255, 255, 255, 0.2)",
	cursor: "pointer",
};

export const ContactInfoBlocks: React.FC<ContactInfoBlocksProps> = ({
	className,
	itemClassName,
	animated = true,
}) => {
	const baseItem = cn(
		"flex items-center gap-4 p-3 md:p-4 rounded-xl transition-all duration-300 hover:scale-[1.02]",
		itemClassName,
		animated && "animate-fade-in-up"
	);
	return (
		<div className={cn("space-y-3 md:space-y-4", className)}>
			<a
				href="mailto:info@padelsegria.cat"
				className={baseItem}
				style={cardStyle}>
				<div className="w-12 h-12 bg-padel-primary/20 rounded-xl flex items-center justify-center">
					<Mail className="w-6 h-6 text-padel-primary" />
				</div>
				<div>
					<p className="font-semibold text-white">Correu electrònic</p>
					<p className="text-gray-300">info@padelsegria.cat</p>
				</div>
			</a>

			<a href="tel:+34973123456" className={baseItem} style={cardStyle}>
				<div className="w-12 h-12 bg-padel-primary/20 rounded-xl flex items-center justify-center">
					<Phone className="w-6 h-6 text-padel-primary" />
				</div>
				<div>
					<p className="font-semibold text-white">Telèfon</p>
					<p className="text-gray-300">+34 973 123 456</p>
				</div>
			</a>

			<div className={baseItem} style={cardStyle}>
				<div className="w-12 h-12 bg-padel-primary/20 rounded-xl flex items-center justify-center">
					<MapPin className="w-6 h-6 text-padel-primary" />
				</div>
				<div>
					<p className="font-semibold text-white">Ubicació</p>
					<p className="text-gray-300">Lleida, Segrià, Catalunya</p>
				</div>
			</div>
		</div>
	);
};
