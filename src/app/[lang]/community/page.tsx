import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, dictionary } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";
import { api, type CompanyFeed, type RankingPage } from "@/lib/api";
import Community from "@/components/Community";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc = isLocale(lang) ? lang : "en";
  const t = dictionary(loc);
  return buildPageMetadata({
    lang: loc,
    path: "/community",
    title: t.community,
    description: t.discussionText,
    noIndex: true,
  });
}

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ post?: string; attach?: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const q = await searchParams;

  let topCompanies: CompanyFeed["items"] = [];
  let topGdp: RankingPage["items"] = [];
  let gdpYear = new Date().getUTCFullYear();

  try {
    const [companiesRes, gdpRes] = await Promise.all([
      api<CompanyFeed>("/companies?limit=5"),
      api<RankingPage>("/rankings?indicator=gdp&source=imf&page=0&size=5"),
    ]);
    topCompanies = companiesRes.items ?? [];
    topGdp = gdpRes.items ?? [];
    if (gdpRes.year) gdpYear = gdpRes.year;
  } catch {}

  return (
    <Community
      lang={lang}
      initialPost={q.post || null}
      initialAttach={q.attach || null}
      topCompanies={topCompanies}
      topGdp={topGdp}
      gdpYear={gdpYear}
    />
  );
}
