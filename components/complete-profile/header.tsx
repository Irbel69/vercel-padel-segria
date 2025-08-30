import React from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";

type Props = {
  title?: string;
  subtitle?: string;
};

export const CompleteProfileHeader: React.FC<Props> = ({
  title = "Completa el teu perfil",
  subtitle = "Només 3 passos. Trigaràs menys d'1 minut.",
}) => {
  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-3">
        <div className="w-16 h-16 flex items-center justify-center rounded-xl logo-glow bg-[var(--padel-primary)]/10 ring-1 ring-yellow-300 overflow-hidden">
          <Image src="/logo_yellow.png" alt="Padel Segria" width={48} height={48} className="object-contain" />
        </div>
        <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-[var(--padel-primary)] animate-pulse" />
      </div>
      <div className="space-y-1 text-center">
        <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
        <p className="text-base text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
};

export default CompleteProfileHeader;
