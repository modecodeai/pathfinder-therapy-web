import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export const dynamic = "force-static";

const routes = [
  "",
  "/approach",
  "/therapy",
  "/retreats",
  "/journal",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/crisis-support",
  "/faq"
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${site.url}${route}/`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.7
  }));
}
