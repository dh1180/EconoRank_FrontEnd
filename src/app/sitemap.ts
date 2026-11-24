import type { MetadataRoute } from "next";
import { api, type Country } from "@/lib/api";
import { SEO_LOCALES, siteOrigin } from "@/lib/seo";

export const dynamic = "force-dynamic";

const FALLBACK_COUNTRIES = [
  "USA",
  "CHN",
  "DEU",
  "JPN",
  "IND",
  "GBR",
  "FRA",
  "ITA",
  "BRA",
  "CAN",
  "RUS",
  "KOR",
  "AUS",
  "ESP",
  "MEX",
  "IDN",
  "NLD",
  "SAU",
  "TUR",
  "CHE",
  "TWN",
  "POL",
  "SGP",
  "VNM",
];

const COUNTRY_SITEMAP_LOCALES = ["en", "ko", "ja", "zh", "es", "fr", "de"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let countryCodes: string[] = [];
  try {
    const countries = await api<Country[]>("/countries");
    countryCodes = countries.map((c) => c.code);
  } catch {
    countryCodes = FALLBACK_COUNTRIES;
  }

  const base = siteOrigin();
  const now = new Date();

  const corePages: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }[] = [
    { path: "", changeFrequency: "daily", priority: 1.0 },
    { path: "/companies", changeFrequency: "hourly", priority: 0.95 },
    { path: "/compare", changeFrequency: "weekly", priority: 0.85 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const lang of SEO_LOCALES) {
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
              SEO_LOCALES.map((code) => [code, `${base}/${code}${page.path}`]),
            ),
          },
        },
      });
    }
  }

  for (const lang of COUNTRY_SITEMAP_LOCALES) {
    for (const code of countryCodes) {
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
              COUNTRY_SITEMAP_LOCALES.map((loc) => [
                loc,
                `${base}/${loc}${path}`,
              ]),
            ),
          },
        },
      });
    }
  }

  return entries;
}
