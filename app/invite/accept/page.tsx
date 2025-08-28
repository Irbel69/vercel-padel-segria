import { Suspense } from "react";
import AcceptInvite from "@/components/invite/ui/AcceptInvite";

export default function AcceptInvitePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const tokenParam = searchParams?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] ?? "" : tokenParam ?? "";

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white/70">Carregant…</div>}>
      <AcceptInvite token={token} />
    </Suspense>
  );
}
