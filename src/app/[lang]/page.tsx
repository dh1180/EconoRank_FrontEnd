import { countryName } from "@/lib/geography";
import Provenance, { statusName } from "@/components/Provenance";
import CountryFlag from "@/components/CountryFlag";
import RankingsExplorer from "@/components/RankingsExplorer";
import Link from "next/link";
import type { Metadata } from "next";
import { isLocale, dictionary } from "@/lib/i18n";
import {
  api,
  metricAmount,
  integer,
  metricOf,
  metrics,
  type Ranking,
  type RankingPage,
} from "@/lib/api";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title:
      lang === "ko"
        ? "세계 GDP·1인당 GDP·PPP 순위"
        : "World GDP, GDP per capita & PPP rankings",
    alternates: { canonical: `/${lang}`, languages: { en: "/en", ko: "/ko" } },
    openGraph: { title: "StatAgora · Global economic rankings (IMF WEO)" },
  };
}

export default async function Rankings({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = dictionary(lang);
  const query = await searchParams;
  const metric = metricOf(query.indicator);
  let year = query.year
    ? integer(query.year, new Date().getUTCFullYear(), 1960, 2100)
    : undefined;
  let data: RankingPage | undefined;
  let allItems: Ranking[] = [];
  let years: number[] = [];
  let checkedAt: string | undefined;
  try {
    const yearParam = year ? `&year=${year}` : "";
    const [page0, page1, fetchedYears] = await Promise.all([
      api<RankingPage>(
        `/rankings?indicator=${metric}&source=imf${yearParam}&page=0&size=100`,
      ),
      api<RankingPage>(
        `/rankings?indicator=${metric}&source=imf${yearParam}&page=1&size=100`,
      ),
      api<number[]>(`/years?indicator=${metric}&source=imf`),
    ]);
    data = page0;
    allItems = [...page0.items, ...page1.items];
    years = fetchedYears;
    year = data.year;
    const status = await api<{
      sources: { provider: string; checkedAt: string }[];
    }>("/data/status");
    checkedAt = status.sources.find((s) => s.provider === "imf")?.checkedAt;
  } catch {}

  const topFive = allItems.slice(0, 5);
  const topLeaderValue = allItems[0]?.value ?? 1;
  const unitLabel = metric === "ppp" ? "Int$" : "US$";

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-badge">
            <span className="sync-dot" aria-hidden="true" />
            <span>{t.eyebrow}</span>
          </div>
          <h1>
            {lang === "ko" ? (
              <>
                <span className="headline-line">세계 경제를 보는</span>
                <span className="headline-line hero-accent">더 선명한 시선.</span>
              </>
            ) : lang === "en" ? (
              <>
                A clearer view of the{" "}
                <em className="hero-serif">global economy.</em>
              </>
            ) : (
              t.headline
            )}
          </h1>
          <p className="lead">{t.intro}</p>
          <div className="hero-actions">
            <a className="button button-bright" href="#rankings">
              {t.view}
            </a>
            <Link className="button button-glass" href={`/${lang}/compare`}>
              {t.compare} →
            </Link>
          </div>
        </div>

        <div
          className="hero-snapshot"
          aria-label={lang === "ko" ? "상위 5개국 요약" : "Top 5 economies snapshot"}
        >
          <div className="snapshot-head">
            <div>
              <span className="snapshot-kicker">
                {lang === "ko" ? "실시간 리더보드" : "LIVE LEADERBOARD"}
              </span>
              <strong>{t[metric]}</strong>
            </div>
            <span className="snapshot-pill">
              {year ?? "—"} · {unitLabel}
            </span>
          </div>
          {topFive.length > 0 ? (
            <ol className="snapshot-list">
              {topFive.map((row) => {
                const pct = Math.max(4, (row.value / topLeaderValue) * 100);
                return (
                  <li key={row.code}>
                    <Link
                      href={`/${lang}/countries/${row.code}`}
                      className="snapshot-row"
                    >
                      <div className="snapshot-row-top">
                        <span className="snapshot-country">
                          <span className={`snapshot-rank rank-${row.rank}`}>
                            {row.rank.toString().padStart(2, "0")}
                          </span>
                          <CountryFlag code={row.code} size="sm" />
                          <span className="snapshot-code">{row.code}</span>
                          <span className="snapshot-name">
                            {countryName(row.code, row.name, lang)}
                          </span>
                        </span>
                        <span className="snapshot-val">
                          {metricAmount(row.value, metric, lang)}
                        </span>
                      </div>
                      <div className="snapshot-track">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="snapshot-empty">
              <p>STAT / AGORA</p>
              <strong>IMF World Economic Outlook (WEO)</strong>
            </div>
          )}
          <div className="snapshot-foot">
            <span>IMF WEO</span>
            <a href="#rankings">
              {lang === "ko" ? "전체 순위 보기 ↓" : "Full rankings ↓"}
            </a>
          </div>
        </div>
      </section>

      <section className="stats" aria-label={t.coverage}>
        <div className="stat-card">
          <span className="stat-label">{t.countries}</span>
          <strong className="stat-value">{data?.total ?? "—"}</strong>
          <small className="stat-sub">
            {lang === "ko"
              ? "지역 합계 제외 · 공식 경제권"
              : "Official economies · aggregates excluded"}
          </small>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t.year}</span>
          <strong className="stat-value">{year ?? "—"}</strong>
          <small className="stat-sub">
            {allItems[0]
              ? statusName(allItems[0].status, lang)
              : lang === "ko"
                ? "최신 제공 연도"
                : "Latest available year"}
          </small>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t.source}</span>
          <strong className="stat-value source-stat">
            IMF <small>WEO</small>
          </strong>
          <small className="stat-sub stat-live">
            <span className="sync-dot" aria-hidden="true" />
            {lang === "ko"
              ? "매일 1회 IMF 공식 발표 자동 확인"
              : "IMF WEO auto-checked daily"}
          </small>
        </div>
      </section>

      <section id="rankings" className="panel rankings">
        <div className="section-head">
          <div>
            <p className="eyebrow">ECONOMIC EXPLORER · IMF WEO</p>
            <h2>{t.rankings}</h2>
          </div>
          <form className="inline-form">
            <input type="hidden" name="indicator" value={metric} />
            <label htmlFor="year">{t.year}</label>
            <select id="year" name="year" defaultValue={year}>
              {[...new Set([...(year ? [year] : []), ...years])]
                .sort((a, b) => b - a)
                .map((y) => (
                  <option key={y}>{y}</option>
                ))}
            </select>
            <button className="small-button" type="submit">
              {t.refresh}
            </button>
          </form>
        </div>

        <div className="tabs-bar">
          <div className="tabs" role="navigation" aria-label={t.rankings}>
            {metrics.map((m) => (
              <Link
                key={m}
                className={m === metric ? "active" : ""}
                aria-current={m === metric ? "page" : undefined}
                href={`/${lang}?indicator=${m}${year ? `&year=${year}` : ""}#rankings`}
              >
                {t[m]}
              </Link>
            ))}
          </div>
          {data && (
            <span className="unit-badge">
              {year} · {unitLabel}
            </span>
          )}
        </div>

        {!data ? (
          <div className="panel-pad">
            <p className="notice" role="alert">
              {t.unavailable}
            </p>
          </div>
        ) : (
          <RankingsExplorer
            key={`${metric}-${year}-${lang}`}
            items={allItems}
            metric={metric}
            year={year ?? new Date().getUTCFullYear()}
            lang={lang}
          />
        )}

        {data && (
          <Provenance items={data.items} lang={lang} checkedAt={checkedAt} />
        )}
      </section>

      <section className="community-banner">
        <div>
          <p className="eyebrow">THE AGORA</p>
          <h2>{t.discussion}</h2>
          <p>{t.discussionText}</p>
        </div>
        <Link className="button button-bright" href={`/${lang}/community`}>
          {t.join} →
        </Link>
      </section>
    </>
  );
}
