import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api, amount, type CompanyFeed } from "@/lib/api";
import { countryName } from "@/lib/geography";
import { dictionary, isLocale } from "@/lib/i18n";
import { buildPageMetadata, siteOrigin } from "@/lib/seo";
import CountryFlag from "@/components/CountryFlag";
import CompanyLogo from "@/components/CompanyLogo";
import CompaniesExplorer from "@/components/CompaniesExplorer";
import JsonLd from "@/components/JsonLd";

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
    path: "/companies",
    title: `${t.companies} · ${t.marketCap}`,
    description: t.companiesLead,
    keywords: [t.companies, t.marketCap, "NASDAQ", "NYSE", "KRX", "EconoRank"],
  });
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
  const origin = siteOrigin();
  const companiesJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Dataset",
        name: `${t.companies} · ${t.marketCap} — EconoRank`,
        description: t.companiesLead,
        url: `${origin}/${lang}/companies`,
        inLanguage: lang,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "EconoRank", item: `${origin}/${lang}` },
          { "@type": "ListItem", position: 2, name: t.companies, item: `${origin}/${lang}/companies` },
        ],
      },
      ...(feed && feed.items.length > 0
        ? [
            {
              "@type": "ItemList",
              name: `${t.globalTop250} — ${t.marketCap}`,
              numberOfItems: Math.min(10, feed.items.length),
              itemListElement: feed.items.slice(0, 10).map((c) => ({
                "@type": "ListItem",
                position: c.rank,
                name: `${c.name} (${c.symbol})`,
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <JsonLd data={companiesJsonLd} />
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-badge">
            <span className="sync-dot" aria-hidden="true" />
            <span>{t.companiesBadge}</span>
          </div>
          <h1>
            {lang === "ko" ? (
              <>
                <span className="headline-line">전 세계 기업 시가총액</span>
                <span className="headline-line hero-accent">실시간 순위.</span>
              </>
            ) : lang === "en" ? (
              <>
                World’s largest companies,{" "}
                <em className="hero-serif">ranked live.</em>
              </>
            ) : (
              t.companiesHeadline
            )}
          </h1>
          <p className="lead">{t.companiesLead}</p>
          <div className="hero-actions">
            <a className="button button-bright" href="#companies">
              {t.exploreCompanies}
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
              <strong>{t.marketCap}</strong>
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
              <p>ECONO / RANK</p>
              <strong>Live Global Market Cap</strong>
            </div>
          )}
          <div className="snapshot-foot">
            <span>{feed?.source ?? "CompaniesMarketCap"}</span>
            <a href="#companies">{t.allCompanies} ↓</a>
          </div>
        </div>
      </section>

      <section className="stats" aria-label={t.marketCap}>
        <div className="stat-card">
          <span className="stat-label">{t.listedCompanies}</span>
          <strong className="stat-value">
            {feed ? feed.total.toLocaleString() : "—"}
          </strong>
          <small className="stat-sub">
            {t.byExchange} ({feed?.exchanges?.length ?? 0})
          </small>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t.top100Cap}</span>
          <strong className="stat-value">
            {top100Cap > 0 ? amount(top100Cap, lang) : "—"}
          </strong>
          <small className="stat-sub">US$</small>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t.topCompany}</span>
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
            <h2>{t.companies} · {t.marketCap}</h2>
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
