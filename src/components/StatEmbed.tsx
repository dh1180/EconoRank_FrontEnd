"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  amount,
  metricAmount,
  metrics,
  type Company,
  type CompanyFeed,
  type Country,
  type Metric,
  type Observation,
} from "@/lib/api";
import { countryName } from "@/lib/geography";
import { dictionary, type Locale } from "@/lib/i18n";
import CountryFlag from "@/components/CountryFlag";
import CompanyLogo from "@/components/CompanyLogo";
import { statusName } from "@/components/Provenance";

const TOKEN_REGEX =
  /(\[\[stat:(?:country:[A-Z]{3}:(?:gdp|gdppc|ppp):\d{4}|company:[A-Za-z0-9.\-^]{1,20})\]\])/g;

const countryObsCache = new Map<string, Promise<Observation[] | null>>();
let companiesCache: Promise<Company[]> | null = null;
let countriesListCache: Promise<Country[]> | null = null;

function loadCountryObservations(code: string): Promise<Observation[] | null> {
  if (!countryObsCache.has(code)) {
    countryObsCache.set(
      code,
      fetch(`/api/countries/${encodeURIComponent(code)}?source=imf`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => (d?.observations as Observation[]) ?? null)
        .catch(() => null),
    );
  }
  return countryObsCache.get(code)!;
}

function loadCompanies(): Promise<Company[]> {
  if (!companiesCache) {
    companiesCache = fetch("/api/companies?limit=500")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: CompanyFeed | null) => d?.items ?? [])
      .catch(() => []);
  }
  return companiesCache;
}

function loadCountries(): Promise<Country[]> {
  if (!countriesListCache) {
    countriesListCache = fetch("/api/countries")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
  }
  return countriesListCache;
}

function CountryStatCard({
  code,
  metric,
  year,
  lang,
}: {
  code: string;
  metric: Metric;
  year: number;
  lang: Locale;
}) {
  const t = dictionary(lang);
  const [obs, setObs] = useState<Observation | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    loadCountryObservations(code).then((list) => {
      if (cancelled) return;
      const found =
        list?.find((o) => o.indicator === metric && o.year === year) ?? null;
      setObs(found);
    });
    return () => {
      cancelled = true;
    };
  }, [code, metric, year]);

  const unit = metric === "ppp" ? "Int$" : "US$";
  const label = obs ? countryName(code, obs.name, lang) : countryName(code, code, lang);

  return (
    <Link href={`/${lang}/countries/${code}`} className="stat-embed-card">
      <div className="stat-embed-left">
        <CountryFlag code={code} size="md" />
        <div>
          <span className="stat-embed-kicker">
            IMF WEO · {year} · {t[metric]}
          </span>
          <strong className="stat-embed-title">
            {label} <small className="mono">{code}</small>
          </strong>
        </div>
      </div>
      <div className="stat-embed-right">
        {obs === undefined ? (
          <span className="muted">{t.loading}</span>
        ) : obs ? (
          <>
            <strong className="stat-embed-val mono">
              {metricAmount(obs.value, metric, lang)} <small>{unit}</small>
            </strong>
            <span
              className={`value-status ${obs.status === "ACTUAL" ? "actual" : "forecast"}`}
            >
              {statusName(obs.status, lang)}
            </span>
          </>
        ) : (
          <span className="muted">{t.missing}</span>
        )}
      </div>
    </Link>
  );
}

function CompanyStatCard({
  symbol,
  lang,
}: {
  symbol: string;
  lang: Locale;
}) {
  const t = dictionary(lang);
  const [company, setCompany] = useState<Company | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    loadCompanies().then((list) => {
      if (cancelled) return;
      const found =
        list.find((c) => c.symbol.toUpperCase() === symbol.toUpperCase()) ??
        null;
      setCompany(found);
    });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return (
    <Link href={`/${lang}/companies`} className="stat-embed-card">
      <div className="stat-embed-left">
        <CompanyLogo
          symbol={company?.symbol || symbol}
          name={company?.name || symbol}
          size="md"
        />
        <div>
          <span className="stat-embed-kicker">
            LIVE MARKET CAP {company ? `· #${company.rank} · ${company.exchange}` : ""}
          </span>
          <strong className="stat-embed-title">
            {company?.name || symbol}{" "}
            <small className="mono">{company?.symbol || symbol}</small>
          </strong>
        </div>
      </div>
      <div className="stat-embed-right">
        {company === undefined ? (
          <span className="muted">{t.loading}</span>
        ) : company ? (
          <>
            <strong className="stat-embed-val mono">
              {amount(company.marketCap, lang)} <small>US$</small>
            </strong>
            <span className="stat-embed-price mono">
              ${company.priceUsd.toFixed(2)}
            </span>
          </>
        ) : (
          <span className="muted">{t.missing}</span>
        )}
      </div>
    </Link>
  );
}

