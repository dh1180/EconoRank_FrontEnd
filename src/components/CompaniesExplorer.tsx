"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { amount, fullAmount, type Company, type CompanyFeed } from "@/lib/api";
import { countryName } from "@/lib/geography";
import { dictionary, type Locale } from "@/lib/i18n";
import CountryFlag from "@/components/CountryFlag";
import CompanyLogo from "@/components/CompanyLogo";

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

const EXCHANGE_LABELS_KO: Record<string, string> = {
  "US (NYSE/NASDAQ)": "미국 (NYSE·NASDAQ)",
  KRX: "한국 (KRX)",
  TSE: "일본 (도쿄 TSE)",
  HKEX: "홍콩 (HKEX)",
  SSE: "중국 (상하이 SSE)",
  SZSE: "중국 (선전 SZSE)",
  TWSE: "대만 (TWSE)",
  Tadawul: "사우디 (Tadawul)",
  LSE: "영국 (런던 LSE)",
  XETRA: "독일 (XETRA)",
  "Euronext Paris": "프랑스 (파리)",
  "Euronext Amsterdam": "네덜란드 (암스테르담)",
  "SIX Swiss": "스위스 (SIX)",
  "NSE India": "인도 (NSE)",
  TSX: "캐나다 (토론토 TSX)",
  ASX: "호주 (ASX)",
  B3: "브라질 (B3)",
  "Nasdaq Copenhagen": "덴마크 (코펜하겐)",
  "Nasdaq Stockholm": "스웨덴 (스톡홀름)",
  "BME Madrid": "스페인 (마드리드)",
  "Borsa Italiana": "이탈리아 (밀라노)",
  SGX: "싱가포르 (SGX)",
  IDX: "인도네시아 (IDX)",
};

const EXCHANGE_FLAGS: Record<string, string> = {
  "US (NYSE/NASDAQ)": "USA",
  KRX: "KOR",
  TSE: "JPN",
  HKEX: "HKG",
  SSE: "CHN",
  SZSE: "CHN",
  TWSE: "TWN",
  Tadawul: "SAU",
  LSE: "GBR",
  XETRA: "DEU",
  "Euronext Paris": "FRA",
  "Euronext Amsterdam": "NLD",
  "SIX Swiss": "CHE",
  "NSE India": "IND",
  TSX: "CAN",
  ASX: "AUS",
  B3: "BRA",
  "Nasdaq Copenhagen": "DNK",
  "Nasdaq Stockholm": "SWE",
  "BME Madrid": "ESP",
  "Borsa Italiana": "ITA",
  SGX: "SGP",
  IDX: "IDN",
};

const PAGE_SIZE = 25;

function exchangeLabel(code: string, lang: string) {
  if (lang === "ko") return EXCHANGE_LABELS_KO[code] || code;
  return code;
}

