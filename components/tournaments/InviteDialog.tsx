"use client";

import React, { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Loader2, CheckCircle, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Props = {
  openForEventId: number | null;
  onClose: () => void;
  generatedCode: string | null;
  autoGeneratingCode: boolean;
  copyConfirmed: boolean;
  inviteEmail: string;
  inviteSubmitting: boolean;
  onChangeEmail: (val: string) => void;
  onSubmitInvite: (generateOnly?: boolean) => void;
  onShare: (code: string) => void;
  onCopy: (text: string) => void;
  onJoinSolo?: () => void;
  joinSoloSubmitting?: boolean;
  isUserRegistered?: boolean;
  // optional event title to display in the dialog header
  eventTitle?: string | null;
};

export default function InviteDialog({ openForEventId, onClose, generatedCode, autoGeneratingCode, copyConfirmed, inviteEmail, inviteSubmitting, onChangeEmail, onSubmitInvite, onShare, onCopy, onJoinSolo, joinSoloSubmitting, isUserRegistered, eventTitle }: Props) {
  const inviteCodeRef = useRef<HTMLSpanElement | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const selectingActive = useRef<boolean>(false);
  const prevBodyUserSelect = useRef<string | null>(null);
  const prevSpanUserSelect = useRef<string | null>(null);
  const toast = useToast();

  const selectInviteCode = () => {
    if (!inviteCodeRef.current) return;
    try {
      const range = document.createRange();
      range.selectNodeContents(inviteCodeRef.current);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } catch (e) {
      // ignore
    }
  };

  const handlePointerDown = (_e: React.PointerEvent<HTMLDivElement>) => {
    // start long-press timer (500ms)
    longPressTimer.current = window.setTimeout(() => {
      // Temporarily restrict selection to the invite code span only
      try {
        prevBodyUserSelect.current = document.body.style.userSelect || null;
        prevSpanUserSelect.current = inviteCodeRef.current ? (inviteCodeRef.current.style.userSelect || null) : null;
        document.body.style.userSelect = 'none';
        if (inviteCodeRef.current) inviteCodeRef.current.style.userSelect = 'text';
      } catch (e) {
        // ignore
      }

      selectInviteCode();
      selectingActive.current = true;
      longPressTimer.current = null;

      // safety: restore after 2s in case pointerup isn't fired
      window.setTimeout(() => {
        if (selectingActive.current) {
          try {
            if (prevBodyUserSelect.current !== null) document.body.style.userSelect = prevBodyUserSelect.current;
            else document.body.style.removeProperty('user-select');
            if (inviteCodeRef.current) {
              if (prevSpanUserSelect.current !== null) inviteCodeRef.current.style.userSelect = prevSpanUserSelect.current;
              else inviteCodeRef.current.style.removeProperty('user-select');
            }
          } catch (e) {
            // ignore
          }
          selectingActive.current = false;
        }
      }, 2000);
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (selectingActive.current) {
      try {
        if (prevBodyUserSelect.current !== null) document.body.style.userSelect = prevBodyUserSelect.current;
        else document.body.style.removeProperty('user-select');
        if (inviteCodeRef.current) {
          if (prevSpanUserSelect.current !== null) inviteCodeRef.current.style.userSelect = prevSpanUserSelect.current;
          else inviteCodeRef.current.style.removeProperty('user-select');
        }
      } catch (e) {
        // ignore
      }
      selectingActive.current = false;
    }
  };

  return (
    <Dialog
      open={openForEventId !== null}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="bg-zinc-900/90 backdrop-blur-md border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{eventTitle ?? "Inscripció a l'Event"}</DialogTitle>
          <DialogDescription>
            Pots inscriure&apos;t sol o amb parella compartint el codi perquè l&apos;altra persona
            s&apos;uneixi.
          </DialogDescription>
        </DialogHeader>

  <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-center">
              <div className="relative mb-2">
                <h3 className="text-lg font-semibold text-white">Codi d&apos;invitació</h3>
                {generatedCode && (
                  <button onClick={() => onShare(generatedCode)} className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 flex items-center justify-center text-white hover:text-white rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-padel-primary/40" title="Compartir codi d'invitació" aria-label="Compartir codi d'invitació">
                    <Share2 className="h-5 w-5 text-white" />
                  </button>
                )}
              </div>

        {autoGeneratingCode ? (
                <div className="flex items-center justify-center space-x-2 py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-padel-primary" />
                  <span className="text-white/60">Generant codi...</span>
                </div>
                ) : generatedCode ? (
                <div className="space-y-3">
                  {/* Copy functionality temporarily hidden - code is shown but not clickable */}
                  <div
                    className="bg-padel-primary rounded-lg p-5 focus:outline-none shadow-lg transition-all duration-200"
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                  >
                    <div className="text-center space-y-3">
                      <div className="font-mono text-3xl md:text-4xl font-extrabold tracking-[0.4em] text-black drop-shadow-sm">
                        <span ref={inviteCodeRef} className="select-all">{generatedCode}</span>
                      </div>
                      {/* Intentionally hide the interactive copy hint while copy is disabled */}
                      <div className="flex items-center justify-center space-x-2 text-black/60 transition-colors">
                       <Copy className="h-4 w-4" /> 

                        <span className="text-sm font-semibold select-none">Mantingueu premut el text per copiar</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">Error generant el codi. Tanca i torna a intentar-ho.</div>
              )}
            </div>
            {copyConfirmed && (
              <div aria-live="polite" className="flex items-center justify-center gap-2 text-green-400"><CheckCircle className="h-4 w-4" /><span className="text-sm">Codi copiat al portapapers</span></div>
            )}
            {generatedCode && <p className="text-xs text-white/60 text-center">Comparteix aquest codi amb la teva parella per unir-se al torneig</p>}
          </div>

         {/*  <div className="border-t border-white/10 pt-4 space-y-3">
            <div className="text-sm">
              <label className="text-white/80 font-medium">Enviar per email (opcional)</label>
              <p className="text-xs text-white/60 mt-1">Envia directament la invitació al correu de la teva parella</p>
            </div>
            <div className="space-y-2">
              <Input type="email" placeholder="correu@exemple.com" value={inviteEmail} onChange={(e) => onChangeEmail(e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-white/40" />
              <Button onClick={() => onSubmitInvite(false)} disabled={inviteSubmitting || !inviteEmail.trim()} className="bg-padel-primary text-black hover:bg-padel-primary/90 w-full" size="sm">
                {inviteSubmitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviant...</>) : ("Enviar invitació")}
              </Button>
            </div>
          </div> */}
          {/* horizontal separator between email section and footer buttons */}
          <div className="border-t border-white/10 mt-4" />
        </div>

        <DialogFooter>
          {/* Join solo button placed above the close button as requested */}
          {/* Using optional chaining for new props to keep backwards compatibility */}
          <div className="w-full">
            {!isUserRegistered && (
              <Button onClick={() => { if (onJoinSolo) { onJoinSolo(); } else { onClose(); } }} disabled={joinSoloSubmitting} className="mb-2 bg-padel-primary text-black hover:bg-padel-primary/90 w-full" size="lg">
                {joinSoloSubmitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Unint-me...</>) : ("Unir-me sol")}
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-full">Tancar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
