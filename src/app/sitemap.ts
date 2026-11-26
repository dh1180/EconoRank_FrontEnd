import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Focused, high-signal sitemap for fast indexing on a new domain.
 * Avoids flooding crawl budget with 1,500+ low-volume or English-duplicate legal pages.
 */
const CORE_SITEMAP_LOCALES = ["en", "ko", "ja", "zh", "es", "fr", "de"] as const;
const COUNTRY_SITEMAP_LOCALES = ["en", "ko", "ja"] as const;

const TOP_COUNTRIES = [
  "USA", "CHN", "DEU", "JPN", "IND", "GBR", "FRA", "ITA", "BRA", "CAN",
  "KOR", "RUS", "AUS", "ESP", "MEX", "IDN", "NLD", "SAU", "TUR", "CHE",
  "TWN", "POL", "SGP", "VNM", "SWE", "BEL", "NOR", "ARG", "THA", "ARE",
  "ISR", "IRL", "AUT", "MYS", "PHL", "DNK", "HKG", "COL", "ZAF", "CHL",
  "FIN", "CZE", "ROU", "PRT", "NZL", "PER", "GRC", "KAZ", "HUN", "UKR",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteOrigin();
  const now = new Date();

  const corePages: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }[] = [
    { path: "", changeFrequency: "daily", priority: 1.0 },
    { path: "/companies", changeFrequency: "hourly", priority: 0.95 },
    { path: "/compare", changeFrequency: "weekly", priority: 0.9 },
    { path: "/community", changeFrequency: "daily", priority: 0.8 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const lang of CORE_SITEMAP_LOCALES) {
    for (const page of corePages) {
      entries.push({
        url: `${base}/${lang}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: {
            "x-default": `${base}/en${page.path}`,
            ...Object.fromEntries(
              CORE_SITEMAP_LOCALES.map((code) => [code, `${base}/${code}${page.path}`]),
            ),
          },
        },
      });
    }
  }

  for (const lang of COUNTRY_SITEMAP_LOCALES) {
    entries.push({
      url: `${base}/${lang}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: {
        languages: {
          "x-default": `${base}/en/about`,
          ...Object.fromEntries(
            COUNTRY_SITEMAP_LOCALES.map((code) => [code, `${base}/${code}/about`]),
          ),
        },
      },
    });
  }

  for (const lang of COUNTRY_SITEMAP_LOCALES) {
    for (const code of TOP_COUNTRIES) {
      const path = `/countries/${code}`;
      entries.push({
        url: `${base}/${lang}${path}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: {
          languages: {
            "x-default": `${base}/en${path}`,
            ...Object.fromEntries(
              COUNTRY_SITEMAP_LOCALES.map((loc) => [loc, `${base}/${loc}${path}`]),
            ),
          },
        },
      });
    }
  }

  return entries;
}
