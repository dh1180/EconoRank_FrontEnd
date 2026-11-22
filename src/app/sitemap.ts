import type { MetadataRoute } from "next";
import { api, type Country } from "@/lib/api";
import { WORLD_LOCALES } from "@/lib/locales";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let countries: Country[] = [];
  try {
    countries = await api<Country[]>("/countries");
  } catch {}
  const base = process.env.SITE_URL || "http://localhost:3000";
  const featured = WORLD_LOCALES.filter((l) => l.popular).map((l) => l.code);
  return featured.flatMap((lang) =>
    ["", "/compare", ...countries.map((c) => `/countries/${c.code}`)].map(
      (path) => ({
        url: `${base}/${lang}${path}`,
        alternates: {
          languages: Object.fromEntries(
            featured.map((code) => [code, `${base}/${code}${path}`]),
          ),
        },
      }),
    ),
  );
}
