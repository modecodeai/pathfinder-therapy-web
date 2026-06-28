import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pathfinder Therapy | Find Your Bearings",
  description:
    "Pathfinder Therapy creates the conditions in which people can understand themselves well enough to live more freely.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
