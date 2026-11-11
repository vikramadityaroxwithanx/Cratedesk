import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RetroRadar — sourcing board for retro collectors",
  description: "Your Claude finds and prices retro consoles. RetroRadar keeps the board, the price history and your public want-list.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
