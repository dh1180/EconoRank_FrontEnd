import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { isLocale, isRtl } from "@/lib/i18n";
import Shell from "@/components/Shell";
import "../globals.css";

const rawGaId = process.env.NEXT_PUBLIC_GA_ID?.trim() ?? "";
const GA_ID = /^G-[A-Z0-9]+$/i.test(rawGaId) ? rawGaId : "";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "EconoRank · Global economy, in perspective",
    template: "%s | EconoRank",
  },
  description:
    "Explore IMF WEO GDP, GDP per capita, and PPP rankings, compare countries, and join the global economic conversation.",
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
  return (
    <html lang={lang} dir={isRtl(lang) ? "rtl" : "ltr"}>
      <body>
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
