import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { site } from "@/data/site";
import { createPageMetadata } from "@/lib/metadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  ...createPageMetadata("/"),
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