export function StatText({ text, lang }: { text: string; lang: Locale }) {
  const parts = text.split(TOKEN_REGEX);
  return (
    <div className="post-body">
      {parts.map((part, idx) => {
        if (!part) return null;
        if (part.startsWith("[[stat:") && part.endsWith("]]")) {
          const inner = part.slice(7, -2);
          const segs = inner.split(":");
          if (segs[0] === "country" && segs.length === 4) {
            const [, code, metric, yearStr] = segs;
            return (
              <CountryStatCard
                key={idx}
                code={code}
                metric={metric as Metric}
                year={Number(yearStr)}
                lang={lang}
              />
            );
          }
          if (segs[0] === "company" && segs.length === 2) {
            return <CompanyStatCard key={idx} symbol={segs[1]} lang={lang} />;
          }
        }
        const cleaned = part.replace(/^\n+/, "").replace(/\n+$/, "");
        if (!cleaned) return null;
        return (
          <p key={idx} className="post-body-para">
            {cleaned}
          </p>
        );
      })}
    </div>
  );
}

export function StatPicker({
  lang,
  onInsert,
}: {
  lang: Locale;
  onInsert: (token: string) => void;
}) {
  const t = dictionary(lang);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"country" | "company">("country");
  const [countries, setCountries] = useState<Country[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [countryCode, setCountryCode] = useState("KOR");
  const [metric, setMetric] = useState<Metric>("gdp");
  const [year, setYear] = useState(new Date().getUTCFullYear());
  const [companyQuery, setCompanyQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    loadCountries().then(setCountries);
    loadCompanies().then(setCompanies);
  }, [open]);

  const filteredCompanies = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    const list = q
      ? companies.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.symbol.toLowerCase().includes(q),
        )
      : companies;
    return list.slice(0, 8);
  }, [companies, companyQuery]);

  const years = [2026, 2025, 2024, 2023, 2022, 2027, 2028];

  return (
    <div className="stat-picker-wrap">
      <button
        type="button"
        className="small-button stat-picker-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? t.closeStatPicker : t.attachStat}
      </button>

      {open && (
        <div className="stat-picker-box">
          <div className="stat-picker-tabs">
            <button
              type="button"
              className={tab === "country" ? "active" : ""}
              onClick={() => setTab("country")}
            >
              {t.rankings} (IMF)
            </button>
            <button
              type="button"
              className={tab === "company" ? "active" : ""}
              onClick={() => setTab("company")}
            >
              {t.companies} · {t.marketCap}
            </button>
          </div>

          {tab === "country" ? (
            <div className="stat-picker-form">
              <select
                aria-label={t.country}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              >
                {countries.length === 0 ? (
                  <option value="KOR">{countryName("KOR", "Korea, Rep.", lang)}</option>
                ) : (
                  countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {countryName(c.code, c.name, lang)} ({c.code})
                    </option>
                  ))
                )}
              </select>
              <select
                aria-label={t.rankings}
                value={metric}
                onChange={(e) => setMetric(e.target.value as Metric)}
              >
                {metrics.map((m) => (
                  <option key={m} value={m}>
                    {t[m]}
                  </option>
                ))}
              </select>
              <select
                aria-label={t.year}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="button"
                onClick={() => {
                  onInsert(`[[stat:country:${countryCode}:${metric}:${year}]]`);
                  setOpen(false);
                }}
              >
                {t.insertCard}
              </button>
            </div>
          ) : (
            <div className="stat-picker-companies">
              <input
                type="search"
                value={companyQuery}
                onChange={(e) => setCompanyQuery(e.target.value)}
                placeholder={t.searchCompanies}
              />
              <div className="stat-company-results">
                {filteredCompanies.map((c) => (
                  <button
                    key={`${c.rank}-${c.symbol}`}
                    type="button"
                    className="stat-company-option"
                    onClick={() => {
                      onInsert(`[[stat:company:${c.symbol}]]`);
                      setOpen(false);
                    }}
                  >
                    <CompanyLogo symbol={c.symbol} name={c.name} size="sm" />
                    <span className="stat-company-name">{c.name}</span>
                    <small className="mono">{c.symbol}</small>
                    <span className="mono stat-company-cap">
                      {amount(c.marketCap, lang)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
