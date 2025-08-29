"use client";

import JoinByCodeDialog from "@/components/tournaments/JoinByCodeDialog";
import { useJoinByCode } from "../hooks/useJoinByCode";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function JoinByCodeDialogContainer({ open, onOpenChange }: Props) {
  const {
    joinCode,
    setJoinCode,
    joinError,
    joining,
    handleJoinByCode,
    joinCodeInputRef,
  } = useJoinByCode();

  return (
    <JoinByCodeDialog
      open={open}
      onOpenChange={onOpenChange}
      joinCode={joinCode}
      setJoinCode={(v) => {
        setJoinCode(v);
        if (joinError) {
          // Clear error when user edits
        }
      }}
      joinError={joinError}
      joining={joining}
      onJoin={handleJoinByCode}
      inputRef={joinCodeInputRef}
    />
  );
}
