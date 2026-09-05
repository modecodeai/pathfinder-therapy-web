import type { Metadata } from "next";
import { site } from "@/data/site";

export function canonicalUrl(path: string): string {
  if (path === "/") {
    return `${site.url}/`;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${site.url}${normalized.endsWith("/") ? normalized : `${normalized}/`}`;
}

export function createPageMetadata(path: string, title?: string, description?: string): Metadata {
  const pageTitle = title ?? site.title;
  const pageDescription = description ?? site.description;
  const url = canonicalUrl(path);

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url,
      siteName: site.name,
      locale: "en_GB",
      type: "website",
      images: [
        {
          url: site.ogImage,
          alt: site.ogImageAlt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [site.ogImage]
    }
  };
}
