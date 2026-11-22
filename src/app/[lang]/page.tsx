import { countryName, regionName } from "@/lib/geography";
import Provenance, { statusName } from "@/components/Provenance";
import SourceSelect from "@/components/SourceSelect";
import Link from "next/link";
import type { Metadata } from "next";
import { isLocale, dictionary } from "@/lib/i18n";
import {
  api,
  amount,
  fullAmount,
  integer,
  metricOf,
  metrics,
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
        ? "세계 GDP·PPP·수출 순위"
        : "World GDP, PPP & export rankings",
    alternates: { canonical: `/${lang}`, languages: { en: "/en", ko: "/ko" } },
    openGraph: { title: "StatAgora · Global economic rankings" },
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
  const metric = metricOf(query.indicator),
    page = integer(query.page, 0, 0, 10000);
  const source =
    metric === "exports"
      ? "worldbank"
      : ["auto", "imf", "worldbank"].includes(query.source || "")
        ? query.source!
        : "auto";
  let year = query.year
    ? integer(query.year, new Date().getUTCFullYear(), 1960, 2100)
    : undefined;
  let data: RankingPage | undefined;
  let years: number[] = [];
  let checkedAt: string | undefined;
  try {
    [data, years] = await Promise.all([
      api<RankingPage>(
        `/rankings?indicator=${metric}&source=${source}${year ? `&year=${year}` : ""}&page=${page}&size=25`,
      ),
      api<number[]>(`/years?indicator=${metric}&source=${source}`),
    ]);
    year = data.year;
    const status = await api<{
      sources: { provider: string; checkedAt: string }[];
    }>("/data/status");
    checkedAt = status.sources.find(
      (s) => s.provider === data?.provider,
    )?.checkedAt;
  } catch {}

  const url = (p: number) =>
    `/${lang}?indicator=${metric}&source=${source}&year=${year}&page=${p}#rankings`;
  const topFive = data?.items.slice(0, 5) ?? [];
  const topLeaderValue = data?.items[0]?.value ?? 1;
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
            ) : (
              <>
                A clearer view of the{" "}
                <em className="hero-serif">global economy.</em>
              </>
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

        <div className="hero-snapshot" aria-label={lang === "ko" ? "상위 5개국 요약" : "Top 5 economies snapshot"}>
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
                    <Link href={`/${lang}/countries/${row.code}`} className="snapshot-row">
                      <div className="snapshot-row-top">
                        <span className="snapshot-country">
                          <span className={`snapshot-rank rank-${row.rank}`}>
                            {row.rank.toString().padStart(2, "0")}
                          </span>
                          <span className="snapshot-code">{row.code}</span>
                          <span className="snapshot-name">
                            {countryName(row.code, row.name, lang)}
                          </span>
                        </span>
                        <span className="snapshot-val">
                          {amount(row.value, lang)}
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
              <strong>IMF WEO · World Bank WDI</strong>
            </div>
          )}
          <div className="snapshot-foot">
            <span>
              {data?.provider === "imf" ? "IMF WEO" : "World Bank WDI"}
            </span>
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
            {lang === "ko" ? "지역 합계 제외 · 공식 경제권" : "Official economies · aggregates excluded"}
          </small>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t.year}</span>
          <strong className="stat-value">{year ?? "—"}</strong>
          <small className="stat-sub">
            {data?.items[0]
              ? statusName(data.items[0].status, lang)
              : lang === "ko"
                ? "최신 제공 연도"
                : "Latest available year"}
          </small>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t.source}</span>
          <strong className="stat-value source-stat">
            {data?.provider === "imf" ? (
              <>
                IMF <small>WEO</small>
              </>
            ) : (
              <>
                World Bank <small>WDI</small>
              </>
            )}
          </strong>
          <small className="stat-sub stat-live">
            <span className="sync-dot" aria-hidden="true" />
            {lang === "ko" ? "6시간마다 공식 발표 자동 확인" : "Auto-checked every 6 hours"}
          </small>
        </div>
      </section>

      <section id="rankings" className="panel rankings">
        <div className="section-head">
          <div>
            <p className="eyebrow">ECONOMIC EXPLORER</p>
            <h2>{t.rankings}</h2>
          </div>
          <form className="inline-form">
            <input type="hidden" name="indicator" value={metric} />
            {metric !== "exports" && (
              <SourceSelect source={source} lang={lang} />
            )}
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
                href={`/${lang}?indicator=${m}&source=${m === "exports" ? "worldbank" : source}#rankings`}
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
        ) : data.items.length === 0 ? (
          <div className="panel-pad">
            <p className="notice">{t.empty}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <caption className="sr-only">
                {t[metric]} · {year}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t.rank}</th>
                  <th scope="col">{t.country}</th>
                  <th scope="col" className="numeric">
                    {t.value}{" "}
                    <span className="muted">({unitLabel})</span>
                  </th>
                  <th scope="col" className="bar-column">
                    <span className="sr-only">Relative value</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => {
                  const isTop3 = row.rank >= 1 && row.rank <= 3;
                  const sharePct = Math.max(
                    1,
                    (row.value / topLeaderValue) * 100,
                  );
                  return (
                    <tr key={row.code} className={isTop3 ? "top-row" : undefined}>
                      <td className="rank-number">
                        <span
                          className={
                            isTop3
                              ? `rank-medal rank-medal-${row.rank}`
                              : "rank-plain"
                          }
                        >
                          {row.rank.toString().padStart(2, "0")}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="country-name"
                          href={`/${lang}/countries/${row.code}`}
                        >
                          <span className="country-code">{row.code}</span>
                          <span className="country-meta">
                            <span className="country-label">
                              {countryName(row.code, row.name, lang)}
                            </span>
                            <span className="region">
                              {regionName(row.region, lang)}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="numeric" title={fullAmount(row.value, lang)}>
                        <span className="amount-val">
                          {amount(row.value, lang)}
                        </span>
                        <small
                          className={`value-status ${row.status === "ACTUAL" ? "actual" : "forecast"}`}
                        >
                          {statusName(row.status, lang)}
                        </small>
                      </td>
                      <td className="bar-column">
                        <div className="bar-track">
                          <div style={{ width: `${sharePct}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > 25 && (
          <div className="pagination">
            {page > 0 ? (
              <Link className="small-button" href={url(page - 1)}>
                ← {t.previous}
              </Link>
            ) : (
              <span />
            )}
            <span className="page-indicator">
              <strong>{page + 1}</strong> /{" "}
              {Math.max(1, Math.ceil(data.total / 25))}
            </span>
            {(page + 1) * 25 < data.total ? (
              <Link className="small-button" href={url(page + 1)}>
                {t.next} →
              </Link>
            ) : (
              <span />
            )}
          </div>
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
