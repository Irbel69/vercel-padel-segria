import React, { Suspense } from "react";
import ResetPasswordClient from "@/components/reset-password/ResetPasswordClient";

export const metadata = {
  title: "Reset password",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Carregant...</div>}>
      {/* Client component handles all search params and supabase interactions */}
      <ResetPasswordClient />
    </Suspense>
  );
}
