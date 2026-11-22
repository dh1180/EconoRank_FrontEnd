import { countryName, regionName } from "@/lib/geography";
import Provenance, { statusName } from "@/components/Provenance";
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
  const years = [...new Set(data.observations.map((o) => o.year))]
    .filter((y) => y <= new Date().getUTCFullYear())
    .sort((a, b) => b - a);
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">
          {regionName(data.country.region, lang)} / {code}
        </p>
        <h1>{countryName(code, data.country.name, lang)}</h1>
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
          <span>IMF WEO · World Bank WDI</span>
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
                  {metrics.map((m) => {
                    const item = data.observations.find(
                      (o) => o.year === y && o.indicator === m,
                    );
                    return (
                      <td className="numeric" key={m}>
                        {amount(item?.value, lang)}
                        {item && (
                          <small
                            className={`value-status ${item.status === "ACTUAL" ? "actual" : "forecast"}`}
                          >
                            {statusName(item.status, lang)}
                          </small>
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
