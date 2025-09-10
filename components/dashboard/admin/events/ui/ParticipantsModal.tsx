import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Event } from "@/types";

type SimpleUser = {
  id: string;
  name: string | null;
  surname: string | null;
  email: string;
  avatar_url: string | null;
};

type ParticipantsGroupItem =
  | { kind: "single"; user: SimpleUser }
  | { kind: "pair"; pair_id: string; users: [SimpleUser, SimpleUser] };

interface ParticipantsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  participantsLoading: boolean;
  participantsError: string | null;
  participantsEvent: (Event & { participants?: any[] }) | null;
  participants: ParticipantsGroupItem[];
  
  // Single user search
  userSearch: string;
  setUserSearch: (value: string) => void;
  userSearchResults: {
    id: string;
    name: string | null;
    surname: string | null;
    avatar_url: string | null;
  }[];
  userSearchLoading: boolean;
  addingUserId: string | null;
  removingUserId: string | null;
  
  // Pair search
  userSearchA: string;
  setUserSearchA: (value: string) => void;
  userSearchB: string;
  setUserSearchB: (value: string) => void;
  userSearchResultsA: {
    id: string;
    name: string | null;
    surname: string | null;
    avatar_url: string | null;
  }[];
  userSearchResultsB: {
    id: string;
    name: string | null;
    surname: string | null;
    avatar_url: string | null;
  }[];
  userSearchLoadingA: boolean;
  userSearchLoadingB: boolean;
  selectedA: SimpleUser | null;
  setSelectedA: (user: SimpleUser | null) => void;
  selectedB: SimpleUser | null;
  setSelectedB: (user: SimpleUser | null) => void;
  addingPair: boolean;
  removingPairId: string | null;
  
  // Actions
  onAddUser: (userId: string) => void;
  onRemoveUser: (userId: string) => void;
  onAddPair: (userIdA: string, userIdB: string) => void;
  onRemovePair: (pairId: string) => void;
}

