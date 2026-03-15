"use client";

import { useState } from "react";

export default function MobileWarning() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="md:hidden fixed inset-x-0 top-0 z-[300] flex items-start justify-between gap-3 px-4 py-3"
      style={{
        background: "rgba(20,18,16,0.96)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(8px)",
      }}
    >
      <p
        className="text-xs leading-snug"
        style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
      >
        <span style={{ color: "var(--foreground)", fontWeight: 600 }}>Hopscotch works best on desktop.</span>
        {" "}Mobile support is limited - for the full experience open it on a computer.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full"
        style={{ background: "var(--border)", color: "var(--muted)" }}
        aria-label="Dismiss"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
