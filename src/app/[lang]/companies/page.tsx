import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api, amount, type CompanyFeed } from "@/lib/api";
import { countryName } from "@/lib/geography";
import { dictionary, isLocale } from "@/lib/i18n";
import CountryFlag from "@/components/CountryFlag";
import CompanyLogo from "@/components/CompanyLogo";
import CompaniesExplorer from "@/components/CompaniesExplorer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title:
      lang === "ko"
        ? "전세계 실시간 기업 시가총액 순위"
        : "Global live company market cap rankings",
    alternates: {
      canonical: `/${lang}/companies`,
      languages: { en: "/en/companies", ko: "/ko/companies" },
    },
  };
}

export default async function CompaniesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = dictionary(lang);

  let feed: CompanyFeed | undefined;
  try {
    feed = await api<CompanyFeed>("/companies?limit=250");
  } catch {}

  const topFive = feed?.items.slice(0, 5) ?? [];
  const leaderCap = feed?.items[0]?.marketCap ?? 1;
  const top100Cap =
    feed?.items.slice(0, 100).reduce((sum, c) => sum + c.marketCap, 0) ?? 0;

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-badge">
            <span className="sync-dot" aria-hidden="true" />
            <span>
              {lang === "ko"
                ? "실시간 글로벌 시가총액 · 국가 거래소별 순위"
                : "LIVE GLOBAL MARKET CAP · BY STOCK EXCHANGE"}
            </span>
          </div>
          <h1>
            {lang === "ko" ? (
              <>
                <span className="headline-line">전 세계 기업 시가총액</span>
                <span className="headline-line hero-accent">실시간 순위.</span>
              </>
            ) : (
              <>
                World’s largest companies,{" "}
                <em className="hero-serif">ranked live.</em>
              </>
            )}
          </h1>
          <p className="lead">
            {lang === "ko"
              ? "애플, 마이크로소프트, 엔비디아, 삼성전자 등 전 세계 주요 상장 기업의 시가총액과 주가를 실시간으로 탐색하세요."
              : "Track real-time market capitalizations and share prices of the world’s largest public companies across every major exchange."}
          </p>
          <div className="hero-actions">
            <a className="button button-bright" href="#companies">
              {lang === "ko" ? "기업 순위 보기" : "Explore companies"}
            </a>
            <Link className="button button-glass" href={`/${lang}`}>
              {t.rankings} →
            </Link>
          </div>
        </div>

        <div
          className="hero-snapshot"
          aria-label={lang === "ko" ? "시가총액 상위 5개 기업" : "Top 5 companies by market cap"}
        >
          <div className="snapshot-head">
            <div>
              <span className="snapshot-kicker">
                {lang === "ko" ? "실시간 글로벌 TOP 5" : "LIVE GLOBAL TOP 5"}
              </span>
              <strong>{lang === "ko" ? "기업 시가총액" : "Market Cap"}</strong>
            </div>
            <span className="snapshot-pill">LIVE · US$</span>
          </div>
          {topFive.length > 0 ? (
            <ol className="snapshot-list">
              {topFive.map((c) => {
                const pct = Math.max(6, (c.marketCap / leaderCap) * 100);
                return (
                  <li key={`${c.rank}-${c.symbol}`}>
                    <a href="#companies" className="snapshot-row">
                      <div className="snapshot-row-top">
                        <span className="snapshot-country">
                          <span className={`snapshot-rank rank-${c.rank}`}>
                            {c.rank.toString().padStart(2, "0")}
                          </span>
                          <CompanyLogo symbol={c.symbol} name={c.name} size="sm" />
                          <span className="snapshot-code">{c.symbol}</span>
                          <span className="snapshot-name">{c.name}</span>
                        </span>
                        <span className="snapshot-val">
                          {amount(c.marketCap, lang)}
                        </span>
                      </div>
                      <div className="snapshot-track">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                    </a>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="snapshot-empty">
              <p>STAT / AGORA</p>
              <strong>Live Global Market Cap</strong>
            </div>
          )}
          <div className="snapshot-foot">
            <span>{feed?.source ?? "CompaniesMarketCap"}</span>
            <a href="#companies">
              {lang === "ko" ? "전체 기업 보기 ↓" : "All companies ↓"}
            </a>
          </div>
        </div>
      </section>

      <section className="stats" aria-label="Market cap summary">
        <div className="stat-card">
          <span className="stat-label">
            {lang === "ko" ? "전체 추적 글로벌 상장사" : "Global Listed Companies"}
          </span>
          <strong className="stat-value">
            {feed ? feed.total.toLocaleString() : "—"}
          </strong>
          <small className="stat-sub">
            {lang === "ko"
              ? `${feed?.exchanges?.length ?? 0}개 국가 거래소별 Top 100 지원`
              : `Top 100 across ${feed?.exchanges?.length ?? 0} national exchanges`}
          </small>
        </div>
        <div className="stat-card">
          <span className="stat-label">
            {lang === "ko" ? "글로벌 TOP 100 합산 시총" : "Top 100 Combined Cap"}
          </span>
          <strong className="stat-value">
            {top100Cap > 0 ? amount(top100Cap, lang) : "—"}
          </strong>
          <small className="stat-sub">
            {lang === "ko" ? "미국 달러 (US$) 기준" : "Current US dollars (US$)"}
          </small>
        </div>
        <div className="stat-card">
          <span className="stat-label">
            {lang === "ko" ? "글로벌 1위 기업" : "#1 Global Company"}
          </span>
          <strong className="stat-value source-stat">
            {feed?.items[0] ? (
              <>
                {feed.items[0].name} <small>{feed.items[0].symbol}</small>
              </>
            ) : (
              "—"
            )}
          </strong>
          <small className="stat-sub stat-live">
            <span className="sync-dot" aria-hidden="true" />
            {feed?.items[0]
              ? `${amount(feed.items[0].marketCap, lang)} US$ · ${
                  feed.items[0].countryCode
                    ? countryName(
                        feed.items[0].countryCode,
                        feed.items[0].country,
                        lang,
                      )
                    : feed.items[0].country
                }`
              : lang === "ko"
                ? "5분마다 자동 갱신"
                : "Auto-refreshed every 5 min"}
          </small>
        </div>
      </section>

      <section id="companies" className="panel rankings">
        <div className="section-head">
          <div>
            <p className="eyebrow">GLOBAL EQUITY RANKINGS · LIVE</p>
            <h2>
              {lang === "ko" ? "실시간 기업 시가총액 순위" : "Live Company Market Cap"}
            </h2>
          </div>
          <span className="unit-badge">LIVE · US$</span>
        </div>

        {!feed ? (
          <div className="panel-pad">
            <p className="notice" role="alert">
              {t.unavailable}
            </p>
          </div>
        ) : (
          <CompaniesExplorer initialFeed={feed} lang={lang} />
        )}
      </section>
    </>
  );
}
