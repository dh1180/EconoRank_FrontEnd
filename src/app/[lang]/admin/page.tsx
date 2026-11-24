import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";
import AdminDashboard from "@/components/AdminDashboard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc = isLocale(lang) ? lang : "en";
  return buildPageMetadata({
    lang: loc,
    path: "/admin",
    title: loc === "ko" ? "관리자" : loc === "ja" ? "管理パネル" : "Admin",
    description:
      loc === "ko"
        ? "EconoRank 관리자 대시보드 — 회원, 게시글, 댓글, 신고 및 시스템 관리"
        : "EconoRank Admin Dashboard — Manage members, posts, comments, reports, and data caches.",
    noIndex: true,
  });
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <AdminDashboard lang={lang} />;
}
