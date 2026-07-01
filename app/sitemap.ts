import type { MetadataRoute } from "next";
import { site, sitemapRoutes } from "@/data/site";
import { canonicalUrl } from "@/lib/metadata";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapRoutes.map(({ path, priority }) => ({
    url: canonicalUrl(path),
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority
  }));
}
