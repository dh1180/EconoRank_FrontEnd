import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, dictionary } from "@/lib/i18n";
import Community from "@/components/Community";

export const metadata: Metadata = {
  title: "Community",
  robots: { index: false, follow: true },
};

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
        <p className="eyebrow">THE GLOBAL AGORA</p>
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
