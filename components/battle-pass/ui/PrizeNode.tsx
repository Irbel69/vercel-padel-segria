"use client";

import { useState } from "react";
import { BattlePassPrizeProgress } from "../hooks/use-battle-pass-progress";
import TopPrize from "./TopPrize";
import BottomPrize from "./BottomPrize";
import { useClaimPrize } from "../hooks/use-claim-prize";
import { ClaimModal } from "./ClaimModal";
import PrizePreviewModal from "./PrizePreviewModal";

import { cn } from "@/lib/utils";

interface PrizeNodeProps extends React.HTMLAttributes<HTMLDivElement> {
  prize: BattlePassPrizeProgress;
  index: number;
  totalPrizes?: number;
}

export function PrizeNode({ prize, index, className, ...rest }: PrizeNodeProps) {
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const claimPrizeMutation = useClaimPrize();

  // Prevent preview from opening immediately after a button interaction inside the node.
  // Use immediate flag instead of timestamp to avoid race conditions on first interaction.
  const [suppressPreview, setSuppressPreview] = useState(false);

  const isLocked = !prize.can_claim;
  const isClaimed = prize.is_claimed;
  const canClaim = prize.can_claim && !prize.is_claimed;

  const handleClaimClick = () => {
    if (canClaim) {
      // Ensure preview modal is closed when opening claim modal so both can't be open at once
      setShowPreview(false);
      // Suppress preview opening for a short window to avoid pointer/tap race conditions
      setSuppressPreview(true);
      setTimeout(() => setSuppressPreview(false), 100);
      setShowClaimModal(true);
    }
  };

  const handlePreviewOpen = () => {
    const now = Date.now();
    if (suppressPreview) {
      // ignore preview open since a button was just pressed
      return;
    }
    setShowPreview(true);
  };

  const handlePreviewClose = () => setShowPreview(false);

  const handleConfirmClaim = () => {
    claimPrizeMutation.mutate(
      { prize_id: prize.id },
      {
        onSuccess: () => {
          setShowClaimModal(false);
        },
      }
    );
  };

  // track whether preview should be allowed (suppressed briefly after an interaction)
  const allowPreview = !suppressPreview;

  const onInteraction = () => {
    // Called from child interactive elements to suppress preview open for a short window
    setSuppressPreview(true);
    setTimeout(() => setSuppressPreview(false), 100);
  };

  return (
    <>
      <div className={cn("flex flex-col items-center", className)} {...rest}>
        <TopPrize prize={prize} index={index} canClaim={canClaim} isLocked={isLocked} isClaimed={isClaimed} onPreviewClick={handlePreviewOpen} allowPreview={allowPreview} />

        <BottomPrize prize={prize} index={index} canClaim={canClaim} isLocked={isLocked} isClaimed={isClaimed} onClaim={handleClaimClick} onInteraction={onInteraction} />
      </div>

      <ClaimModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onConfirm={handleConfirmClaim}
        prize={prize}
        isLoading={claimPrizeMutation.isPending}
      />

  <PrizePreviewModal isOpen={showPreview} onClose={handlePreviewClose} prize={prize} isLocked={isLocked} isClaimed={isClaimed} />
    </>
  );
}