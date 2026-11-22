import { countryName, regionName } from "@/lib/geography";
import Provenance, { statusName } from "@/components/Provenance";
import CountryFlag from "@/components/CountryFlag";
import CountryTrendChart from "@/components/CountryTrendChart";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  api,
  metricAmount,
  fullAmount,
  metrics,
  type Country,
  type Observation,
} from "@/lib/api";
import { isLocale, dictionary } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string; code: string }> };
type Profile = { country: Country; observations: Observation[] };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, code } = await params;
  return {
    title: `${code} · ${lang === "ko" ? "국가 경제 현황" : "Economic profile"}`,
    alternates: {
      canonical: `/${lang}/countries/${code}`,
      languages: { en: `/en/countries/${code}`, ko: `/ko/countries/${code}` },
    },
  };
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

  return (
    <>
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
            {lang === "ko" ? "이 지표로 토론하기" : t.community}
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
      </section>

      <CountryTrendChart observations={data.observations} lang={lang} />

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">
              {lang === "ko" ? "연도별 추이" : "HISTORICAL SERIES"}
            </p>
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
              </tr>
            </thead>
            <tbody>
              {years.map((y) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Provenance items={data.observations} lang={lang} />
    </>
  );
}
