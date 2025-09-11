"use client";
import React from "react";
import { Users } from "lucide-react";

interface DirectDebit {
	iban?: string | null;
	holder_name?: string | null;
	holder_address?: string | null;
	holder_dni?: string | null;
}

interface Participant {
	id?: number;
	name: string;
	dni?: string | null;
	phone?: string | null;
}

export interface RequestRowDetails {
	id: number;
	user?: {
		name?: string | null;
		surname?: string | null;
		email?: string | null;
		phone?: string | null;
	} | null;
	group_size: number;
	allow_fill: boolean;
	payment_method?: string | null;
	observations?: string | null;
	participants?: Participant[];
	direct_debit?: DirectDebit | null;
}

function paymentMethodLabel(pm?: string | null) {
	switch (pm) {
		case "direct_debit":
			return "Domiciliació";
		case "cash":
			return "Efectiu";
		case "bizum":
			return "Bizum";
		default:
			return pm || "-";
	}
}

function allowFillLabel(allow: boolean) {
	return allow ? "Admet omplir" : "No admet omplir";
}

export default function RequestDetails({ req }: { req: RequestRowDetails }) {
	return (
		<div className="text-[12px] space-y-3">
			{req.observations && (
				<div>
					<span className="font-medium">Obs:</span> {req.observations}
				</div>
			)}

			<div>
				<div className="font-medium">Titular</div>
				<div className="text-muted-foreground text-[13px]">
					{req.user?.name || "-"} {req.user?.surname || ""}
				</div>
				<div className="text-[12px] text-muted-foreground">
					{req.user?.email}
					{req.user?.phone && (
						<span className="ml-4">Tel: {req.user.phone}</span>
					)}
				</div>
				{req.direct_debit?.holder_dni && (
					<div className="text-[12px] text-muted-foreground">
						DNI: {req.direct_debit.holder_dni}
					</div>
				)}
			</div>

			{req.participants && req.participants.length > 0 && (
				<div>
					<div className="font-medium mb-1">Participants</div>
					<div className="grid gap-1">
						{req.participants.map((p, idx) => (
							<div
								key={p.id ?? `p-${idx}`}
								className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white/5 rounded px-2 py-1 text-[13px]">
								<div className="font-medium">{p.name}</div>
								<div className="text-muted-foreground">
									{p.dni ? `DNI: ${p.dni}` : ""}{" "}
									{p.phone ? ` · Tel: ${p.phone}` : ""}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="flex flex-wrap gap-2">
				<span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 inline-flex items-center gap-2">
					{allowFillLabel(req.allow_fill)}
					<span
						className="flex items-center gap-1 text-[11px] text-muted-foreground"
						aria-label={`Grup: ${req.group_size}`}>
						<Users className="h-3 w-3" aria-hidden="true" />
						<span>{req.group_size}</span>
					</span>
				</span>
			</div>

			<div>
				<div className="font-medium">Pagament</div>
				<div className="text-[13px] text-muted-foreground">
					{paymentMethodLabel(req.payment_method)}
				</div>
				{req.direct_debit && (
					<div className="mt-1 text-[12px] text-muted-foreground">
						<div>Domiciliació:</div>
						<div>IBAN: {req.direct_debit.iban || "-"}</div>
						<div>Titular: {req.direct_debit.holder_name || "-"}</div>
						{req.direct_debit.holder_address && (
							<div>Adreça: {req.direct_debit.holder_address}</div>
						)}
						{req.direct_debit.holder_dni && (
							<div>DNI: {req.direct_debit.holder_dni}</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
