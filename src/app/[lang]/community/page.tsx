import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, dictionary } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";
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
  const t = dictionary(lang);
  const q = await searchParams;
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">ECONORANK COMMUNITY</p>
        <h1>{t.discussion}</h1>
        <p className="lead">{t.discussionText}</p>
      </section>
      <Community
        lang={lang}
        initialPost={q.post || null}
        initialAttach={q.attach || null}
      />
    </>
  );
}
