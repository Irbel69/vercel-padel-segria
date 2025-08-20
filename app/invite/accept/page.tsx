"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, XCircle, LogIn } from "lucide-react";
import AnimatedDottedBackground from "@/components/AnimatedDottedBackground";
import { useUser } from "@/hooks/use-user";
import config from "@/config";

export default function AcceptInvitePage() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const token = params.get("token") || "";

  const [status, setStatus] = useState<"idle" | "accepting" | "declining" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState<boolean>(false);
  const tokenFormatInvalid = !!token && token.length < 10;

  useEffect(() => {
    // Reset auth-related banner if user logs in
    if (user && unauthorized) setUnauthorized(false);
  }, [user, unauthorized]);

  const handleAccept = async () => {
    setError(null);
    setUnauthorized(false);
    setStatus("accepting");
    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(token)}/accept`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setUnauthorized(true);
        throw new Error("Cal iniciar sessió per continuar");
      }
      if (!res.ok) throw new Error((data as any).error || (data as any).message || "Error");
      setStatus("done");
      router.push("/dashboard/tournaments");
    } catch (e: any) {
      setError(e?.message || "Error acceptant la invitació");
      setStatus("idle");
    }
  };

  const handleDecline = async () => {
    setError(null);
    setUnauthorized(false);
    setStatus("declining");
    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(token)}/decline`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setUnauthorized(true);
        throw new Error("Cal iniciar sessió per continuar");
      }
      if (!res.ok) throw new Error((data as any).error || (data as any).message || "Error");
      setStatus("done");
      router.push("/dashboard/tournaments");
    } catch (e: any) {
      setError(e?.message || "Error rebutjant la invitació");
      setStatus("idle");
    }
  };

  // Quick missing token UI
  if (!token) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center relative overflow-hidden">
        <AnimatedDottedBackground />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#c3fb12]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#c3fb12]/20 rounded-full blur-2xl" />
        </div>
        <div className="container px-4 relative z-10">
          <div className="max-w-md mx-auto">
            <Card
              className="rounded-2xl border-white/10 bg-white/5 backdrop-blur-lg shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <h1 className="text-xl font-semibold">Token no vàlid</h1>
                </div>
                <Alert
                  variant="destructive"
                  className="border-red-500/50 bg-red-500/10 text-red-300 rounded-lg"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Falta el codi d'invitació. Revisa l'enllaç rebut.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  const isBusy = status === "accepting" || status === "declining";

  return (
    <main className="min-h-[80vh] flex items-center justify-center relative overflow-hidden">
      {/* Animated brand background */}
      <AnimatedDottedBackground />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#c3fb12]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#c3fb12]/20 rounded-full blur-2xl" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="max-w-md mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[#c3fb12]/30 rounded-full blur-md" />
              <Image
                src="/logo_yellow.png"
                alt={config.appName}
                width={72}
                height={72}
                className="relative"
              />
            </div>
          </div>

          <Card
            className="rounded-2xl border-white/10 bg-white/5 backdrop-blur-lg shadow-xl">
            <CardContent className="p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 text-white">
                Acceptar invitació
              </h1>
              <p className="text-white/70 mb-4">
                Vols acceptar aquesta invitació en parella? Si l'acceptes, es confirmarà la inscripció per a tots dos.
              </p>

              {tokenFormatInvalid && (
                <div className="mb-4">
                  <Alert
                    variant="destructive"
                    className="border-red-500/50 bg-red-500/10 text-red-300 rounded-lg"
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Token no vàlid</AlertDescription>
                  </Alert>
                </div>
              )}

              {error && (
                <div className="mb-4">
                  <Alert
                    variant="destructive"
                    className="border-red-500/50 bg-red-500/10 text-red-300 rounded-lg"
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              {unauthorized && (
                <div className="mb-4">
                  <Alert>
                    <LogIn className="h-4 w-4" />
                    <AlertDescription>
                      Cal iniciar sessió per acceptar o rebutjar la invitació.
                    </AlertDescription>
                  </Alert>
                  <div className="mt-3">
                    <Button
                      onClick={() => router.push("/signin")}
                      className="w-full font-bold text-black"
                      style={{ background: "#c3fb12" }}
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Inicia sessió
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <Button
                  onClick={handleAccept}
                  disabled={isBusy || tokenFormatInvalid}
                  className="w-full font-bold text-black disabled:opacity-70"
                  style={{ background: "#c3fb12" }}
                >
                  {status === "accepting" ? (
                    <span className="inline-flex items-center">
                      <span className="mr-2 inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Processant
                    </span>
                  ) : (
                    <span className="inline-flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Acceptar
                    </span>
                  )}
                </Button>

                <Button
                  onClick={handleDecline}
                  variant="outline"
                  disabled={isBusy || tokenFormatInvalid}
                  className="w-full font-bold border-red-500/40 text-red-400 hover:bg-red-500/10"
                >
                  {status === "declining" ? (
                    <span className="inline-flex items-center">
                      <span className="mr-2 inline-block w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      Processant
                    </span>
                  ) : (
                    <span className="inline-flex items-center">
                      <XCircle className="h-4 w-4 mr-2" /> Rebutjar
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
