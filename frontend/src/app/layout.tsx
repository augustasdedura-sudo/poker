import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "6-max Texas Hold'em",
  description: "Play a simplified 6-max Texas Hold'em hand and save it to history.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
