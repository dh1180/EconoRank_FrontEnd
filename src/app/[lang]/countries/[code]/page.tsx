import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  api,
  amount,
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
export default async function CountryPage({ params }: Props) {
  const { lang, code } = await params;
  if (!isLocale(lang) || !/^[A-Z]{3}$/.test(code)) notFound();
  const t = dictionary(lang);
  let data: Profile;
  try {
    data = await api<Profile>(`/countries/${code}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) notFound();
    return (
      <p className="notice" role="alert">
        {t.unavailable}
      </p>
    );
  }
  const years = [...new Set(data.observations.map((o) => o.year))].sort(
    (a, b) => b - a,
  );
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">
          {data.country.region} / {code}
        </p>
        <h1>{data.country.name}</h1>
        <p className="lead">{t.countryTitle}</p>
        <div className="hero-actions">
          <Link
            className="button"
            href={`/${lang}/compare?country=${code}&country=${code === "USA" ? "KOR" : "USA"}`}
          >
            {t.compare}
          </Link>
          <Link
            className="button secondary"
            href={`/${lang}/community?space=country-${code}`}
          >
            {t.community}
          </Link>
        </div>
      </section>
      <section className="panel">
        <div className="section-head">
          <h2>{t.history}</h2>
          <span>World Bank WDI</span>
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
                  <th scope="row">{y}</th>
                  {metrics.map((m) => (
                    <td className="numeric" key={m}>
                      {amount(
                        data.observations.find(
                          (o) => o.year === y && o.indicator === m,
                        )?.value,
                        lang,
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="data-note">
        <p>{t.exportNote}</p>
        <p>
          {t.source}:{" "}
          {metrics.map((m) => (
            <a
              key={m}
              href={
                data.observations.find((o) => o.indicator === m)?.sourceUrl ||
                "https://data.worldbank.org"
              }
            >
              {t[m]}{" "}
            </a>
          ))}{" "}
          · {t.retrieved}:{" "}
          {data.observations[0]?.retrievedAt.slice(0, 10) ?? "—"}
        </p>
      </div>
    </>
  );
}
