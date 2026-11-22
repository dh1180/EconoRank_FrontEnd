import type { MetadataRoute } from "next";
import { api, type Country } from "@/lib/api";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let countries: Country[] = [];
  try {
    countries = await api<Country[]>("/countries");
  } catch {}
  const base = process.env.SITE_URL || "http://localhost:3000";
  return ["en", "ko"].flatMap((lang) =>
    ["", "/compare", ...countries.map((c) => `/countries/${c.code}`)].map(
      (path) => ({
        url: `${base}/${lang}${path}`,
        alternates: {
          languages: { en: `${base}/en${path}`, ko: `${base}/ko${path}` },
        },
      }),
    ),
  );
}
