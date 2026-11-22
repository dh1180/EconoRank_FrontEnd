import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, dictionary } from "@/lib/i18n";
import Community from "@/components/Community";
import { api, type Country } from "@/lib/api";
export const metadata: Metadata = {
  title: "Community",
  robots: { index: false, follow: true },
};
export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ space?: string; post?: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = dictionary(lang);
  const q = await searchParams;
  let countries: Country[] = [];
  try {
    countries = await api<Country[]>("/countries");
  } catch {}
  const space =
    q.space && /^country-[A-Z]{3}$/.test(q.space) ? q.space : "global";
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">THE AGORA</p>
        <h1>{t.discussion}</h1>
        <p className="lead">{t.discussionText}</p>
      </section>
      <Community
        lang={lang}
        countries={countries}
        initialSpace={space}
        initialPost={q.post || null}
      />
    </>
  );
}
