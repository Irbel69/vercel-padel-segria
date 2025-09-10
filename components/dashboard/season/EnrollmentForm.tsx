import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { AdditionalParticipant } from "@/hooks/useSeasonEnrollment";

interface EnrollmentFormProps {
	groupSize: number;
	setGroupSize: (size: number) => void;
	allowFill: boolean;
	setAllowFill: (allow: boolean) => void;
	participants: AdditionalParticipant[];
	updateParticipant: (
		i: number,
		field: "name" | "dni" | "phone",
		val: string
	) => void;
	paymentMethod: string;
	setPaymentMethod: (method: string) => void;
	directDebit: {
		iban: string;
		holder_name: string;
		holder_address: string;
		holder_dni: string;
	};
	setDirectDebit: (debit: any) => void;
	observations: string;
	setObservations: (obs: string) => void;
	message: string | null;
	requesting: boolean;
	setCurrentStep: (step: 1 | 2) => void;
	submitRequest: () => void;
}

export function EnrollmentForm({
	groupSize,
	setGroupSize,
	allowFill,
	setAllowFill,
	participants,
	updateParticipant,
	paymentMethod,
	setPaymentMethod,
	directDebit,
	setDirectDebit,
	observations,
	setObservations,
	message,
	requesting,
	setCurrentStep,
	submitRequest,
}: EnrollmentFormProps) {
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Dades del Grup</CardTitle>
					<CardDescription>
						Introdueix la informació necessària.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid md:grid-cols-4 gap-4">
						<div className="md:col-span-2">
							<label className="text-xs font-medium">Mida del grup</label>
							<Input
								type="number"
								min={1}
								max={4}
								value={groupSize}
								onChange={(e) => setGroupSize(Number(e.target.value) || 1)}
							/>
						</div>
						<div className="flex items-center space-x-2 md:col-span-2 pt-6">
							<Checkbox
								id="allow_fill"
								checked={allowFill}
								onCheckedChange={(v) => setAllowFill(!!v)}
							/>
							<label htmlFor="allow_fill" className="text-xs">
								Permetre omplenar la classe amb altres persones
							</label>
						</div>
					</div>
					<div className="space-y-3">
						{participants.map((p: AdditionalParticipant, i: number) => (
							<div
								key={i}
								className="grid grid-cols-1 sm:grid-cols-7 gap-2 items-end">
								<div className="sm:col-span-3">
									<label className="text-xs font-medium">
										Participant {i + 2}
									</label>
									<Input
										value={p.name}
										onChange={(e) =>
											updateParticipant(i, "name", e.target.value)
										}
										placeholder="Nom"
									/>
								</div>
								<div>
									<label className="text-xs font-medium">DNI</label>
									<Input
										value={p.dni}
										onChange={(e) =>
											updateParticipant(i, "dni", e.target.value)
										}
										placeholder="DNI"
									/>
								</div>
								<div className="sm:col-span-2">
									<label className="text-xs font-medium">Telèfon (+34)</label>
									<Input
										value={p.phone}
										onChange={(e) =>
											updateParticipant(i, "phone", e.target.value)
										}
										placeholder="600 000 000"
									/>
								</div>
							</div>
						))}
					</div>
					<div>
						<label className="text-xs font-medium">Mètode de pagament</label>
						<select
							className="mt-1 w-full rounded-md bg-background border px-2 py-1.5 text-sm"
							value={paymentMethod}
							onChange={(e) => setPaymentMethod(e.target.value)}>
							<option value="cash">Efectiu</option>
							<option value="bizum">Bizum</option>
							<option value="direct_debit">Rebut bancari</option>
						</select>
					</div>
					{paymentMethod === "direct_debit" && (
						<div className="space-y-2 border rounded-md p-3">
							<div>
								<label className="text-[11px] font-medium">IBAN</label>
								<Input
									value={directDebit.iban}
									onChange={(e) =>
										setDirectDebit({ ...directDebit, iban: e.target.value })
									}
									placeholder="ES.."
								/>
							</div>
							<div>
								<label className="text-[11px] font-medium">Titular</label>
								<Input
									value={directDebit.holder_name}
									onChange={(e) =>
										setDirectDebit({
											...directDebit,
											holder_name: e.target.value,
										})
									}
								/>
							</div>
							<div>
								<label className="text-[11px] font-medium">Adreça</label>
								<Input
									value={directDebit.holder_address}
									onChange={(e) =>
										setDirectDebit({
											...directDebit,
											holder_address: e.target.value,
										})
									}
								/>
							</div>
							<div>
								<label className="text-[11px] font-medium">DNI</label>
								<Input
									value={directDebit.holder_dni}
									onChange={(e) =>
										setDirectDebit({
											...directDebit,
											holder_dni: e.target.value,
										})
									}
								/>
							</div>
							<div className="flex items-center gap-2 text-[11px] text-muted-foreground">
								<Checkbox checked onCheckedChange={() => {}} /> Autoritzo la
								domiciliació bancària
							</div>
						</div>
					)}
					<div>
						<label className="text-xs font-medium">Observacions</label>
						<Textarea
							value={observations}
							onChange={(e) => setObservations(e.target.value)}
							rows={3}
						/>
					</div>
					{message && (
						<div className="text-xs text-muted-foreground">{message}</div>
					)}
					<div className="flex gap-2 pt-2">
						<Button
							variant="outline"
							onClick={() => setCurrentStep(1)}
							disabled={requesting}>
							Enrere
						</Button>
						<Button
							className="flex-1"
							disabled={requesting}
							onClick={submitRequest}>
							{requesting ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Enviar sol·licitud"
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
