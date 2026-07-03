import type { Metadata } from "next";
import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { LeadAttributionCapture } from "@/components/LeadAttributionCapture";
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
        <Analytics />
        <LeadAttributionCapture />
        {children}
        <Footer />
      </body>
    </html>
  );
}
