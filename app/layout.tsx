import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { site } from "@/data/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Pathfinder Therapy | Find your bearings",
    template: "%s | Pathfinder Therapy"
  },
  description:
    "Private therapy in Lisbon and online. Creating the conditions in which people can understand themselves well enough to live more freely.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: site.url,
    siteName: site.name,
    title: "Pathfinder Therapy | Find your bearings",
    description: site.description,
    images: [
      {
        url: "/pathfinder-therapy-room.png",
        width: 1717,
        height: 916,
        alt: "Pathfinder Therapy room"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Pathfinder Therapy | Find your bearings",
    description: site.description,
    images: ["/pathfinder-therapy-room.png"]
  },
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
