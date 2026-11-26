import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Santa's Christmas Draw 2026 — 23 Days of Christmas Magic",
  description:
    "The official Christmas lucky draw of the office: 23 days, 17 working days, 20 participants and 60 selections — revealed three or four names a day.",
};

export const viewport: Viewport = {
  themeColor: "#173D32",
  width: "device-width",
  initialScale: 1,
};

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap";

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
