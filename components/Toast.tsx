"use client";

import { useEffect, useState } from "react";

interface Props {
  message: string;
  visible: boolean;
  onDone: () => void;
}

export default function Toast({ message, visible, onDone }: Props) {
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      const t = setTimeout(() => {
        setRendered(false);
        setTimeout(onDone, 300); // wait for fade out
      }, 2200);
      return () => clearTimeout(t);
    }
  }, [visible, onDone]);

  if (!visible && !rendered) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl text-sm font-medium pointer-events-none"
      style={{
        background: "#2e2b27",
        border: "1px solid var(--border)",
        color: "var(--foreground)",
        fontFamily: "var(--font-dm-sans)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        opacity: rendered ? 1 : 0,
        transform: rendered
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(8px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color: "var(--accent-secondary)", marginRight: "6px" }}>⚠</span>
      {message}
    </div>
  );
}
