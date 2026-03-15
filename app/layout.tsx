import type { Metadata } from "next";
import { Pacifico, DM_Sans } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${pacifico.variable} ${dmSans.variable}`}>
        {children}
      </body>
    </html>
  );
}
