import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";
import MyPage from "@/components/MyPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc = isLocale(lang) ? lang : "en";
  return buildPageMetadata({
    lang: loc,
    path: "/mypage",
    title:
      loc === "ko" ? "마이페이지" : loc === "ja" ? "マイページ" : "My Page",
    description:
      loc === "ko"
        ? "닉네임 변경, 내가 쓴 글·댓글, 좋아요 누른 글 관리"
        : "Manage your profile nickname, posts, comments, and liked discussions.",
    noIndex: true,
  });
}

export default async function MyPageRoute({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <MyPage lang={lang} />;
}
