"use client";

import { useState, useEffect, ReactNode } from "react";
import { useUser } from "@/hooks/use-user";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { CreateBookingPayload, PaymentType } from "@/types/lessons";

export function BookingDialog({
  slotId,
  trigger,
  slotParticipantsCount = 0,
  allowFillPolicy = null,
  slotStatus,
}: {
  slotId: number;
  trigger?: ReactNode;
  slotParticipantsCount?: number;
  allowFillPolicy?: boolean | null;
  slotStatus?: "open" | "full" | "cancelled" | "closed";
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const [groupSize, setGroupSize] = useState<1 | 2 | 3 | 4>(1);
  const [allowFill, setAllowFill] = useState(true);
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const { profile } = useUser();

  // Synchronous cached profile for immediate UI fill
  let parsedCache: { name?: string; surname?: string } | null = null;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("ps_profile_cache");
      parsedCache = raw ? JSON.parse(raw) : null;
    } catch {}
  }

  const firstName = profile?.name ?? parsedCache?.name ?? "";
  const lastName = profile?.surname ?? parsedCache?.surname ?? "";
  const computedPrimaryName = `${firstName}${
    lastName ? ` ${lastName}` : ""
  }`.trim();

  const [participants, setParticipants] = useState<string[]>([]);
  const [observations, setObservations] = useState("");
  const [dd, setDd] = useState({
    iban: "",
    holder_name: "",
    holder_address: "",
    holder_dni: "",
    is_authorized: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ibanError, setIbanError] = useState<string | null>(null);

  // Helpers: IBAN formatting and validation
  const normalizeIban = (value: string) =>
    value.replace(/\s+/g, "").toUpperCase();
  const formatIban = (value: string) => {
    const raw = normalizeIban(value)
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 34);
    return raw.replace(/(.{4})/g, "$1 ").trim();
  };
  const validateIban = (value: string) => {
    const iban = normalizeIban(value);
    if (!iban) return false;
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
    // Move first 4 chars to end
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    // Convert letters to numbers (A=10 .. Z=35) and compute mod 97 iteratively
    let remainder = 0;
    for (let i = 0; i < rearranged.length; i++) {
      const ch = rearranged[i];
      const code =
        ch >= "A" && ch <= "Z" ? (ch.charCodeAt(0) - 55).toString() : ch;
      for (let j = 0; j < code.length; j++) {
        remainder = (remainder * 10 + (code.charCodeAt(j) - 48)) % 97;
      }
    }
    return remainder === 1;
  };

  const isFirst = (slotParticipantsCount || 0) === 0;
  const forceCheckedDisabled =
    (slotParticipantsCount || 0) > 0 && slotStatus === "open";
  const effectiveAllowFill = forceCheckedDisabled
    ? true
    : isFirst
    ? allowFill
    : Boolean(allowFillPolicy);

  useEffect(() => {
    // Align local state when policy changes
    if (forceCheckedDisabled) {
      setAllowFill(true);
    } else if (!isFirst && allowFillPolicy !== null) {
      setAllowFill(Boolean(allowFillPolicy));
    }
  }, [isFirst, allowFillPolicy, forceCheckedDisabled]);

  // Derived flags for direct debit completeness
  const isDdSelected = paymentType === "direct_debit";
  const isIbanValid = !isDdSelected ? true : validateIban(dd.iban);
  const isDdIncomplete =
    isDdSelected &&
    (!dd.is_authorized ||
      !dd.iban?.trim() ||
      !isIbanValid ||
      !dd.holder_name?.trim() ||
      !dd.holder_address?.trim() ||
      !dd.holder_dni?.trim());

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    // Require mandatory fields and valid IBAN for direct debit
    if (paymentType === "direct_debit") {
      if (!dd.is_authorized) {
        setError("Cal acceptar l'autorització de domiciliació bancària");
        setSubmitting(false);
        return;
      }
      if (!validateIban(dd.iban)) {
        setIbanError("IBAN no vàlid");
        setError("IBAN no vàlid");
        setSubmitting(false);
        return;
      }
      if (
        !dd.iban?.trim() ||
        !dd.holder_name?.trim() ||
        !dd.holder_address?.trim() ||
        !dd.holder_dni?.trim()
      ) {
        setError(
          "Cal completar IBAN, Nom del titular, Adreça i DNI per al rebut bancari"
        );
        setSubmitting(false);
        return;
      }
    }

    const payload: CreateBookingPayload = {
      slot_id: slotId,
      group_size: groupSize,
      allow_fill: effectiveAllowFill,
      payment_type: paymentType,
      observations,
      participants: participants.filter(Boolean),
      direct_debit:
        paymentType === "direct_debit"
          ? { ...dd, iban: normalizeIban(dd.iban) }
          : undefined,
    };

    const res = await fetch("/api/lessons/book", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json?.error || "Error al reservar la classe");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    try {
      window.dispatchEvent(new CustomEvent("lesson:booked"));
    } catch {}
  };

  const extraCount = groupSize - 1;
  const extraInputs = Array.from({ length: extraCount }, (_, i) => (
    <Input
      key={i}
      placeholder={`Nom addicional #${i + 1}`}
      value={participants[i] || ""}
      onChange={(e) => {
        const next = [...participants];
        next[i] = e.target.value;
        setParticipants(next);
      }}
    />
  ));

  // Mobile: full-screen sheet
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          {trigger ?? <Button variant="default">Apuntar-me</Button>}
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="inset-0 h-[100dvh] max-h-[100dvh] overflow-y-auto p-6"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Reserva de classe</h3>
          </div>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-white/80">Quantes persones?</label>
              <Select
                value={String(groupSize)}
                onValueChange={(v) => setGroupSize(Number(v) as 1 | 2 | 3 | 4)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mida del grup" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowFill"
                checked={
                  forceCheckedDisabled
                    ? true
                    : isFirst
                    ? allowFill
                    : Boolean(allowFillPolicy)
                }
                disabled={forceCheckedDisabled || !isFirst}
                onCheckedChange={(v) => {
                  if (isFirst) setAllowFill(Boolean(v));
                }}
              />
              <label htmlFor="allowFill" className="text-sm text-white/80">
                Permetre completar la classe amb altres persones
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/80">Tipus de pagament</label>
              <Select
                value={paymentType}
                onValueChange={(v) => setPaymentType(v as PaymentType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pagament" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct_debit">Rebut bancari</SelectItem>
                  <SelectItem value="bizum">Bizum</SelectItem>
                  <SelectItem value="cash">Efectiu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentType === "direct_debit" && (
              <div className="grid gap-2">
                <Input
                  placeholder="IBAN"
                  value={dd.iban}
                  onChange={(e) => {
                    const next = formatIban(e.target.value);
                    setDd({ ...dd, iban: next });
                    if (ibanError) setIbanError(null);
                  }}
                  onBlur={() => {
                    if (dd.iban && !validateIban(dd.iban))
                      setIbanError("IBAN no vàlid");
                  }}
                />
                {ibanError && (
                  <p className="text-xs text-red-400">{ibanError}</p>
                )}
                <Input
                  placeholder="Nom del titular"
                  value={dd.holder_name}
                  onChange={(e) =>
                    setDd({ ...dd, holder_name: e.target.value })
                  }
                />
                <Input
                  placeholder="Adreça"
                  value={dd.holder_address}
                  onChange={(e) =>
                    setDd({ ...dd, holder_address: e.target.value })
                  }
                />
                <Input
                  placeholder="DNI"
                  value={dd.holder_dni}
                  onChange={(e) => setDd({ ...dd, holder_dni: e.target.value })}
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="authDD"
                    checked={dd.is_authorized}
                    onCheckedChange={(v) =>
                      setDd({ ...dd, is_authorized: Boolean(v) })
                    }
                  />
                  <label htmlFor="authDD" className="text-sm text-white/80">
                    Autorització de domiciliació bancària
                  </label>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-white/80">Nom del titular</label>
              <Input
                placeholder="El teu nom"
                value={computedPrimaryName}
                readOnly
              />
            </div>

            {extraInputs.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm text-white/80">
                  Noms addicionals
                </label>
                <div className="grid gap-2">{extraInputs}</div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-white/80">Observacions</label>
              <Textarea
                placeholder="Qualsevol detall..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex justify-end gap-2">
              <SheetClose asChild>
                <Button variant="ghost" disabled={submitting}>
                  Cancel·lar
                </Button>
              </SheetClose>
              <Button
                onClick={handleSubmit}
                disabled={submitting || isDdIncomplete}
              >
                {submitting ? "Processant..." : "Confirmar reserva"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop dialog
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="default">Apuntar-me</Button>}
      </DialogTrigger>
      <DialogContent
        className="max-w-lg max-h-[85vh] max-h-[85dvh] overflow-y-auto"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Reserva de classe</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-white/80">Quantes persones?</label>
            <Select
              value={String(groupSize)}
              onValueChange={(v) => setGroupSize(Number(v) as 1 | 2 | 3 | 4)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Mida del grup" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowFill"
              checked={
                forceCheckedDisabled
                  ? true
                  : isFirst
                  ? allowFill
                  : Boolean(allowFillPolicy)
              }
              disabled={forceCheckedDisabled || !isFirst}
              onCheckedChange={(v) => {
                if (isFirst) setAllowFill(Boolean(v));
              }}
            />
            <label htmlFor="allowFill" className="text-sm text-white/80">
              Permetre completar la classe amb altres persones
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/80">Tipus de pagament</label>
            <Select
              value={paymentType}
              onValueChange={(v) => setPaymentType(v as PaymentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pagament" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct_debit">Rebut bancari</SelectItem>
                <SelectItem value="bizum">Bizum</SelectItem>
                <SelectItem value="cash">Efectiu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentType === "direct_debit" && (
            <div className="grid gap-2">
              <Input
                placeholder="IBAN"
                value={dd.iban}
                onChange={(e) => {
                  const next = formatIban(e.target.value);
                  setDd({ ...dd, iban: next });
                  if (ibanError) setIbanError(null);
                }}
                onBlur={() => {
                  if (dd.iban && !validateIban(dd.iban))
                    setIbanError("IBAN no vàlid");
                }}
              />
              {ibanError && <p className="text-xs text-red-400">{ibanError}</p>}
              <Input
                placeholder="Nom del titular"
                value={dd.holder_name}
                onChange={(e) => setDd({ ...dd, holder_name: e.target.value })}
              />
              <Input
                placeholder="Adreça"
                value={dd.holder_address}
                onChange={(e) =>
                  setDd({ ...dd, holder_address: e.target.value })
                }
              />
              <Input
                placeholder="DNI"
                value={dd.holder_dni}
                onChange={(e) => setDd({ ...dd, holder_dni: e.target.value })}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="authDD"
                  checked={dd.is_authorized}
                  onCheckedChange={(v) =>
                    setDd({ ...dd, is_authorized: Boolean(v) })
                  }
                />
                <label htmlFor="authDD" className="text-sm text-white/80">
                  Autorització de domiciliació bancària
                </label>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-white/80">Nom del titular</label>
            <Input
              placeholder="El teu nom"
              value={computedPrimaryName}
              readOnly
            />
          </div>

          {extraInputs.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm text-white/80">Noms addicionals</label>
              <div className="grid gap-2">{extraInputs}</div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-white/80">Observacions</label>
            <Textarea
              placeholder="Qualsevol detall..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel·lar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || isDdIncomplete}
            >
              {submitting ? "Processant..." : "Confirmar reserva"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
