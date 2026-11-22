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
import CountrySelector from "@/components/CountrySelector";
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
  const raw = q.country;
  const selected = comparisonCodes(
    raw === undefined
      ? ["USA", "KOR", "JPN"]
      : Array.isArray(raw)
        ? raw
        : [raw],
  );
  const year = integer(
    typeof q.year === "string" ? q.year : undefined,
    2024,
    1960,
    2100,
  );
  let countries: Country[] = [];
  let items: Observation[] = [];
  let failed = false;
  let years: number[] = [];
  try {
    [countries, years] = await Promise.all([
      api<Country[]>("/countries"),
      api<number[]>("/years"),
    ]);
    if (selected.length >= 2 && selected.length <= 5) {
      items = (
        await api<{ items: Observation[] }>(
          `/compare?countries=${selected.join(",")}&year=${year}`,
        )
      ).items;
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
        <p className="eyebrow">COUNTRY COMPARISON</p>
        <h1>{t.compareTitle}</h1>
        <p className="lead">{t.compareIntro}</p>
      </section>
      <div className="compare-layout">
        <form className="panel selection">
          <h2>{t.choose}</h2>
          <label htmlFor="compare-year">{t.year}</label>
          <select id="compare-year" name="year" defaultValue={year}>
            {[...new Set([year, ...years])].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <fieldset>
            <legend>{t.country} (2–5)</legend>
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
          {failed ? (
            <p className="notice" role="alert">
              {t.unavailable}
            </p>
          ) : selected.length < 2 || selected.length > 5 ? (
            <p className="notice">{t.compareIntro}</p>
          ) : (
            metrics.map((metric) => {
              const max = Math.max(
                1,
                ...items
                  .filter((i) => i.indicator === metric)
                  .map((i) => i.value),
              );
              return (
                <article className="panel comparison-card" key={metric}>
                  <div className="section-head">
                    <h2>{t[metric]}</h2>
                    <span>
                      {year} · {metric === "ppp" ? "Int$" : "US$"}
                    </span>
                  </div>
                  {chosen.map((c) => {
                    const item = items.find(
                      (i) => i.indicator === metric && i.code === c.code,
                    );
                    return (
                      <div key={c.code} className="comparison-row">
                        <div>
                          <Link href={`/${lang}/countries/${c.code}`}>
                            {c.name}
                          </Link>
                          <strong>{amount(item?.value, lang)}</strong>
                        </div>
                        <div className="comparison-bar">
                          <span
                            style={{
                              width: item
                                ? `${(item.value / max) * 100}%`
                                : "0",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </article>
              );
            })
          )}
        </section>
      </div>
      <div className="data-note">
        <p>
          {t.definition} {t.exportNote}
        </p>
        <p>
          {t.source}:{" "}
          {metrics.map((m) => (
            <a
              key={m}
              href={
                items.find((i) => i.indicator === m)?.sourceUrl ||
                `https://data.worldbank.org/indicator/${m === "gdp" ? "NY.GDP.MKTP.CD" : m === "ppp" ? "NY.GDP.MKTP.PP.CD" : "NE.EXP.GNFS.CD"}`
              }
              target="_blank"
              rel="noreferrer"
            >
              {t[m]}{" "}
            </a>
          ))}
          {items[0] && (
            <>
              {" "}
              · {t.retrieved}: {items[0].retrievedAt.slice(0, 10)}
            </>
          )}
        </p>
      </div>
    </>
  );
}
