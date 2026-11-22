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
    year = integer(query.year, 2024, 1960, 2100),
    page = integer(query.page, 0, 0, 10000);
  let data: RankingPage | undefined;
  let years: number[] = [];
  try {
    [data, years] = await Promise.all([
      api<RankingPage>(
        `/rankings?indicator=${metric}&year=${year}&page=${page}&size=25`,
      ),
      api<number[]>("/years"),
    ]);
  } catch {}
  const url = (p: number) =>
    `/${lang}?indicator=${metric}&year=${year}&page=${p}#rankings`;
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.headline}</h1>
          <p className="lead">{t.intro}</p>
          <div className="hero-actions">
            <a className="button" href="#rankings">
              {t.view}
            </a>
            <Link className="button secondary" href={`/${lang}/compare`}>
              {t.compare}
            </Link>
          </div>
        </div>
        <div className="globe" aria-hidden="true">
          <div className="orbit one" />
          <div className="orbit two" />
          <div className="orbit three" />
          <span>
            STAT / AGORA
            <br />
            <b>
              GLOBAL
              <br />
              PERSPECTIVE
            </b>
          </span>
        </div>
      </section>
      <section className="stats" aria-label={t.coverage}>
        <div>
          <span>{t.countries}</span>
          <strong>{data?.total ?? "—"}</strong>
        </div>
        <div>
          <span>{t.year}</span>
          <strong>{year}</strong>
        </div>
        <div>
          <span>{t.source}</span>
          <strong className="source-stat">
            World Bank <small>WDI</small>
          </strong>
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
            <label htmlFor="year">{t.year}</label>
            <select id="year" name="year" defaultValue={year}>
              {[...new Set([year, ...years])]
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
        <div className="tabs" role="navigation" aria-label={t.rankings}>
          {metrics.map((m) => (
            <Link
              key={m}
              className={m === metric ? "active" : ""}
              aria-current={m === metric ? "page" : undefined}
              href={`/${lang}?indicator=${m}&year=${year}#rankings`}
            >
              {t[m]}
            </Link>
          ))}
        </div>
        {!data ? (
          <p className="notice" role="alert">
            {t.unavailable}
          </p>
        ) : data.items.length === 0 ? (
          <p className="notice">{t.empty}</p>
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
                    <span className="muted">
                      ({metric === "ppp" ? "Int$" : "US$"})
                    </span>
                  </th>
                  <th scope="col" className="bar-column">
                    <span className="sr-only">Relative value</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.code}>
                    <td className="rank-number">
                      {row.rank.toString().padStart(2, "0")}
                    </td>
                    <td>
                      <Link
                        className="country-name"
                        href={`/${lang}/countries/${row.code}`}
                      >
                        <span className="country-code">{row.code}</span>
                        {row.name}
                      </Link>
                      <span className="region">{row.region}</span>
                    </td>
                    <td className="numeric" title={fullAmount(row.value, lang)}>
                      {amount(row.value, lang)}
                    </td>
                    <td className="bar-column">
                      <div className="bar-track">
                        <div
                          style={{
                            width: `${Math.max(1, (row.value / data.items[0].value) * 100)}%`,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.total > 25 && (
          <div className="pagination">
            {page > 0 ? (
              <Link className="small-button" href={url(page - 1)}>
                {t.previous}
              </Link>
            ) : (
              <span />
            )}
            <span>
              {page + 1} / {Math.max(1, Math.ceil(data.total / 25))}
            </span>
            {(page + 1) * 25 < data.total ? (
              <Link className="small-button" href={url(page + 1)}>
                {t.next}
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
        <div className="data-note">
          <p>
            {t.definition} {t.exportNote}
          </p>
          <p>
            {t.source}:{" "}
            <a
              href={data?.items[0]?.sourceUrl || "https://data.worldbank.org"}
              target="_blank"
              rel="noreferrer"
            >
              {t.worldbank}
            </a>
            {data?.items[0] && (
              <>
                {" "}
                · {t.retrieved}: {data.items[0].retrievedAt.slice(0, 10)}
              </>
            )}
          </p>
        </div>
      </section>
      <section className="community-banner">
        <div>
          <p className="eyebrow">THE AGORA</p>
          <h2>{t.discussion}</h2>
          <p>{t.discussionText}</p>
        </div>
        <Link className="button" href={`/${lang}/community`}>
          {t.join}
        </Link>
      </section>
    </>
  );
}
