"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { amount, fullAmount, type Company, type CompanyFeed } from "@/lib/api";
import { countryName } from "@/lib/geography";
import { dictionary, type Locale } from "@/lib/i18n";
import CountryFlag from "@/components/CountryFlag";

const COUNTRY_COLORS = [
  "#0B6E5C",
  "#2563EB",
  "#C68B2C",
  "#7C3AED",
  "#BE123C",
  "#0891B2",
  "#D97706",
  "#64748B",
];

const PAGE_SIZE = 25;

function formatPriceUsd(price: number, locale: string) {
  if (!Number.isFinite(price) || price <= 0) return "—";
  try {
    return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : locale, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: price >= 100 ? 2 : 2,
    }).format(price);
  } catch {
    return `$${price.toFixed(2)}`;
  }
}

export default function CompaniesExplorer({
  initialFeed,
  lang,
}: {
  initialFeed: CompanyFeed;
  lang: Locale;
}) {
  const t = dictionary(lang);
  const [feed, setFeed] = useState<CompanyFeed>(initialFeed);
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshLive() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetch("/api/companies?limit=250", { cache: "no-store" });
      if (res.ok) {
        const next = (await res.json()) as CompanyFeed;
        setFeed(next);
      }
    } catch {
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const id = window.setInterval(refreshLive, 5 * 60 * 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = feed.items;
  const topCap = items[0]?.marketCap ?? 1;
  const totalCap = useMemo(
    () => items.reduce((sum, c) => sum + c.marketCap, 0),
    [items],
  );

  const countryShares = useMemo(() => {
    const map = new Map<
      string,
      { key: string; code: string; name: string; cap: number; count: number }
    >();
    for (const c of items) {
      const key = c.countryCode || c.country || "OTHER";
      const cur = map.get(key) ?? {
        key,
        code: c.countryCode,
        name: c.country,
        cap: 0,
        count: 0,
      };
      cur.cap += c.marketCap;
      cur.count += 1;
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.cap - a.cap);
  }, [items]);

  const topCountries = countryShares.slice(0, 8);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((c) => {
      const key = c.countryCode || c.country || "OTHER";
      if (countryFilter !== "ALL" && key !== countryFilter) return false;
      if (!q) return true;
      const localizedCountry = c.countryCode
        ? countryName(c.countryCode, c.country, lang).toLowerCase()
        : c.country.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        localizedCountry.includes(q) ||
        c.countryCode.toLowerCase().includes(q)
      );
    });
  }, [items, query, countryFilter, lang]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  function exportCsv() {
    const header = [
      "Rank",
      "Company",
      "Symbol",
      "Market Cap (USD)",
      "Price (USD)",
      "Country",
      "Country Code",
    ];
    const rows = filtered.map((c: Company) => [
      c.rank,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.symbol}"`,
      c.marketCap,
      c.priceUsd,
      `"${c.countryCode ? countryName(c.countryCode, c.country, lang) : c.country}"`,
      c.countryCode,
    ]);
    const csv =
      "\uFEFF" +
      [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "statagora-global-companies-marketcap.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {topCountries.length > 0 && totalCap > 0 && (
        <div className="region-share-box">
          <div className="region-share-head">
            <span className="region-share-title">
              {lang === "ko"
                ? `상위 ${items.length}개 기업 국가별 시총 비중`
                : `Top ${items.length} market cap share by country`}
            </span>
            <span className="region-share-total mono">
              {lang === "ko" ? "합산 시총" : "Combined"}:{" "}
              {amount(totalCap, lang)} US$
            </span>
          </div>
          <div className="region-stacked-bar" role="group" aria-label="Country market cap breakdown">
            {topCountries.map((seg, idx) => {
              const pct = (seg.cap / totalCap) * 100;
              if (pct < 0.7) return null;
              const color = COUNTRY_COLORS[idx % COUNTRY_COLORS.length];
              return (
                <button
                  key={seg.key}
                  type="button"
                  className={`region-bar-seg ${countryFilter === seg.key ? "active" : ""}`}
                  style={{ width: `${pct}%`, background: color }}
                  title={`${seg.code ? countryName(seg.code, seg.name, lang) : seg.name}: ${pct.toFixed(1)}%`}
                  onClick={() => {
                    setCountryFilter((cur) => (cur === seg.key ? "ALL" : seg.key));
                    setPage(0);
                  }}
                />
              );
            })}
          </div>
          <div className="region-pills">
            <button
              type="button"
              className={`region-pill ${countryFilter === "ALL" ? "active" : ""}`}
              onClick={() => {
                setCountryFilter("ALL");
                setPage(0);
              }}
            >
              {lang === "ko" ? "전체" : "All"} ({items.length})
            </button>
            {topCountries.map((seg, idx) => {
              const pct = (seg.cap / totalCap) * 100;
              const color = COUNTRY_COLORS[idx % COUNTRY_COLORS.length];
              return (
                <button
                  key={seg.key}
                  type="button"
                  className={`region-pill ${countryFilter === seg.key ? "active" : ""}`}
                  onClick={() => {
                    setCountryFilter((cur) => (cur === seg.key ? "ALL" : seg.key));
                    setPage(0);
                  }}
                >
                  <i style={{ background: color }} aria-hidden="true" />
                  {seg.code && <CountryFlag code={seg.code} size="sm" />}
                  <span>
                    {seg.code ? countryName(seg.code, seg.name, lang) : seg.name}
                  </span>
                  <small className="mono">{pct.toFixed(1)}%</small>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="explorer-toolbar">
        <div className="explorer-search-wrap">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="search-icon"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className="explorer-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={
              lang === "ko"
                ? "기업명, 티커(AAPL, 005930.KS) 또는 국가 검색..."
                : "Search company, ticker (AAPL, NVDA) or country..."
            }
          />
        </div>
        <div className="explorer-tools-right">
          <span className="result-count mono">
            {filtered.length} / {items.length}
          </span>
          <button
            type="button"
            className="small-button csv-btn"
            disabled={refreshing}
            onClick={refreshLive}
          >
            {refreshing
              ? lang === "ko"
                ? "갱신 중…"
                : "Refreshing…"
              : lang === "ko"
                ? "↻ 실시간 갱신"
                : "↻ Live refresh"}
          </button>
          <button
            type="button"
            className="small-button csv-btn"
            onClick={exportCsv}
          >
            ↓ CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="panel-pad">
          <p className="notice">{t.empty}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <caption className="sr-only">
              {lang === "ko" ? "전세계 실시간 기업 시가총액 순위" : "Global companies ranked by market cap"}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t.rank}</th>
                <th scope="col">{lang === "ko" ? "기업 / 티커" : "Company / Ticker"}</th>
                <th scope="col" className="country-col">
                  {t.country}
                </th>
                <th scope="col" className="numeric">
                  {lang === "ko" ? "시가총액" : "Market Cap"}{" "}
                  <span className="muted">(US$)</span>
                </th>
                <th scope="col" className="numeric price-col">
                  {lang === "ko" ? "주가" : "Price"}
                </th>
                <th scope="col" className="bar-column">
                  <span className="sr-only">Relative size</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((c) => {
                const isTop3 = c.rank >= 1 && c.rank <= 3;
                const barPct = Math.max(1, (c.marketCap / topCap) * 100);
                const localizedCountry = c.countryCode
                  ? countryName(c.countryCode, c.country, lang)
                  : c.country;

                return (
                  <tr key={`${c.rank}-${c.symbol}`} className={isTop3 ? "top-row" : undefined}>
                    <td className="rank-number">
                      <span
                        className={
                          isTop3
                            ? `rank-medal rank-medal-${c.rank}`
                            : "rank-plain"
                        }
                      >
                        {c.rank.toString().padStart(2, "0")}
                      </span>
                    </td>
                    <td>
                      <div className="company-cell">
                        <span className="company-name">{c.name}</span>
                        <span className="ticker-badge mono">{c.symbol}</span>
                      </div>
                    </td>
                    <td className="country-col">
                      {c.countryCode ? (
                        <Link
                          href={`/${lang}/countries/${c.countryCode}`}
                          className="company-country-link"
                        >
                          <CountryFlag code={c.countryCode} size="sm" />
                          <span>{localizedCountry}</span>
                        </Link>
                      ) : (
                        <span className="company-country-link">
                          {localizedCountry}
                        </span>
                      )}
                    </td>
                    <td className="numeric" title={fullAmount(c.marketCap, lang)}>
                      <span className="amount-val">
                        {amount(c.marketCap, lang)}
                      </span>
                    </td>
                    <td className="numeric price-col">
                      <span className="price-val mono">
                        {formatPriceUsd(c.priceUsd, lang)}
                      </span>
                    </td>
                    <td className="bar-column">
                      <div className="bar-track">
                        <div style={{ width: `${barPct}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="pagination">
          <button
            type="button"
            className="small-button"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ← {t.previous}
          </button>
          <span className="page-indicator">
            <strong>{safePage + 1}</strong> / {totalPages}
          </span>
          <button
            type="button"
            className="small-button"
            disabled={safePage + 1 >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            {t.next} →
          </button>
        </div>
      )}

      <aside className="provenance">
        <div className="provenance-head">
          <div>
            <p className="eyebrow">
              {lang === "ko" ? "실시간 시장 데이터 출처" : "LIVE MARKET DATA SOURCE"}
            </p>
            <p className="provenance-desc">
              {lang === "ko"
                ? "전 세계 상장 기업의 실시간 시가총액(USD 기준)을 5분마다 자동 갱신합니다."
                : "Global public company market capitalizations (USD) refreshed automatically every 5 minutes."}
            </p>
          </div>
          <div className="sync-pill">
            <span className="sync-dot" aria-hidden="true" />
            <span>
              {lang === "ko"
                ? `${feed.refreshIntervalMinutes}분마다 자동 갱신`
                : `Auto-sync every ${feed.refreshIntervalMinutes}m`}
            </span>
          </div>
        </div>
        <div className="provenance-notes" style={{ marginTop: 12 }}>
          <a
            href={feed.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="refresh-note"
            style={{ color: "var(--accent)", fontWeight: 650 }}
          >
            {feed.source} ↗
          </a>
          <p className="refresh-note mono">
            {lang === "ko" ? "최근 갱신" : "Last updated"}{" "}
            {feed.updatedAt.slice(0, 19).replace("T", " ")} UTC
          </p>
        </div>
      </aside>
    </>
  );
}
