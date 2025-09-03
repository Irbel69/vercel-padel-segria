"use client";

import InviteDialog from "@/components/tournaments/InviteDialog";
import { useInviteFlow } from "../hooks/useInviteFlow";
import { useEffect } from "react";
import { useRegisterForEvent } from "@/hooks/use-events";
import { useToast } from "@/hooks/use-toast";

type Props = {
  openForEventId: number | null;
  onClose: () => void;
  isUserRegistered?: boolean;
  eventTitle?: string | null;
  pairRequired?: boolean;
};

export default function InviteDialogContainer({ openForEventId, onClose, isUserRegistered, eventTitle, pairRequired }: Props) {
  const { toast } = useToast();
  const {
    inviteForEventId,
    inviteEmail,
    generatedCode,
    autoGeneratingCode,
    copyConfirmed,
    inviteSubmitting,
    setInviteEmail,
    handleInviteSubmit,
    handleShare,
    copyToClipboard,
    openInvite,
    closeInvite,
  } = useInviteFlow();

  const registerMutation = useRegisterForEvent();

  // Keep internal hook state in sync with parent control to preserve auto-generation.
  useEffect(() => {
    if (openForEventId) openInvite(openForEventId);
    else closeInvite();
  }, [openForEventId]);

  const effectiveOpenId = openForEventId ?? inviteForEventId;

  const handleJoinSolo = async () => {
    if (!effectiveOpenId) return;
    try {
      await registerMutation.mutateAsync(effectiveOpenId);
      toast({ title: "Inscrit", description: "T'has inscrit sol a l'esdeveniment" });
      closeInvite();
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "No s'ha pogut inscriure" });
    }
  };

  return (
    <InviteDialog
      openForEventId={effectiveOpenId}
      onClose={() => {
        closeInvite();
        onClose();
      }}
      generatedCode={generatedCode}
      autoGeneratingCode={autoGeneratingCode}
      copyConfirmed={copyConfirmed}
      inviteEmail={inviteEmail}
      inviteSubmitting={inviteSubmitting}
      onChangeEmail={(v) => setInviteEmail(v)}
      onSubmitInvite={handleInviteSubmit}
      onShare={handleShare}
      onCopy={copyToClipboard}
      onJoinSolo={pairRequired ? undefined : handleJoinSolo}
      joinSoloSubmitting={registerMutation.isPending}
      isUserRegistered={isUserRegistered}
      eventTitle={eventTitle ?? null}
      pairRequired={!!pairRequired}
      // eventTitle is not available here; parent should pass a title via context or prop if needed
    />
  );
}
