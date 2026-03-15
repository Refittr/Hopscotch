"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const MIN_HEIGHT: Record<string, number> = {
  horizontal: 60,
  rectangle: 250,
};

interface Props {
  slot: string;
  format?: "horizontal" | "rectangle";
}

export default function AdUnit({ slot, format = "horizontal" }: Props) {
  const pushed = useRef(false);
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  useEffect(() => {
    if (!publisherId || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense script not yet loaded — harmless, auto-pushes when it loads
    }
  }, [publisherId]);

  if (!publisherId) return null;

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", minHeight: MIN_HEIGHT[format] ?? 90 }}
      data-ad-client={publisherId}
      data-ad-slot={slot}
      data-ad-format={format === "rectangle" ? "rectangle" : "auto"}
      data-full-width-responsive="true"
    />
  );
}
