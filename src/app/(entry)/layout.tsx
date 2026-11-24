import type { Metadata } from "next";
import { siteOrigin } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: "EconoRank · Global economy, in perspective",
  description:
    "Explore IMF WEO GDP, GDP per capita, and PPP rankings, live global company market caps across 30+ stock exchanges, and country comparisons in 78 languages.",
};

export default function EntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3862816878614020"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
