import type { Metadata } from "next"; import "./globals.css"; import { Header } from "@/components/Header"; import { Footer } from "@/components/Footer"; import { site } from "@/data/site";
export const metadata: Metadata = { title: { default: "Pathfinder Therapy | Find your bearings", template: "%s | Pathfinder Therapy" }, description: site.description };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-GB"><body><Header/>{children}<Footer/></body></html>}
