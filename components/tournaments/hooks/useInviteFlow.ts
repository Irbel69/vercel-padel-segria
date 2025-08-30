"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCreatePairInvite } from "@/hooks/use-events";

export function useInviteFlow() {
  const { toast } = useToast();

  const [inviteForEventId, setInviteForEventId] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [autoGeneratingCode, setAutoGeneratingCode] = useState(false);
  const [regeneratingCode, setRegeneratingCode] = useState(false);

  const inviteCodeRef = useRef<HTMLSpanElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const [copyConfirmed, setCopyConfirmed] = useState(false);

  const inviteMutation = useCreatePairInvite();

  const openInvite = (eventId: number) => {
    setInviteForEventId(eventId);
    setInviteEmail("");
    setGeneratedCode(null);
    setCodeExpiresAt(null);
  };

  const closeInvite = () => {
    setInviteForEventId(null);
    setInviteEmail("");
    setGeneratedCode(null);
    setCodeExpiresAt(null);
    setAutoGeneratingCode(false);
    setRegeneratingCode(false);
    try {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    } catch (e) {
      // ignore errors clearing timer
    }
    setCopyConfirmed(false);
  };

  const handleInviteSubmit = async (generateCodeOnly = false) => {
    if (!inviteForEventId) return;
    setInviteSubmitting(true);
    try {
      const result = await inviteMutation.mutateAsync({
        eventId: inviteForEventId,
        email: generateCodeOnly ? undefined : inviteEmail || undefined,
        generateCodeOnly: !!generateCodeOnly,
      });
      const code = result?.data?.short_code;
      if (code) {
        setGeneratedCode(code);
        setCodeExpiresAt(null);
      }
      toast({
        title: "Invitació creada",
        description: generateCodeOnly
          ? "Comparteix el codi amb la teva parella"
          : "Hem enviat un correu si l'adreça és correcta",
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No s'ha pogut crear la invitació" });
    }
    finally {
      setInviteSubmitting(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!inviteForEventId || regeneratingCode) return;
    try {
      setRegeneratingCode(true);
      const result = await inviteMutation.mutateAsync({
        eventId: inviteForEventId,
        generateCodeOnly: true,
        forceNew: true,
      });
      const code = result?.data?.short_code;
      if (code) {
        setGeneratedCode(code);
        setCodeExpiresAt(null);
      }
      toast({ title: "Codi regenerat", description: "S'ha generat un nou codi d'invitació" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No s'ha pogut regenerar el codi" });
    } finally {
      setRegeneratingCode(false);
    }
  };

  const handleShare = async (code: string) => {
    const shareData = {
  title: "Únete a mi equipo en Padel Segrià",
      text: `Usa aquest codi per unir-te al meu equip en el torneig: ${code}`,
      url: window.location.origin,
    } as const;

    if (
      typeof navigator !== "undefined" &&
      (navigator as any).share &&
      (navigator as any).canShare &&
      (navigator as any).canShare(shareData as any)
    ) {
      try {
        await (navigator as any).share(shareData as any);
        toast({ title: "Compartit!", description: "La invitació s'ha compartit correctament" });
        return;
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.warn("Error sharing:", error);
        }
      }
    }

    const fullMessage = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
    let success = false;
    try {
      if (
        typeof navigator !== "undefined" &&
        (navigator as any).clipboard &&
        (window as any).isSecureContext
      ) {
        await (navigator as any).clipboard.writeText(fullMessage);
        success = true;
      }
    } catch {
      // ignore clipboard write errors
    }

    if (!success) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = fullMessage;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try { textarea.setSelectionRange(0, fullMessage.length); } catch (e) {
          // ignore selection issues on older browsers
        }
        success = document.execCommand && document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch (e) {
        // ignore fallback copy errors
      }
    }

    // Copy/share feedback temporarily disabled. We keep the share flow but do not show copy toasts.
    // If clipboard write succeeded, we intentionally do not notify the user until copy is re-enabled.
    return;
  };

  const selectInviteCodeText = () => {
    try {
      const el = inviteCodeRef.current;
      if (!el) return;
      const selection = window.getSelection?.();
      if (selection && typeof document.createRange === "function") {
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(el);
        selection.addRange(range);
      } else if ((document as any).body?.createTextRange) {
        const range = (document as any).body.createTextRange();
        range.moveToElementText(el);
        range.select();
      }
    } catch (e) {
      // ignore selection errors
    }
  };

  // copyToClipboard is intentionally disabled for now. Callers should not rely on it.
  const copyToClipboard = async (_text: string) => {
    // No-op: copying and copy-related toasts are temporarily disabled.
    // Mark the parameter as used to avoid unused-var lint warnings.
    void _text;
    return;
  };

  useEffect(() => {
    if (inviteForEventId && !generatedCode && !autoGeneratingCode) {
      setAutoGeneratingCode(true);
      setGeneratedCode(null);
      setCodeExpiresAt(null);
      (async () => {
        try {
          const result = await inviteMutation.mutateAsync({
            eventId: inviteForEventId,
            generateCodeOnly: true,
          });
          const code = result?.data?.short_code;
          if (code) {
            setGeneratedCode(code);
            setCodeExpiresAt(null);
          }
        } catch (e: any) {
          toast({ title: "Error", description: "No s'ha pogut generar el codi automàticament" });
        } finally {
          setAutoGeneratingCode(false);
        }
      })();
    }
  }, [inviteForEventId, generatedCode, autoGeneratingCode, inviteMutation, toast]);

  return {
    // state
    inviteForEventId,
    inviteEmail,
    inviteSubmitting,
    generatedCode,
    codeExpiresAt,
    autoGeneratingCode,
    regeneratingCode,
    copyConfirmed,
    // refs
    inviteCodeRef,
    copyTimerRef,
    // actions
    setInviteEmail,
    openInvite,
    closeInvite,
    handleInviteSubmit,
    handleRegenerateCode,
    copyToClipboard,
    handleShare,
  } as const;
}
