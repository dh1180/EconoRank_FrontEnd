import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  api,
  amount,
  comparisonCodes,
  integer,
  metrics,
  type Country,
  type Observation,
} from "@/lib/api";
import { isLocale, dictionary } from "@/lib/i18n";
import { countryName } from "@/lib/geography";
import CountrySelector from "@/components/CountrySelector";
import SourceSelect from "@/components/SourceSelect";
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
  const source =
    typeof q.source === "string" &&
    ["auto", "imf", "worldbank"].includes(q.source)
      ? q.source
      : "auto";
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
      api<number[]>(`/years?indicator=gdp&source=${source}`),
    ]);
    if (selected.length >= 2 && selected.length <= 5) {
      const data = await api<{ year: number; items: Observation[] }>(
        `/compare?countries=${selected.join(",")}&source=${source}${year ? `&year=${year}` : ""}`,
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
  const colors = ["#087f6a", "#5085c6", "#b48132", "#9568bc", "#b66073"];
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">
          {lang === "ko" ? "국가별 경제 비교" : "COUNTRY COMPARISON"}
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
            <SourceSelect source={source} lang={lang} />
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
          <div className="comparison-summary">
            <div>
              <p className="eyebrow">
                {lang === "ko" ? "선택한 국가" : "YOUR COMPARISON"}
              </p>
              <h2>
                {year ?? "—"}{" "}
                <span>
                  {lang === "ko" ? "년 경제 현황" : "economic overview"}
                </span>
              </h2>
            </div>
            <div className="country-legend">
              {chosen.map((c, i) => (
                <span key={c.code}>
                  <i style={{ background: colors[i] }} />
                  {countryName(c.code, c.name, lang)}
                </span>
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
                          ? "GDP"
                          : metric === "ppp"
                            ? "PURCHASING POWER PARITY"
                            : "GOODS & SERVICES"}
                      </p>
                      <h2>{t[metric]}</h2>
                    </div>
                    <span className="unit-badge">
                      {year} · {metric === "ppp" ? "Int$" : "US$"}
                    </span>
                  </div>
                  {chosen.map((c, i) => {
                    const item = values.find((v) => v.code === c.code);
                    return (
                      <div key={c.code} className="comparison-row">
                        <div>
                          <Link
                            className="comparison-country"
                            href={`/${lang}/countries/${c.code}`}
                          >
                            <span className="country-code">{c.code}</span>
                            {countryName(c.code, c.name, lang)}
                          </Link>
                          <div className="comparison-value">
                            <strong>{amount(item?.value, lang)}</strong>
                            <small>
                              {item ? statusName(item.status, lang) : t.missing}
                            </small>
                          </div>
                        </div>
                        <div className="comparison-bar">
                          <span
                            style={{
                              width: item
                                ? `${(item.value / max) * 100}%`
                                : "0",
                              background: colors[i],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="comparison-source">
                    {first ? (
                      <>
                        <a
                          href={first.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {first.source}
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
