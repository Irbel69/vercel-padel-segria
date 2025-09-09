"use client";

import React from "react";

// Robust Emphasis: use native text-decoration so underline follows wrapped text.
// We intentionally avoid absolute elements so wrapping and mobile clipping don't break.
export default function Emphasis({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`relative inline-block group ${className ?? ""}`}>
      <strong className="relative z-10 font-semibold emph">{children}</strong>

      <style jsx>{`
        .emph {
          text-decoration-line: underline;
          text-decoration-color: #e5f000; /* token: padel-primary */
          text-decoration-thickness: 3px;
          text-underline-offset: 6px;
        }

        @media (max-width: 640px) {
          .emph {
            text-decoration-thickness: 4px;
            text-underline-offset: 8px;
          }
        }
      `}</style>
    </span>
  );
}
