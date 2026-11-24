import { countryName, regionName } from "@/lib/geography";
import Provenance, { statusName } from "@/components/Provenance";
import CountryFlag from "@/components/CountryFlag";
import CountryTrendChart from "@/components/CountryTrendChart";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  api,
  amount,
  metricAmount,
  fullAmount,
  metrics,
  type Country,
  type Observation,
} from "@/lib/api";
import { isLocale, dictionary } from "@/lib/i18n";
import { buildPageMetadata, siteOrigin } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

type Props = { params: Promise<{ lang: string; code: string }> };
type Profile = { country: Country; observations: Observation[] };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, code } = await params;
  const loc = isLocale(lang) ? lang : "en";
  const t = dictionary(loc);
  const localizedName = countryName(code, code, loc);
  return buildPageMetadata({
    lang: loc,
    path: `/countries/${code}`,
    title: `${localizedName} (${code}) · ${t.countryTitle}`,
    description: `${localizedName} (${code}) ${t.gdp}, ${t.gdppc}, ${t.ppp} — ${t.worldbank}`,
    keywords: [localizedName, code, t.gdp, t.gdppc, t.ppp, "IMF WEO", "EconoRank"],
  });
}

function formatDelta(current?: number, prev?: number): string | null {
  if (
    current === undefined ||
    prev === undefined ||
    !Number.isFinite(current) ||
    !Number.isFinite(prev) ||
    prev <= 0
  ) {
    return null;
  }
  const pct = ((current - prev) / prev) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function populationLabel(lang: string): string {
  if (lang === "ko") return "인구수";
  if (lang === "ja") return "人口";
  if (lang.startsWith("zh")) return "人口";
  if (lang === "es") return "Población";
  if (lang === "fr") return "Population";
  if (lang === "de") return "Bevölkerung";
  return "Population";
}

function formatPopulation(value: number | undefined, lang: string): string {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return "—";
  const compact = amount(value, lang);
  if (lang === "ko") return `${compact}명`;
  if (lang === "ja") return `${compact}人`;
  return compact;
}

function derivePopulationByYear(
  observations: Observation[],
): Map<number, { value: number; status: "ACTUAL" | "ESTIMATE_OR_FORECAST" }> {
  const byYear = new Map<
    number,
    { gdp?: Observation; gdppc?: Observation }
  >();
  for (const o of observations) {
    if (o.indicator !== "gdp" && o.indicator !== "gdppc") continue;
    const entry = byYear.get(o.year) ?? {};
    if (o.indicator === "gdp") entry.gdp = o;
    else entry.gdppc = o;
    byYear.set(o.year, entry);
  }
  const result = new Map<
    number,
    { value: number; status: "ACTUAL" | "ESTIMATE_OR_FORECAST" }
  >();
  for (const [year, { gdp, gdppc }] of byYear.entries()) {
    if (gdp && gdppc && gdppc.value > 0 && gdp.value > 0) {
      const pop = Math.round(gdp.value / gdppc.value);
      const status =
        gdp.status === "ACTUAL" && gdppc.status === "ACTUAL"
          ? "ACTUAL"
          : "ESTIMATE_OR_FORECAST";
      result.set(year, { value: pop, status });
    }
  }
  return result;
}

export default async function CountryPage({ params }: Props) {
  const { lang, code } = await params;
  if (!isLocale(lang) || !/^[A-Z]{3}$/.test(code)) notFound();
  const t = dictionary(lang);
  let data: Profile;
  try {
    data = await api<Profile>(`/countries/${code}?source=imf`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) notFound();
    return (
      <p className="notice" role="alert">
        {t.unavailable}
      </p>
    );
  }

  const currentUtcYear = new Date().getUTCFullYear();
  const years = [...new Set(data.observations.map((o) => o.year))]
    .filter((y) => y <= currentUtcYear)
    .sort((a, b) => b - a);

  const latestCards = metrics.map((m) => {
    const series = data.observations
      .filter((o) => o.indicator === m && o.year <= currentUtcYear)
      .sort((a, b) => b.year - a.year);
    const latest = series[0];
    const prev = latest
      ? series.find((o) => o.year === latest.year - 1)
      : undefined;
    const delta = formatDelta(latest?.value, prev?.value);
    return { metric: m, latest, delta };
  });

  const popByYear = derivePopulationByYear(data.observations);
  const latestPopYear = [...popByYear.keys()]
    .filter((y) => y <= currentUtcYear)
    .sort((a, b) => b - a)[0];
  const latestPop =
    latestPopYear !== undefined ? popByYear.get(latestPopYear) : undefined;
  const prevPop =
    latestPopYear !== undefined ? popByYear.get(latestPopYear - 1) : undefined;
  const popDelta = formatDelta(latestPop?.value, prevPop?.value);
  const popTitle = populationLabel(lang);

  const localizedCountry = countryName(code, data.country.name, lang);
  const origin = siteOrigin();
  const countryJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "EconoRank", item: `${origin}/${lang}` },
          {
            "@type": "ListItem",
            position: 2,
            name: localizedCountry,
            item: `${origin}/${lang}/countries/${code}`,
          },
        ],
      },
      {
        "@type": "Dataset",
        name: `${localizedCountry} (${code}) ${t.countryTitle} — EconoRank`,
        description: `${localizedCountry} ${t.gdp}, ${t.gdppc}, ${t.ppp} (${t.worldbank})`,
        url: `${origin}/${lang}/countries/${code}`,
        inLanguage: lang,
        spatialCoverage: localizedCountry,
        temporalCoverage: "2022/2031",
      },
    ],
  };

  return (
    <>
      <JsonLd data={countryJsonLd} />
      <section className="country-hero">
        <div className="country-hero-main">
          <div className="hero-badge">
            <span>{regionName(data.country.region, lang)}</span>
            <span aria-hidden="true">·</span>
            <span className="mono">{code}</span>
          </div>
          <h1 className="country-hero-title">
            <CountryFlag code={code} size="lg" />
            <span>{countryName(code, data.country.name, lang)}</span>
          </h1>
          <p className="lead">{t.countryTitle} · IMF WEO</p>
        </div>
        <div className="hero-actions">
          <Link
            className="button button-bright"
            href={`/${lang}/compare?country=${code}&country=${code === "USA" ? "KOR" : "USA"}`}
          >
            {t.compare} →
          </Link>
          <Link
            className="button button-glass"
            href={`/${lang}/community?attach=${encodeURIComponent(`country:${code}:gdp:${years[0] ?? currentUtcYear}`)}`}
          >
            {t.discussMetric}
          </Link>
        </div>
      </section>

      <section
        className="stats country-kpis"
        aria-label={lang === "ko" ? "최신 주요 지표" : "Latest key indicators"}
      >
        {latestCards.map(({ metric, latest, delta }) => (
          <div className="stat-card" key={metric}>
            <div className="stat-card-top">
              <span className="stat-label">{t[metric]}</span>
              <span className="unit-badge">
                {latest ? latest.year : "—"} · {metric === "ppp" ? "Int$" : "US$"}
              </span>
            </div>
            <strong
              className="stat-value"
              title={latest ? fullAmount(latest.value, lang) : undefined}
            >
              {metricAmount(latest?.value, metric, lang)}
            </strong>
            <div className="stat-meta-row">
              {latest ? (
                <small
                  className={`value-status ${latest.status === "ACTUAL" ? "actual" : "forecast"}`}
                >
                  {statusName(latest.status, lang)}
                </small>
              ) : (
                <small className="stat-sub">{t.missing}</small>
              )}
              {delta && (
                <span
                  className={`delta-pill ${delta.startsWith("+") ? "up" : "down"}`}
                >
                  {delta} YoY
                </span>
              )}
            </div>
          </div>
        ))}
        <div className="stat-card" key="population">
          <div className="stat-card-top">
            <span className="stat-label">{popTitle}</span>
            <span className="unit-badge">
              {latestPopYear ?? "—"} · IMF WEO
            </span>
          </div>
          <strong
            className="stat-value"
            title={
              latestPop
                ? `${fullAmount(latestPop.value, lang)}${lang === "ko" ? "명" : lang === "ja" ? "人" : ""}`
                : undefined
            }
          >
            {formatPopulation(latestPop?.value, lang)}
          </strong>
          <div className="stat-meta-row">
            {latestPop ? (
              <small
                className={`value-status ${latestPop.status === "ACTUAL" ? "actual" : "forecast"}`}
              >
                {statusName(latestPop.status, lang)}
              </small>
            ) : (
              <small className="stat-sub">{t.missing}</small>
            )}
            {popDelta && (
              <span
                className={`delta-pill ${popDelta.startsWith("+") ? "up" : "down"}`}
              >
                {popDelta} YoY
              </span>
            )}
          </div>
        </div>
      </section>

      <CountryTrendChart observations={data.observations} lang={lang} />

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">{t.historicalSeries}</p>
            <h2>{t.history}</h2>
          </div>
          <span className="unit-badge">IMF WEO</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t.year}</th>
                {metrics.map((m) => (
                  <th className="numeric" key={m}>
                    {t[m]} ({m === "ppp" ? "Int$" : "US$"})
                  </th>
                ))}
                <th className="numeric">{popTitle}</th>
              </tr>
            </thead>
            <tbody>
              {years.map((y) => {
                const pop = popByYear.get(y);
                const popPrev = popByYear.get(y - 1);
                const rowPopDelta = formatDelta(pop?.value, popPrev?.value);
                return (
                  <tr key={y}>
                    <th scope="row" className="year-cell">
                      {y}
                    </th>
                    {metrics.map((m) => {
                      const item = data.observations.find(
                        (o) => o.year === y && o.indicator === m,
                      );
                      const prev = data.observations.find(
                        (o) => o.year === y - 1 && o.indicator === m,
                      );
                      const delta = formatDelta(item?.value, prev?.value);
                      return (
                        <td
                          className="numeric"
                          key={m}
                          title={item ? fullAmount(item.value, lang) : undefined}
                        >
                          <span className="amount-val">
                            {metricAmount(item?.value, m, lang)}
                          </span>
                          {item && (
                            <span className="cell-badges">
                              <small
                                className={`value-status ${item.status === "ACTUAL" ? "actual" : "forecast"}`}
                              >
                                {statusName(item.status, lang)}
                              </small>
                              {delta && (
                                <span
                                  className={`delta-inline ${delta.startsWith("+") ? "up" : "down"}`}
                                >
                                  {delta}
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td
                      className="numeric"
                      title={
                        pop
                          ? `${fullAmount(pop.value, lang)}${lang === "ko" ? "명" : lang === "ja" ? "人" : ""}`
                          : undefined
                      }
                    >
                      <span className="amount-val">
                        {formatPopulation(pop?.value, lang)}
                      </span>
                      {pop && (
                        <span className="cell-badges">
                          <small
                            className={`value-status ${pop.status === "ACTUAL" ? "actual" : "forecast"}`}
                          >
                            {statusName(pop.status, lang)}
                          </small>
                          {rowPopDelta && (
                            <span
                              className={`delta-inline ${rowPopDelta.startsWith("+") ? "up" : "down"}`}
                            >
                              {rowPopDelta}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <Provenance items={data.observations} lang={lang} />
    </>
  );
}
