"use client";

interface Props {
  onClose: () => void;
}

const STEPS = [
  {
    num: "1",
    title: "Search a city",
    desc: "Type any city name to load nearby spots onto the map.",
  },
  {
    num: "2",
    title: "Filter by vibe",
    desc: "Use the chips - Historical, Food & Drink, Nightlife, etc. - to show only the types of places you want.",
  },
  {
    num: "3",
    title: "Build your list",
    desc: "Click + on any card in Browse to add a spot to My List. Drag to reorder. Up to 15 spots.",
  },
  {
    num: "4",
    title: "Start Route",
    desc: "Once you have 2+ spots, hit Start Route. Pick where you begin - a spot on your list or your current location.",
  },
  {
    num: "5",
    title: "Hop!",
    desc: "Each step shows your 3 nearest next stops. Pick one, keep going. An AI suggestion appears too - add it on the fly if it looks good.",
  },
  {
    num: "6",
    title: "Share",
    desc: "Finish your route to get a shareable link, a Google Maps itinerary, or a plain-text copy of your day.",
  },
];

export default function HelpModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,10,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto"
        style={{
          background: "var(--sidebar-bg)",
          border: "1px solid var(--border)",
          boxShadow: "0 0 60px rgba(0,240,255,0.06)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2
              className="text-xl leading-none"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--accent)",
                textShadow: "0 0 16px rgba(0,240,255,0.3)",
              }}
            >
              Hopspot
            </h2>
            <p
              className="mt-1 text-xs font-medium"
              style={{
                color: "var(--muted)",
                letterSpacing: "0.18em",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              HOW IT WORKS
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--border)", color: "var(--muted)" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Intro */}
        <p
          className="px-5 pt-4 pb-2 text-sm leading-relaxed"
          style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
        >
          Plan a walking route through any city - one hop at a time.
        </p>

        {/* Steps */}
        <div className="px-5 pb-5 flex flex-col gap-3 mt-1">
          {STEPS.map((step) => (
            <div key={step.num} className="flex gap-3">
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                style={{
                  background: "var(--accent-dim)",
                  color: "var(--accent)",
                  border: "1px solid rgba(0,240,255,0.2)",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                {step.num}
              </div>
              <div>
                <p
                  className="text-sm font-semibold leading-snug"
                  style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}
                >
                  {step.title}
                </p>
                <p
                  className="text-xs leading-relaxed mt-0.5"
                  style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
