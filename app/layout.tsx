import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CrateDesk — the buying desk for collectibles dealers",
  description: "Your Claude identifies and prices collectibles. CrateDesk runs your sourcing pipeline, margins and public buy-list.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
