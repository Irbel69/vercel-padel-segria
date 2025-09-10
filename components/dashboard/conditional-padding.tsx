"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function ConditionalPadding({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname() || "";

  // Remove paddings only on /dashboard/battle-pass (and its subpaths)
  const isBattlePass = pathname.startsWith("/dashboard/battle-pass");

  if (isBattlePass) {
    return <div className="flex-1 space-y-6 mt-12" style={{ paddingTop: '0' }}>{children}</div>;
  }

  return <div className="flex-1 space-y-6 p-4 lg:p-8 mt-12" style={{ paddingTop: '0' }}>{children}</div>;
}
