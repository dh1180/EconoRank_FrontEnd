import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { isLocale, isRtl } from "@/lib/i18n";
import { siteOrigin } from "@/lib/seo";
import Shell from "@/components/Shell";
import JsonLd from "@/components/JsonLd";
import "../globals.css";

const rawGaId = process.env.NEXT_PUBLIC_GA_ID?.trim() ?? "";
const GA_ID = /^G-[A-Z0-9]+$/i.test(rawGaId) ? rawGaId : "";
const googleVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || undefined;
const naverVerification =
  process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION?.trim() || undefined;

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  applicationName: "EconoRank",
  title: {
    default: "EconoRank · Global economy, in perspective",
    template: "%s | EconoRank",
  },
  description:
    "Explore IMF WEO GDP, GDP per capita, and PPP rankings, live global company market caps across 30+ stock exchanges, and country comparisons in 78 languages.",
  keywords: [
    "EconoRank",
    "World GDP rankings",
    "GDP per capita",
    "PPP GDP",
    "IMF WEO",
    "Company market cap rankings",
    "세계 GDP 순위",
    "1인당 GDP",
    "기업 시가총액 순위",
  ],
  category: "finance",
  openGraph: {
    siteName: "EconoRank",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  ...(googleVerification || naverVerification
    ? {
        verification: {
          ...(googleVerification ? { google: googleVerification } : {}),
          ...(naverVerification
            ? { other: { "naver-site-verification": naverVerification } }
            : {}),
        },
      }
    : {}),
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const origin = siteOrigin();
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: "EconoRank",
        url: origin,
        logo: `${origin}/apple-icon.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: "EconoRank",
        url: origin,
        inLanguage: lang,
        publisher: { "@id": `${origin}/#organization` },
      },
    ],
  };
  return (
    <html lang={lang} dir={isRtl(lang) ? "rtl" : "ltr"}>
      <body>
        <JsonLd data={siteJsonLd} />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
        <Shell lang={lang}>{children}</Shell>
      </body>
    </html>
  );
}
