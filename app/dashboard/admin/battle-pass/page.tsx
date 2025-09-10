"use client";

import React, { useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { PrizesList } from "@/components/dashboard/admin/battle-pass/ui/PrizesList";

export default function BattlePassAdminPage() {
  const { profile, isLoading: userLoading } = useUser();
  const router = useRouter();

  // Redirect if not admin (client-side)
  useEffect(() => {
    if (!userLoading && (!profile || !profile.is_admin)) {
      router.replace("/dashboard");
    }
  }, [profile, userLoading, router]);

  // Show loading while checking user permissions
  if (userLoading || (!profile?.is_admin)) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PrizesList />
    </div>
  );
}