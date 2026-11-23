import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, isRtl } from "@/lib/i18n";
import Shell from "@/components/Shell";
import "../globals.css";

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
        <Shell lang={lang}>{children}</Shell>
      </body>
    </html>
  );
}
