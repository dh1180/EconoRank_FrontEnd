import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc = isLocale(lang) ? lang : "en";
  return buildPageMetadata({
    lang: loc,
    path: "/terms",
    title:
      loc === "ko"
        ? "이용약관"
        : loc === "ja"
          ? "利用規約"
          : "Terms of Service",
    description:
      loc === "ko"
        ? "EconoRank 서비스 이용약관, 데이터 면책 조항 및 커뮤니티 운영 정책"
        : "EconoRank Terms of Service, macroeconomic/market-cap data disclaimers, and community guidelines.",
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const isKo = lang === "ko";
  const isJa = lang === "ja";

  return (
    <article className="panel legal-doc">
      <p className="eyebrow">ECONORANK · LEGAL</p>
      <h1>
        {isKo
          ? "이용약관"
          : isJa
            ? "利用規約"
            : "Terms of Service"}
      </h1>
      <p className="muted">
        {isKo
          ? "최종 업데이트: 2026년 11월 24일"
          : isJa
            ? "最終更新日: 2026年11月24日"
            : "Last updated: November 24, 2026"}
      </p>

      {isKo ? (
        <>
          <section>
            <h2>1. 서비스의 목적</h2>
            <p>
              EconoRank(https://econorank.com)는 IMF World Economic Outlook(WEO)의 국가 거시경제 지표(명목 GDP, 1인당 GDP, PPP GDP)와 글로벌 상장 기업의 시가총액 정보를 시각화하여 제공하고, 전 세계 이용자가 자유롭게 의견을 나눌 수 있는 정보 플랫폼입니다.
            </p>
          </section>

          <section>
            <h2>2. 데이터 출처 및 투자 면책</h2>
            <ul>
              <li>
                모든 국가 거시경제 수치는 IMF WEO 공식 발표 자료를 기반으로 하며, 추정·전망(Estimate/Forecast) 수치는 IMF의 향후 발표에 따라 수정될 수 있습니다.
              </li>
              <li>
                기업 시가총액 및 주가 정보는 외부 공개 시세 데이터를 일정 주기(캐시)로 갱신하여 표시하며, 실시간 체결가와 일부 시차가 있을 수 있습니다.
              </li>
              <li>
                <strong>본 서비스의 모든 정보는 참고 및 교육 목적이며, 어떠한 경우에도 투자 권유·금융 자문으로 해석될 수 없습니다.</strong> 투자 판단에 따른 책임은 이용자 본인에게 있습니다.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. 커뮤니티 이용 규칙</h2>
            <ul>
              <li>타인에 대한 혐오 표현, 욕설, 명예훼손, 허위사실 유포, 스팸·도배 및 개인정보 노출 게시물은 사전 통보 없이 숨김 또는 삭제될 수 있습니다.</li>
              <li>회원가입 시 접속 국가 기준으로 표시되는 국가는 변경할 수 없으며, VPN·프록시를 악용한 국적 위장은 금지됩니다.</li>
              <li>이용자가 작성한 게시물·댓글의 책임은 작성자 본인에게 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2>4. 약관 변경 및 문의</h2>
            <p>
              본 약관은 서비스 개선 및 법령 변경에 따라 수정될 수 있으며, 변경 사항은 본 페이지에 게시됩니다. 문의: <strong>mjdh1936@gmail.com</strong>
            </p>
          </section>
        </>
      ) : (
        <>
          <section>
            <h2>1. Purpose of Service</h2>
            <p>
              EconoRank (https://econorank.com) provides visualizations of official IMF World Economic Outlook (WEO) macroeconomic indicators (Nominal GDP, GDP per capita, PPP GDP), global public company market capitalizations, and a multilingual economic discussion board.
            </p>
          </section>

          <section>
            <h2>2. Data Disclaimer &amp; Not Financial Advice</h2>
            <ul>
              <li>
                Macroeconomic figures are sourced from official IMF WEO releases. Estimates and forecasts may be revised by the IMF in subsequent editions.
              </li>
              <li>
                Company market capitalization and share price figures are cached periodically from public market sources and may differ slightly from real-time exchange quotes.
              </li>
              <li>
                <strong>All content on EconoRank is provided for informational and educational purposes only and does not constitute investment or financial advice.</strong>
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Community Conduct</h2>
            <ul>
              <li>Spam, harassment, hate speech, doxxing, or illegal content may be hidden or removed without prior notice.</li>
              <li>Member country badges are permanently assigned at sign-up based on connection region; bypassing region detection via VPN/proxy is prohibited.</li>
              <li>Users are solely responsible for the content they publish.</li>
            </ul>
          </section>

          <section>
            <h2>4. Updates &amp; Contact</h2>
            <p>
              These terms may be updated periodically. Questions or moderation inquiries may be sent to <strong>mjdh1936@gmail.com</strong>.
            </p>
          </section>
        </>
      )}
    </article>
  );
}
