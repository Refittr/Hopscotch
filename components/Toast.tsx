"use client";

import { useEffect, useState, useCallback } from "react";

// ── Single-message legacy Toast (kept for max-shortlist use) ─────────────────

interface SingleProps {
  message: string;
  visible: boolean;
  onDone: () => void;
}

export default function Toast({ message, visible, onDone }: SingleProps) {
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      const t = setTimeout(() => {
        setRendered(false);
        setTimeout(onDone, 300);
      }, 2200);
      return () => clearTimeout(t);
    }
  }, [visible, onDone]);

  if (!visible && !rendered) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[100] px-4 py-2.5 rounded-xl text-sm font-medium pointer-events-none"
      style={{
        background: "#2e2b27",
        border: "1px solid var(--border)",
        color: "var(--foreground)",
        fontFamily: "var(--font-dm-sans)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        opacity: rendered ? 1 : 0,
        transform: rendered ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(8px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color: "var(--accent-secondary)", marginRight: "6px" }}>⚠</span>
      {message}
    </div>
  );
}

// ── Stacking toast system ────────────────────────────────────────────────────

interface ToastItem {
  id: number;
  message: string;
  icon?: string;
}

let _nextId = 1;

interface ToastStackProps {
  toasts: ToastItem[];
  onRemove: (id: number) => void;
}

function ToastEntry({ item, onRemove }: { item: ToastItem; onRemove: (id: number) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const enter = requestAnimationFrame(() => setVisible(true));
    const dismiss = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(item.id), 280);
    }, 3000);
    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(dismiss);
    };
  }, [item.id, onRemove]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 14px",
        borderRadius: "12px",
        background: "#1e1c21",
        border: "1px solid var(--border)",
        color: "var(--foreground)",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "13px",
        fontWeight: 500,
        boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
        whiteSpace: "nowrap",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(16px)",
        transition: "opacity 0.22s ease, transform 0.22s ease",
        pointerEvents: "none",
      }}
    >
      {item.icon && <span>{item.icon}</span>}
      {item.message}
    </div>
  );
}

export function ToastStack({ toasts, onRemove }: ToastStackProps) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignItems: "flex-end",
      }}
    >
      {toasts.map((t) => (
        <ToastEntry key={t.id} item={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, icon?: string) => {
    const id = _nextId++;
    setToasts((prev) => [...prev, { id, message, icon }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, push, remove };
}
