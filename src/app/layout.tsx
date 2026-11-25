import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Santa's Christmas Draw 2026 — 21 Days of Christmas Magic",
  description:
    "The official Christmas lucky draw of the office: 21 days, 15 working days, 20 participants and 60 selections — revealed four names at a time.",
};

export const viewport: Viewport = {
  themeColor: "#173D32",
  width: "device-width",
  initialScale: 1,
};

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Jost:wght@300;400;500;600&display=swap";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONT_HREF} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
