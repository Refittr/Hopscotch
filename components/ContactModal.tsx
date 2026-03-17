"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  onClose: () => void;
}

export default function ContactModal({ onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (!message.trim()) e.message = "Message is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    const { error } = await supabase
      .from("contact_messages")
      .insert({ name: name.trim(), email: email.trim(), message: message.trim() });
    setStatus(error ? "error" : "success");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--input-bg)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "10px 12px",
    color: "var(--foreground)",
    fontFamily: "var(--font-dm-sans)",
    fontSize: "14px",
    outline: "none",
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[190]"
        style={{
          background: "rgba(10,10,10,0.6)",
          backdropFilter: "blur(3px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.28s ease",
        }}
        onClick={handleClose}
      />
      <div
        className="fixed left-0 right-0 bottom-0 z-[200] flex flex-col rounded-t-2xl"
        style={{
          background: "var(--sidebar-bg)",
          border: "1px solid var(--border)",
          borderBottom: "none",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
          maxHeight: "90vh",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "var(--border)" }} />
        </div>

        <div
          className="flex items-center justify-between px-5 pt-3 pb-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2 className="text-xl leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--accent)", textShadow: "0 0 16px rgba(0,240,255,0.3)" }}>
              Hopspot
            </h2>
            <p className="mt-1 text-xs font-medium" style={{ color: "var(--muted)", letterSpacing: "0.18em", fontFamily: "var(--font-dm-sans)" }}>
              GET IN TOUCH
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--border)", color: "var(--muted)" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5">
          {status === "success" ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--accent-dim)", border: "1px solid rgba(0,240,255,0.2)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L19 7" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-base font-semibold text-center" style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}>
                Thanks, we&apos;ll be in touch!
              </p>
              <button
                onClick={handleClose}
                className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "var(--accent-dim)", border: "1px solid rgba(0,240,255,0.2)", color: "var(--accent)", fontFamily: "var(--font-dm-sans)" }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", fontFamily: "var(--font-dm-sans)", marginBottom: "6px" }}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                  placeholder="Your name"
                  style={{ ...inputStyle, borderColor: errors.name ? "#f87171" : undefined }}
                />
                {errors.name && <p style={{ fontSize: "11px", color: "#f87171", fontFamily: "var(--font-dm-sans)", marginTop: "4px" }}>{errors.name}</p>}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", fontFamily: "var(--font-dm-sans)", marginBottom: "6px" }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  placeholder="you@example.com"
                  style={{ ...inputStyle, borderColor: errors.email ? "#f87171" : undefined }}
                />
                {errors.email && <p style={{ fontSize: "11px", color: "#f87171", fontFamily: "var(--font-dm-sans)", marginTop: "4px" }}>{errors.email}</p>}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", fontFamily: "var(--font-dm-sans)", marginBottom: "6px" }}>Message</label>
                <textarea
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); setErrors((p) => ({ ...p, message: undefined })); }}
                  placeholder="What's on your mind?"
                  rows={4}
                  style={{ ...inputStyle, resize: "none", borderColor: errors.message ? "#f87171" : undefined }}
                />
                {errors.message && <p style={{ fontSize: "11px", color: "#f87171", fontFamily: "var(--font-dm-sans)", marginTop: "4px" }}>{errors.message}</p>}
              </div>

              {status === "error" && (
                <p className="text-sm text-center px-3 py-2 rounded-lg" style={{ color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontFamily: "var(--font-dm-sans)" }}>
                  Something went wrong — please try again.
                </p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{
                  background: status === "submitting" ? "var(--border)" : "var(--accent)",
                  color: status === "submitting" ? "var(--muted)" : "#0a0a0a",
                  fontFamily: "var(--font-dm-sans)",
                  letterSpacing: "0.06em",
                  cursor: status === "submitting" ? "not-allowed" : "pointer",
                  boxShadow: status === "submitting" ? "none" : "0 0 20px rgba(0,240,255,0.25)",
                }}
              >
                {status === "submitting" ? "Sending…" : "Send Message"}
              </button>
              <div style={{ height: "8px" }} />
            </form>
          )}
        </div>
      </div>
    </>
  );
}
