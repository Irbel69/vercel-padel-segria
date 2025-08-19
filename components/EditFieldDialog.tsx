"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface EditFieldDialogProps {
	isOpen: boolean;
	onClose: () => void;
	fieldName: string;
	fieldLabel: string;
	currentValue: string;
	fieldType: "email" | "phone" | "text";
	onSave: (newValue: string) => Promise<void>;
}

export default function EditFieldDialog({
	isOpen,
	onClose,
	fieldName,
	fieldLabel,
	currentValue,
	fieldType,
	onSave,
}: EditFieldDialogProps) {
	const [value, setValue] = useState(currentValue);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const { toast } = useToast();

	// Reset state when dialog opens
	const handleOpenChange = (open: boolean) => {
		if (open) {
			setValue(currentValue);
			setError("");
		} else {
			onClose();
		}
	};

	// Validation function
	const validateField = (val: string): string => {
		if (!val.trim()) {
			return "Aquest camp és obligatori";
		}

		if (fieldType === "email") {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(val)) {
				return "Format d'email invàlid";
			}
		}

		if (fieldType === "phone") {
			// Spanish phone number validation (basic)
			const phoneRegex = /^(\+34|0034|34)?[6789]\d{8}$/;
			const cleanPhone = val.replace(/[\s-]/g, "");
			if (!phoneRegex.test(cleanPhone)) {
				return "Format de telèfon invàlid (ex: 612345678 o +34612345678)";
			}
		}

		return "";
	};

	const handleSave = async () => {
		const validationError = validateField(value);
		if (validationError) {
			setError(validationError);
			return;
		}

		setLoading(true);
		setError("");

		try {
			await onSave(value);
			toast({
				title: "Guardat correctament",
				description: `${fieldLabel} s'ha actualitzat correctament`,
				duration: 3000,
			});
			onClose();
		} catch (error) {
			console.error("Error saving field:", error);
			setError("Error al guardar. Torna-ho a intentar.");
			toast({
				title: "Error",
				description: "No s'ha pogut guardar el canvi",
				variant: "destructive",
				duration: 3000,
			});
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		setValue(currentValue);
		setError("");
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent 
				className="sm:max-w-md border-0"
				style={{
					background: "rgba(0, 0, 0, 0.95)",
					backdropFilter: "blur(20px)",
					border: "1px solid rgba(255, 255, 255, 0.2)",
				}}
			>
				<DialogHeader>
					<DialogTitle className="text-white text-xl">
						Editar {fieldLabel}
					</DialogTitle>
					<DialogDescription className="text-white/70">
						Modifica el valor del camp i desa els canvis.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor={fieldName} className="text-white/90 font-medium">
							{fieldLabel}
						</Label>
						<Input
							id={fieldName}
							type={fieldType === "email" ? "email" : fieldType === "phone" ? "tel" : "text"}
							value={value}
							onChange={(e) => {
								setValue(e.target.value);
								if (error) setError("");
							}}
							className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-yellow-500 focus:ring-yellow-500/20"
							placeholder={`Introdueix el ${fieldLabel.toLowerCase()}`}
							disabled={loading}
						/>
						{error && (
							<p className="text-red-400 text-sm">{error}</p>
						)}
					</div>
				</div>

				<DialogFooter className="gap-2">
					<Button
						variant="outline"
						onClick={handleCancel}
						disabled={loading}
						className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40"
					>
						Cancel·lar
					</Button>
					<Button
						onClick={handleSave}
						disabled={loading || value === currentValue}
						className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
						style={{ backgroundColor: "#e5f000" }}
					>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Guardar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}