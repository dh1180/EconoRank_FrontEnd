import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  api,
  metricAmount,
  comparisonCodes,
  integer,
  metrics,
  type Country,
  type Observation,
} from "@/lib/api";
import { isLocale, dictionary } from "@/lib/i18n";
import { countryName } from "@/lib/geography";
import { COMPARE_COLORS } from "@/lib/palette";
import CountrySelector from "@/components/CountrySelector";
import CountryFlag from "@/components/CountryFlag";
import Provenance, { statusName, editionName } from "@/components/Provenance";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "ko" ? "국가 경제 비교" : "Compare national economies",
    alternates: {
      canonical: `/${lang}/compare`,
      languages: { en: "/en/compare", ko: "/ko/compare" },
    },
  };
}

export default async function Compare({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = dictionary(lang),
    q = await searchParams;
  const raw = q.country,
    selected = comparisonCodes(
      raw === undefined
        ? ["USA", "KOR", "JPN"]
        : Array.isArray(raw)
          ? raw
          : [raw],
    );
  let year =
    typeof q.year === "string"
      ? integer(q.year, new Date().getUTCFullYear(), 1960, 2100)
      : undefined;
  let countries: Country[] = [],
    items: Observation[] = [],
    years: number[] = [],
    failed = false;
  try {
    [countries, years] = await Promise.all([
      api<Country[]>("/countries"),
      api<number[]>("/years?indicator=gdp&source=imf"),
    ]);
    if (selected.length >= 2 && selected.length <= 5) {
      const data = await api<{ year: number; items: Observation[] }>(
        `/compare?countries=${selected.join(",")}&source=imf${year ? `&year=${year}` : ""}`,
      );
      year = data.year;
      items = data.items;
    }
  } catch {
    failed = true;
  }
  const chosen = selected
    .map((code) => countries.find((c) => c.code === code))
    .filter((c): c is Country => !!c);

  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">
          {lang === "ko" ? "국가별 경제 비교 · IMF WEO" : "COUNTRY COMPARISON · IMF WEO"}
        </p>
        <h1>{t.compareTitle}</h1>
        <p className="lead">{t.compareIntro}</p>
      </section>

      <div className="compare-layout">
        <form className="panel selection">
          <div className="selection-heading">
            <h2>{t.choose}</h2>
            <span>2–5</span>
          </div>
          <div className="selection-fields">
            <label htmlFor="compare-year">{t.year}</label>
            <select id="compare-year" name="year" defaultValue={year}>
              {[...new Set([...(year ? [year] : []), ...years])].map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend>{t.country}</legend>
            <CountrySelector
              key={selected.join(",")}
              countries={countries}
              initial={selected}
              lang={lang}
            />
          </fieldset>
          <button className="button" type="submit">
            {t.apply}
          </button>
        </form>

        <section className="comparison-results" aria-live="polite">
          <div className="panel comparison-summary">
            <div>
              <p className="eyebrow">
                {lang === "ko" ? "선택한 국가" : "ACTIVE COMPARISON"}
              </p>
              <h2>
                {year ?? "—"}
                <span>
                  {lang === "ko" ? "년 경제 현황" : " economic overview"}
                </span>
              </h2>
            </div>
            <div className="country-legend">
              {chosen.map((c, i) => (
                <Link
                  key={c.code}
                  href={`/${lang}/countries/${c.code}`}
                  className="legend-pill"
                >
                  <i
                    style={{
                      background: COMPARE_COLORS[i % COMPARE_COLORS.length],
                    }}
                  />
                  <CountryFlag code={c.code} size="sm" />
                  <span>{countryName(c.code, c.name, lang)}</span>
                  <small>{c.code}</small>
                </Link>
              ))}
            </div>
          </div>

          {failed ? (
            <p className="notice" role="alert">
              {t.unavailable}
            </p>
          ) : selected.length < 2 || selected.length > 5 ? (
            <p className="notice">{t.compareIntro}</p>
          ) : (
            metrics.map((metric) => {
              const values = items.filter((i) => i.indicator === metric),
                max = Math.max(1, ...values.map((i) => i.value)),
                first = values[0];
              return (
                <article className="panel comparison-card" key={metric}>
                  <div className="section-head">
                    <div>
                      <p className="metric-caption">
                        {metric === "gdp"
                          ? "NOMINAL GDP"
                          : metric === "gdppc"
                            ? "GDP PER CAPITA"
                            : "PURCHASING POWER PARITY"}
                      </p>
                      <h2>{t[metric]}</h2>
                    </div>
                    <span className="unit-badge">
                      {year} · {metric === "ppp" ? "Int$" : "US$"}
                    </span>
                  </div>
                  <div className="comparison-rows">
                    {chosen.map((c, i) => {
                      const item = values.find((v) => v.code === c.code);
                      const ratio = item
                        ? Math.round((item.value / max) * 100)
                        : 0;
                      const barColor =
                        COMPARE_COLORS[i % COMPARE_COLORS.length];
                      return (
                        <div key={c.code} className="comparison-row">
                          <div className="comparison-row-top">
                            <Link
                              className="comparison-country"
                              href={`/${lang}/countries/${c.code}`}
                            >
                              <i
                                className="row-dot"
                                style={{ background: barColor }}
                                aria-hidden="true"
                              />
                              <CountryFlag code={c.code} size="sm" />
                              <span className="country-code">{c.code}</span>
                              <span>{countryName(c.code, c.name, lang)}</span>
                            </Link>
                            <div className="comparison-value">
                              <strong>
                                {metricAmount(item?.value, metric, lang)}
                              </strong>
                              <small
                                className={
                                  item
                                    ? `value-status ${item.status === "ACTUAL" ? "actual" : "forecast"}`
                                    : "value-status"
                                }
                              >
                                {item
                                  ? `${statusName(item.status, lang)} · ${ratio}%`
                                  : t.missing}
                              </small>
                            </div>
                          </div>
                          <div className="comparison-bar">
                            <span
                              style={{
                                width: item
                                  ? `${Math.max(2, (item.value / max) * 100)}%`
                                  : "0",
                                background: barColor,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="comparison-source">
                    {first ? (
                      <>
                        <a
                          href={first.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {first.source} ↗
                        </a>
                        <span>{editionName(first, lang)}</span>
                      </>
                    ) : (
                      <span>
                        {lang === "ko"
                          ? `${year}년 자료가 아직 없습니다. 다른 기준연도를 선택해 주세요.`
                          : `No observations for ${year}. Choose another reference year.`}
                      </span>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
      <Provenance items={items} lang={lang} />
    </>
  );
}
