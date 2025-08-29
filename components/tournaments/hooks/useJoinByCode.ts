"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function useJoinByCode() {
  const [joinCodeOpen, setJoinCodeOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const joinCodeInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const retryFocus = (attempts = 6, delay = 120) => {
    let tries = 0;
    const tick = () => {
      tries += 1;
      try {
        const el = joinCodeInputRef.current;
        if (el) {
          el.focus();
          el.select();
        }
      } catch {
        // ignore: focus/select may fail if element is not focusable yet
      }
      if (tries < attempts && (!joinCodeInputRef.current || document.activeElement !== joinCodeInputRef.current)) {
        try {
          window.setTimeout(tick, delay);
        } catch {
          // ignore: scheduling a timeout shouldn't normally fail
        }
      }
    };
    try {
      window.setTimeout(tick, delay);
    } catch {
      // ignore: scheduling a timeout shouldn't normally fail
    }
  };

  useEffect(() => {
    if (joinCodeOpen && joinCodeInputRef.current) {
      const timer = setTimeout(() => {
        joinCodeInputRef.current?.focus();
        joinCodeInputRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [joinCodeOpen]);

  const handleJoinByCode = async () => {
    setJoinError(null);
    if (!joinCode || joinCode.trim().length === 0) {
      setJoinError("Introdueix un codi vàlid");
      return;
    }

    setJoining(true);
    try {
      const res = await fetch(`/api/invites/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error || data.message || "No s'ha pogut validar el codi");
        return;
      }
      const token = data?.data?.token as string | undefined;
      if (token) {
        window.location.href = `/invite/accept?token=${encodeURIComponent(token)}`;
      } else {
        setJoinError(data.message || "Codi incorrecte o expirat");
      }
    } catch (e: any) {
      const msg = e?.message || "No s'ha pogut validar el codi";
      setJoinError(msg);
      toast({ title: "Error", description: msg });
    } finally {
      setJoining(false);
    }
  };

  const openJoinDialog = () => {
    setJoinCodeOpen(true);
    retryFocus();
  };
  const closeJoinDialog = () => {
    setJoinCodeOpen(false);
    setJoinError(null);
    setJoinCode("");
  };

  return {
    joinCodeOpen,
    joinCode,
    joining,
    joinError,
    joinCodeInputRef,
    setJoinCode,
    setJoinCodeOpen,
    openJoinDialog,
    closeJoinDialog,
    handleJoinByCode,
  } as const;
}
