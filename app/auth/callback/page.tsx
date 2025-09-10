"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/libs/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const code = params.get("code");
      if (!code) {
        setError("missing_code");
        router.replace("/signin?error=missing_code");
        return;
      }

      try {
        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("exchangeCodeForSession error", error);
          const msg = String(error.message || error);
          // If PKCE code_verifier is missing, redirect user back to signin to retry.
          if (/code verifier|both auth code and code verifier|invalid request/i.test(msg)) {
            setError("pkce_missing");
            // Give the user a brief moment to see message then redirect to signin
            setTimeout(() => router.replace("/signin?error=pkce_missing"), 1500);
            return;
          }
          setError("auth_error");
          router.replace("/signin?error=auth_error");
          return;
        }

        // After exchanging the session, send the user to complete-profile.
        // Middleware will send them to /dashboard if already completed.
        router.replace("/complete-profile");
      } catch (e) {
        console.error(e);
        setError("unexpected_error");
        router.replace("/signin?error=auth_error");
      }
    };
    run();
  }, [params, router]);

  return (
    <main className="min-h-screen grid place-items-center">
      <div className="text-center text-white/80">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p>Connectant…</p>
        {/* Do not show raw error text to the user here — redirects will surface any necessary messages on the signin page. */}
      </div>
    </main>
  );
}
