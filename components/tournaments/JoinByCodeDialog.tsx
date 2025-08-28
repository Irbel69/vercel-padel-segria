"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  joinCode: string;
  setJoinCode: (v: string) => void;
  joinError: string | null;
  joining: boolean;
  onJoin: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
};

export default function JoinByCodeDialog({ open, onOpenChange, joinCode, setJoinCode, joinError, joining, onJoin, inputRef }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="bg-zinc-900/90 backdrop-blur-md border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Unir-me amb codi</DialogTitle>
          <DialogDescription>Introdueix el codi d&apos;invitació que t&apos;ha compartit la teva parella per unir-te al torneig.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {(() => {
            const validPattern = /^[A-Z0-9]{6}$/;
            const isValid = validPattern.test(joinCode);
            return (
              <div>
                <Input
                  ref={inputRef}
                  placeholder="Introdueix el codi"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  aria-invalid={!!joinError || (!isValid && joinCode.length > 0)}
                  aria-describedby="join-code-help"
                  className={`bg-white/10 text-white placeholder:text-white/40 uppercase tracking-widest ` + `border ${joinError || (!isValid && joinCode.length > 0) ? "border-red-500/50 focus-visible:ring-red-500" : "border-white/20 focus-visible:ring-padel-primary"}`}
                  maxLength={6}
                />
                <p id="join-code-help" className={`mt-2 text-xs ${joinError ? "text-red-400" : "text-white/60"}`}>{joinError ? joinError : "El codi té 6 caràcters (lletres i números). Exemple: ABC123"}</p>
              </div>
            );
          })()}
          <div className="flex gap-2 pt-1">
            <Button onClick={onJoin} disabled={joining || !/^[A-Z0-9]{6}$/.test(joinCode)} className="bg-padel-primary text-black hover:bg-padel-primary/90 font-semibold">{joining ? "Validant..." : "Continuar"}</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-white/10 border-white/20 text-white hover:bg-white/20">Cancel·lar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