function formatPriceUsd(price: number, locale: string) {
  if (!Number.isFinite(price) || price <= 0) return "—";
  try {
    return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : locale, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
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
  const [exchangeFilter, setExchangeFilter] = useState<string>("ALL");
  const [countryFilter, setCountryFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshLive() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetch("/api/companies?limit=1000", {
        cache: "no-store",
      });
      if (res.ok) {
        const next = (await res.json()) as CompanyFeed;
        setFeed(next);
      }
    } catch {
    } finally {
      setRefreshing(false);
    }
  }

  const items = feed.items;
  const totalCap = useMemo(
    () => items.reduce((sum, c) => sum + c.marketCap, 0),
    [items],
  );

  const exchangeList = useMemo(() => {
    const map = new Map<string, { code: string; count: number; cap: number }>();
    for (const c of items) {
      const key = c.exchange || "Other";
      const cur = map.get(key) ?? { code: key, count: 0, cap: 0 };
      cur.count += 1;
      cur.cap += c.marketCap;
      map.set(key, cur);
    }
    return [...map.values()]
      .filter((e) => e.code !== "Other" && e.count >= 2)
      .sort((a, b) => b.cap - a.cap);
  }, [items]);

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
      if (exchangeFilter !== "ALL" && c.exchange !== exchangeFilter) {
        return false;
      }
      const key = c.countryCode || c.country || "OTHER";
      if (countryFilter !== "ALL" && key !== countryFilter) return false;
      if (!q) return true;
      const localizedCountry = c.countryCode
        ? countryName(c.countryCode, c.country, lang).toLowerCase()
        : c.country.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.exchange.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        localizedCountry.includes(q) ||
        c.countryCode.toLowerCase().includes(q)
      );
    });
  }, [items, query, exchangeFilter, countryFilter, lang]);

  const localTopCap = filtered[0]?.marketCap ?? items[0]?.marketCap ?? 1;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );
  const isExchangeView = exchangeFilter !== "ALL";

  function exportCsv() {
    const header = [
      "Global Rank",
      "Company",
      "Symbol",
      "Exchange",
      "Market Cap (USD)",
      "Price (USD)",
      "Country",
      "Country Code",
    ];
    const rows = filtered.map((c: Company) => [
      c.rank,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.symbol}"`,
      `"${c.exchange}"`,
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
    a.download = `statagora-companies-${exchangeFilter === "ALL" ? "global" : exchangeFilter.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {exchangeList.length > 0 && (
        <div className="exchange-bar" role="region" aria-label={lang === "ko" ? "국가 거래소별 순위" : "Rankings by stock exchange"}>
          <div className="exchange-bar-head">
            <span className="region-share-title">
              {lang === "ko" ? "국가 거래소별 주식 순위" : "Rankings by Stock Exchange"}
            </span>
            {isExchangeView && (
              <span className="exchange-active-note mono">
                {exchangeLabel(exchangeFilter, lang)} · {filtered.length}
              </span>
            )}
          </div>
          <div className="exchange-pills">
            <button
              type="button"
              className={`exchange-pill ${exchangeFilter === "ALL" ? "active" : ""}`}
              onClick={() => {
                setExchangeFilter("ALL");
                setPage(0);
              }}
            >
              <span>{lang === "ko" ? "전체 글로벌" : "All Global"}</span>
              <small className="mono">{items.length}</small>
            </button>
            {exchangeList.map((ex) => {
              const flagCode = EXCHANGE_FLAGS[ex.code];
              return (
                <button
                  key={ex.code}
                  type="button"
                  className={`exchange-pill ${exchangeFilter === ex.code ? "active" : ""}`}
                  onClick={() => {
                    setExchangeFilter((cur) => (cur === ex.code ? "ALL" : ex.code));
                    setCountryFilter("ALL");
                    setPage(0);
                  }}
                >
                  {flagCode && <CountryFlag code={flagCode} size="sm" />}
                  <span>{exchangeLabel(ex.code, lang)}</span>
                  <small className="mono">{ex.count}</small>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!isExchangeView && topCountries.length > 0 && totalCap > 0 && (
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
                ? "기업명, 티커(AAPL, 005930.KS), 거래소 또는 국가 검색..."
                : "Search company, ticker (AAPL, 005930.KS), exchange or country..."
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
                ? "↻ 시세 확인"
                : "↻ Refresh"}
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
              {lang === "ko"
                ? "전세계 실시간 기업 시가총액 순위"
                : "Global companies ranked by market cap"}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t.rank}</th>
                <th scope="col">
                  {lang === "ko" ? "기업 / 티커 · 거래소" : "Company / Ticker · Exchange"}
                </th>
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
              {pageItems.map((c, idx) => {
                const displayRank = isExchangeView
                  ? safePage * PAGE_SIZE + idx + 1
                  : c.rank;
                const isTop3 = displayRank >= 1 && displayRank <= 3;
                const barPct = Math.max(1, (c.marketCap / localTopCap) * 100);
                const localizedCountry = c.countryCode
                  ? countryName(c.countryCode, c.country, lang)
                  : c.country;

                return (
                  <tr
                    key={`${c.rank}-${c.symbol}`}
                    className={isTop3 ? "top-row" : undefined}
                  >
                    <td className="rank-number">
                      <span
                        className={
                          isTop3
                            ? `rank-medal rank-medal-${displayRank}`
                            : "rank-plain"
                        }
                      >
                        {displayRank.toString().padStart(2, "0")}
                      </span>
                      {isExchangeView && (
                        <small className="global-rank-sub mono">
                          #{c.rank}
                        </small>
                      )}
                    </td>
                    <td>
                      <div className="company-row-main">
                        <CompanyLogo symbol={c.symbol} name={c.name} size="md" />
                        <div className="company-cell">
                          <span className="company-name">{c.name}</span>
                          <div className="company-sub-badges">
                            <span className="ticker-badge mono">{c.symbol}</span>
                            <span className="exchange-tag">
                              {exchangeLabel(c.exchange, lang)}
                            </span>
                          </div>
                        </div>
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
                ? `전 세계 상위 ${items.length}개 상장 기업의 시가총액(USD)을 ${feed.refreshIntervalMinutes}분 TTL 캐시로 요청 시에만 효율적으로 갱신합니다.`
                : `Top ${items.length} global public company market caps (USD), refreshed lazily on demand with a ${feed.refreshIntervalMinutes}-minute TTL cache.`}
            </p>
          </div>
          <div className="sync-pill">
            <span className="sync-dot" aria-hidden="true" />
            <span>
              {lang === "ko"
                ? `${feed.refreshIntervalMinutes}분 TTL 캐시 · 요청 시 갱신`
                : `${feed.refreshIntervalMinutes}m on-demand cache`}
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
