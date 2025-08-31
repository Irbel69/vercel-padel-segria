"use client";

import { KeyboardEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";
import { ReactNode } from "react";

export default function EditableInfoCard({
  label,
  value,
  icon,
  onEdit,
  iconBgClass = "bg-white/10 border-white/20",
  ariaLabel,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  onEdit: () => void;
  iconBgClass?: string;
  ariaLabel?: string;
}) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEdit();
    }
  };

  return (
    <Card className="group border-0 bg-white/5 ring-1 ring-white/15 rounded-xl">
      <CardContent
        className="p-4 flex items-center gap-3 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={ariaLabel || `Editar ${label}`}
        onClick={onEdit}
        onKeyDown={handleKeyDown}
      >
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center border ${iconBgClass}`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white/70 text-xs font-medium mb-0.5">
            {label}
          </div>
          <div className="text-white font-medium truncate">{value || "—"}</div>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="shrink-0 text-white/70 hover:text-white hover:bg-white/10"
          aria-label={ariaLabel || `Editar ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Edit3 className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
