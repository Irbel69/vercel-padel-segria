"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useUser } from "@/hooks/use-user";

export default function AcceptInvitePage() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const token = params.get("token") || "";

  const [status, setStatus] = useState<"idle" | "accepting" | "declining" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    // auto-login requirement is handled globally by middleware for /dashboard etc.
  }, [user]);

  const handleAccept = async () => {
    setError(null);
    setStatus("accepting");
    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(token)}/accept`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Error");
      setStatus("done");
      // redirect to dashboard tournaments
      router.push("/dashboard/tournaments");
    } catch (e: any) {
      setError(e.message || "Error acceptant la invitació");
      setStatus("idle");
    }
  };

  const handleDecline = async () => {
    setError(null);
    setStatus("declining");
    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(token)}/decline`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Error");
      setStatus("done");
      router.push("/dashboard/tournaments");
    } catch (e: any) {
      setError(e.message || "Error rebutjant la invitació");
      setStatus("idle");
    }
  };

  if (!token) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>Token invàlid</AlertDescription></Alert>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-white">Acceptar invitació</h1>
      {error && (
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
      )}
      <p className="text-white/70">Vols acceptar aquesta invitació en parella? Si l'acceptes, es confirmarà la inscripció per a tots dos.</p>
      <div className="flex gap-2">
        <Button onClick={handleAccept} disabled={status!=="idle"} className="bg-green-500 text-black hover:bg-green-500/90">
          <CheckCircle2 className="h-4 w-4 mr-1" /> Acceptar
        </Button>
        <Button onClick={handleDecline} variant="outline" disabled={status!=="idle"} className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30">
          <XCircle className="h-4 w-4 mr-1" /> Rebutjar
        </Button>
      </div>
    </div>
  );
}