export function ParticipantsModal({
  isOpen,
  onOpenChange,
  participantsLoading,
  participantsError,
  participantsEvent,
  participants,
  userSearch,
  setUserSearch,
  userSearchResults,
  userSearchLoading,
  addingUserId,
  removingUserId,
  userSearchA,
  setUserSearchA,
  userSearchB,
  setUserSearchB,
  userSearchResultsA,
  userSearchResultsB,
  userSearchLoadingA,
  userSearchLoadingB,
  selectedA,
  setSelectedA,
  selectedB,
  setSelectedB,
  addingPair,
  removingPairId,
  onAddUser,
  onRemoveUser,
  onAddPair,
  onRemovePair,
}: ParticipantsModalProps) {
  const { toast } = useToast();

  const handleSelectA = (u: any) => {
    const already = participants.some((p) =>
      p.kind === "single"
        ? p.user.id === u.id
        : p.users.some((x) => x.id === u.id)
    );
    if (already) {
      toast({
        variant: "destructive",
        title: "Ja inscrit",
        description: "Aquest jugador ja està inscrit en aquest esdeveniment.",
      });
      return;
    }
    const sel = {
      id: u.id,
      name: u.name ?? null,
      surname: u.surname ?? null,
      email: "",
      avatar_url: u.avatar_url ?? null,
    };
    setSelectedA(sel);
    // Populate the input with the selected user's full name so the popover can be closed
    setUserSearchA(formatUserName(sel));
  };

  const handleSelectB = (u: any) => {
    const already = participants.some((p) =>
      p.kind === "single"
        ? p.user.id === u.id
        : p.users.some((x) => x.id === u.id)
    );
    if (already) {
      toast({
        variant: "destructive",
        title: "Ja inscrit",
        description: "Aquest jugador ja està inscrit en aquest esdeveniment.",
      });
      return;
    }
    const sel = {
      id: u.id,
      name: u.name ?? null,
      surname: u.surname ?? null,
      email: "",
      avatar_url: u.avatar_url ?? null,
    };
    setSelectedB(sel);
    // Populate the input with the selected user's full name so the popover can be closed
    setUserSearchB(formatUserName(sel));
  };

  const formatUserName = (user: SimpleUser | { name: string | null; surname: string | null; id: string }) => {
    return user.name || user.surname
      ? `${user.name || ""} ${user.surname || ""}`.trim()
      : user.id;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/90 border-white/20 text-white max-w-3xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Inscrits {participantsEvent ? `- ${participantsEvent.title}` : ""}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Llista d&apos;usuaris confirmats{" "}
            {participantsEvent && (
              <span
                className={
                  (participantsEvent.current_participants ||
                    participants.length) > participantsEvent.max_participants
                    ? "text-red-400"
                    : ""
                }
              >
                (
                {participantsEvent.current_participants ||
                  participants.length}
                /{participantsEvent.max_participants})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Add user search */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-white/60">
              Afegir usuari
            </label>
            <Input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Cerca per nom o cognom (mínim 2 caràcters)"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
            {userSearchLoading && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                <span className="text-xs text-white/40">Cercant...</span>
              </div>
            )}
            {!userSearchLoading &&
              userSearch.length >= 2 &&
              userSearchResults.length > 0 && (
                <ul className="max-h-40 overflow-y-auto bg-white/5 border border-white/10 rounded-md divide-y divide-white/10">
                  {userSearchResults.map((u) => {
                    const already = participants.some((p) =>
                      p.kind === "single"
                        ? p.user.id === u.id
                        : p.users.some((x) => x.id === u.id)
                    );
                    const isLoading = addingUserId === u.id;
                    // Make entire row clickable for better UX and accessibility
                    return (
                      <li
                        key={u.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => !already && !isLoading && onAddUser(u.id)}
                        onKeyDown={(e) => {
                          if ((e.key === "Enter" || e.key === " ") && !already && !isLoading) {
                            e.preventDefault();
                            onAddUser(u.id);
                          }
                        }}
                        className={`p-2 flex items-center gap-3 text-sm cursor-pointer hover:bg-white/10 ${already ? 'opacity-60 cursor-default' : ''}`}
                        aria-disabled={already || isLoading}
                      >
                        <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                          {(u.name?.[0] || "?") + (u.surname?.[0] || "")}
                        </div>
                        <div className="flex-1 min-w-0 truncate">
                          {formatUserName(u)}
                        </div>
                        <div className="ml-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={already || isLoading}
                            onClick={(ev) => {
                              // prevent double-trigger: stop propagation so row handler doesn't run twice
                              ev.stopPropagation();
                              if (!already && !isLoading) onAddUser(u.id);
                            }}
                            className="h-6 px-2 text-[10px] bg-padel-primary/20 border-padel-primary/30 text-padel-primary hover:bg-padel-primary/30"
                          >
                            {already ? "Afegit" : isLoading ? "..." : "Afegir"}
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
          </div>

          {/* Add pair search */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-white/60">
              Afegir parella
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Input
                  value={userSearchA}
                  onChange={(e) => {
                    setUserSearchA(e.target.value);
                    setSelectedA(null);
                  }}
                  onBlur={() => {
                    if (selectedA) {
                      setUserSearchA(formatUserName(selectedA));
                    }
                  }}
                  placeholder="Jugador A (mínim 2 car.)"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                {userSearchLoadingA && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                    <span className="text-xs text-white/40">Cercant...</span>
                  </div>
                )}
                {!userSearchLoadingA &&
                  !selectedA &&
                  userSearchA.length >= 2 &&
                  userSearchResultsA.length > 0 && (
                    <ul className="max-h-40 overflow-y-auto bg-white/5 border border-white/10 rounded-md divide-y divide-white/10 mt-1">
                      {userSearchResultsA.map((u) => {
                        const already = participants.some((p) =>
                          p.kind === "single"
                            ? p.user.id === u.id
                            : p.users.some((x) => x.id === u.id)
                        );
                        const isSelectedA = selectedA?.id === u.id;
                        return (
                            <li
                              key={u.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleSelectA(u)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleSelectA(u);
                                }
                              }}
                              aria-pressed={isSelectedA}
                              className={`p-2 flex items-center gap-3 text-sm cursor-pointer hover:bg-white/10 ${isSelectedA ? 'bg-padel-primary/20 ring-1 ring-padel-primary/40' : ''}`}
                            >
                              <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                                {(u.name?.[0] || "?") + (u.surname?.[0] || "")}
                              </div>
                              <div className={`flex-1 min-w-0 truncate ${isSelectedA ? 'text-padel-primary font-semibold' : ''}`}>
                                {formatUserName(u)}
                              </div>
                              {already && (
                                <span className="text-[10px] text-white/40">
                                  Ja inscrit
                                </span>
                              )}
                            </li>
                          );
                      })}
                    </ul>
                  )}
                {/* Selection is now indicated inline on the chosen list item */}
              </div>
              <div>
                <Input
                  value={userSearchB}
                  onChange={(e) => {
                    setUserSearchB(e.target.value);
                    setSelectedB(null);
                  }}
                  onBlur={() => {
                    if (selectedB) {
                      setUserSearchB(formatUserName(selectedB));
                    }
                  }}
                  placeholder="Jugador B (mínim 2 car.)"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                {userSearchLoadingB && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                    <span className="text-xs text-white/40">Cercant...</span>
                  </div>
                )}
                {!userSearchLoadingB &&
                  !selectedB &&
                  userSearchB.length >= 2 &&
                  userSearchResultsB.length > 0 && (
                    <ul className="max-h-40 overflow-y-auto bg-white/5 border border-white/10 rounded-md divide-y divide-white/10 mt-1">
                      {userSearchResultsB.map((u) => {
                        const already = participants.some((p) =>
                          p.kind === "single"
                            ? p.user.id === u.id
                            : p.users.some((x) => x.id === u.id)
                        );
                        const isSelectedB = selectedB?.id === u.id;
                        return (
                            <li
                              key={u.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleSelectB(u)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleSelectB(u);
                                }
                              }}
                              aria-pressed={isSelectedB}
                              className={`p-2 flex items-center gap-3 text-sm cursor-pointer hover:bg-white/10 ${isSelectedB ? 'bg-padel-primary/20 ring-1 ring-padel-primary/40' : ''}`}
                            >
                              <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                                {(u.name?.[0] || "?") + (u.surname?.[0] || "")}
                              </div>
                              <div className={`flex-1 min-w-0 truncate ${isSelectedB ? 'text-padel-primary font-semibold' : ''}`}>
                                {formatUserName(u)}
                              </div>
                              {already && (
                                <span className="text-[10px] text-white/40">
                                  Ja inscrit
                                </span>
                              )}
                            </li>
                          );
                      })}
                    </ul>
                  )}
                {/* Selection is now indicated inline on the chosen list item */}
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={
                  addingPair ||
                  !selectedA ||
                  !selectedB ||
                  selectedA.id === selectedB.id
                }
                onClick={() =>
                  selectedA &&
                  selectedB &&
                  onAddPair(selectedA.id, selectedB.id)
                }
                className="h-7 px-3 text-[11px] bg-padel-primary/20 border-padel-primary/30 text-padel-primary hover:bg-padel-primary/30"
              >
                {addingPair ? "Afegint..." : "Afegir parella"}
              </Button>
            </div>
          </div>
          {participantsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-white/60" />
            </div>
          )}
          {participantsError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{participantsError}</AlertDescription>
            </Alert>
          )}
          {!participantsLoading &&
            !participantsError &&
            participants.length === 0 && (
              <p className="text-white/60 text-sm">
                Encara no hi ha inscrits confirmats.
              </p>
            )}
          {!participantsLoading && participants.length > 0 && (
            <ul className="divide-y divide-white/10">
              {participants.map((item) =>
                item.kind === "single" ? (
                  <li
                    key={`single-${item.user.id}`}
                    className="py-2 flex items-center gap-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">
                      {(item.user.name?.[0] || "?") +
                        (item.user.surname?.[0] || "")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {formatUserName(item.user)}
                      </p>
                      <p className="text-xs text-white/50 truncate">
                        {item.user.email}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={removingUserId === item.user.id}
                      onClick={() => onRemoveUser(item.user.id)}
                      className="h-6 px-2 text-[10px] bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                    >
                      {removingUserId === item.user.id ? "..." : "Treure"}
                    </Button>
                  </li>
                ) : (
                  <li
                    key={`pair-${item.pair_id}`}
                    className="py-2 flex items-center gap-3"
                  >
                    <div className="relative h-8 w-8">
                      <div className="absolute left-0 top-0 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                        {(item.users[0].name?.[0] || "?") +
                          (item.users[0].surname?.[0] || "")}
                      </div>
                      <div className="absolute left-4 top-0 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] border border-white/10">
                        {(item.users[1].name?.[0] || "?") +
                          (item.users[1].surname?.[0] || "")}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {`${formatUserName(item.users[0])} + ${formatUserName(item.users[1])}`}
                      </p>
                      <p className="text-xs text-white/50 truncate">
                        Parella
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={removingPairId === item.pair_id}
                      onClick={() => onRemovePair(item.pair_id)}
                      className="h-6 px-2 text-[10px] bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                    >
                      {removingPairId === item.pair_id
                        ? "..."
                        : "Treure parella"}
                    </Button>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}