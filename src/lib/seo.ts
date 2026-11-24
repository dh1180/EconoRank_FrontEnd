import type { Metadata } from "next";

export const SEO_LOCALES = [
  "en",
  "ko",
  "ja",
  "zh",
  "es",
  "fr",
  "de",
  "pt",
  "ru",
  "ar",
  "hi",
  "id",
  "vi",
  "th",
  "tr",
  "it",
  "nl",
  "pl",
  "uk",
] as const;

export function siteOrigin(): string {
  const raw = process.env.SITE_URL || "https://econorank.com";
  return raw.replace(/\/+$/, "");
}

export function buildAlternates(
  lang: string,
  path = "",
): NonNullable<Metadata["alternates"]> {
  const normalizedPath = path && !path.startsWith("/") ? `/${path}` : path;
  const languages: Record<string, string> = {
    "x-default": `/en${normalizedPath}`,
  };
  for (const code of SEO_LOCALES) {
    languages[code] = `/${code}${normalizedPath}`;
  }
  return {
    canonical: `/${lang}${normalizedPath}`,
    languages,
  };
}

export function buildPageMetadata({
  lang,
  path = "",
  title,
  description,
  keywords,
  noIndex = false,
}: {
  lang: string;
  path?: string;
  title: string;
  description: string;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const normalizedPath = path && !path.startsWith("/") ? `/${path}` : path;
  const url = `${siteOrigin()}/${lang}${normalizedPath}`;
  return {
    title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: buildAlternates(lang, normalizedPath),
    openGraph: {
      title: `${title} | EconoRank`,
      description,
      url,
      siteName: "EconoRank",
      type: "website",
      locale: lang,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "EconoRank · Global GDP & Live Company Market Cap Rankings",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | EconoRank`,
      description,
      images: ["/opengraph-image"],
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
