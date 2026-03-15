import type { Metadata } from "next";
import { Pacifico, DM_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const pacifico = Pacifico({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Hopscotch - City Explorer",
  description: "Explore cities, discover spots, build your route.",
};

const adSenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${pacifico.variable} ${dmSans.variable}`}>
        {children}
        {adSenseId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
