import type { Metadata } from "next";
import Link from "next/link";
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
    path: "/about",
    title:
      loc === "ko"
        ? "서비스 소개 및 데이터 출처"
        : loc === "ja"
          ? "EconoRankについて"
          : "About EconoRank",
    description:
      loc === "ko"
        ? "EconoRank 소개, IMF WEO 및 글로벌 시가총액 데이터 출처 안내, 운영자 문의"
        : "About EconoRank, our IMF WEO and global equity market cap methodology, and contact details.",
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const isKo = lang === "ko";

  return (
    <article className="panel legal-doc">
      <p className="eyebrow">ECONORANK · ABOUT</p>
      <h1>{isKo ? "EconoRank 소개 및 데이터 출처" : "About EconoRank"}</h1>

      {isKo ? (
        <>
          <section>
            <h2>세계 경제를 더 선명하게</h2>
            <p>
              <strong>EconoRank</strong>는 전 세계 190개 이상 공식 경제권의 거시경제 순위와 11,000개 이상 글로벌 상장 기업의 시가총액을 한곳에서 투명하게 비교할 수 있도록 만든 독립 데이터 플랫폼입니다.
            </p>
          </section>
          <section>
            <h2>데이터 출처 및 원칙</h2>
            <ul>
              <li>
                <strong>국가 거시경제(명목 GDP · 1인당 GDP · PPP GDP)</strong>: 국제통화기금(IMF) World Economic Outlook (WEO) 공식 데이터. 실적(Actual)과 전망(Estimate/Forecast)을 항상 구분하여 표기하며 결측값은 임의로 추정하지 않습니다.
              </li>
              <li>
                <strong>글로벌 기업 시가총액</strong>: 전 세계 30개 이상 주요 증권거래소(NYSE, NASDAQ, KRX, TSE, HKEX, LSE, XETRA 등) 상장사의 시가총액 및 주가를 15분 캐시 주기로 제공합니다.
              </li>
              <li>
                <strong>78개 언어 &amp; 글로벌 커뮤니티</strong>: 언어 장벽 없이 경제 지표를 근거로 토론할 수 있도록 78개 언어 인터페이스, 지표 카드 임베드, 온디맨드 번역 기능을 제공합니다.
              </li>
            </ul>
          </section>
          <section>
            <h2>문의 및 정책</h2>
            <p>
              데이터 오류 제보, 기능 제안 및 제휴 문의: <strong>mjdh1936@gmail.com</strong>
            </p>
            <p>
              <Link href={`/${lang}/privacy`}>개인정보처리방침</Link> ·{" "}
              <Link href={`/${lang}/terms`}>이용약관</Link>
            </p>
          </section>
        </>
      ) : (
        <>
          <section>
            <h2>A Clearer View of the Global Economy</h2>
            <p>
              <strong>EconoRank</strong> is an independent economic intelligence platform bringing together official IMF World Economic Outlook (WEO) country rankings and live global public company market capitalizations in 78 languages.
            </p>
          </section>
          <section>
            <h2>Data Sources &amp; Methodology</h2>
            <ul>
              <li>
                <strong>Macroeconomic Indicators (Nominal GDP, GDP per capita, PPP GDP)</strong>: Sourced exclusively from official IMF World Economic Outlook releases, clearly separating historical actuals from estimates and forecasts. Missing values are never fabricated.
              </li>
              <li>
                <strong>Global Company Market Cap</strong>: Tracks 11,000+ public companies across 30+ national stock exchanges and 7 world regions with a 15-minute on-demand cache.
              </li>
              <li>
                <strong>Global Community</strong>: Embed live GDP and market-cap stat cards directly in discussions with optional on-demand translation.
              </li>
            </ul>
          </section>
          <section>
            <h2>Contact &amp; Legal</h2>
            <p>
              Feedback, data corrections, or inquiries: <strong>mjdh1936@gmail.com</strong>
            </p>
            <p>
              <Link href={`/${lang}/privacy`}>Privacy Policy</Link> ·{" "}
              <Link href={`/${lang}/terms`}>Terms of Service</Link>
            </p>
          </section>
        </>
      )}
    </article>
  );
}
