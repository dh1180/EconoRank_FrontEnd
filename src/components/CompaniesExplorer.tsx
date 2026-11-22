"use client";
import { useMemo, useRef, useState } from "react";
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
  "Euronext Brussels": "벨기에 (브뤼셀)",
  "SIX Swiss": "스위스 (SIX)",
  "NSE India": "인도 (NSE)",
  TSX: "캐나다 (토론토 TSX)",
  ASX: "호주 (ASX)",
  B3: "브라질 (B3)",
  "Nasdaq Copenhagen": "덴마크 (코펜하겐)",
  "Nasdaq Stockholm": "스웨덴 (스톡홀름)",
  "Nasdaq Helsinki": "핀란드 (헬싱키)",
  "Oslo Børs": "노르웨이 (오슬로)",
  "BME Madrid": "스페인 (마드리드)",
  "Borsa Italiana": "이탈리아 (밀라노)",
  SGX: "싱가포르 (SGX)",
  IDX: "인도네시아 (IDX)",
  SET: "태국 (SET)",
  "GPW Warsaw": "폴란드 (바르샤바)",
  TASE: "이스라엘 (텔아비브)",
  JSE: "남아공 (요하네스버그)",
  BMV: "멕시코 (BMV)",
  "UAE (ADX/DFM)": "아랍에미리트 (ADX·DFM)",
  "Boursa Kuwait": "쿠웨이트",
  "QSE Qatar": "카타르 (QSE)",
  "Borsa Istanbul": "튀르키예 (이스탄불)",
  "Bursa Malaysia": "말레이시아",
  Vienna: "오스트리아 (빈)",
  "Euronext Lisbon": "포르투갈 (리스본)",
  NZX: "뉴질랜드 (NZX)",
  Athens: "그리스 (아테네)",
  "PSE Manila": "필리핀 (마닐라)",
  "HOSE Vietnam": "베트남 (호찌민)",
  Santiago: "칠레 (산티아고)",
  BYMA: "아르헨티나 (BYMA)",
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
  "Euronext Brussels": "BEL",
  "SIX Swiss": "CHE",
  "NSE India": "IND",
  TSX: "CAN",
  ASX: "AUS",
  B3: "BRA",
  "Nasdaq Copenhagen": "DNK",
  "Nasdaq Stockholm": "SWE",
  "Nasdaq Helsinki": "FIN",
  "Oslo Børs": "NOR",
  "BME Madrid": "ESP",
  "Borsa Italiana": "ITA",
  SGX: "SGP",
  IDX: "IDN",
  SET: "THA",
  "GPW Warsaw": "POL",
  TASE: "ISR",
  JSE: "ZAF",
  BMV: "MEX",
  "UAE (ADX/DFM)": "ARE",
  "Boursa Kuwait": "KWT",
  "QSE Qatar": "QAT",
  "Borsa Istanbul": "TUR",
  "Bursa Malaysia": "MYS",
  Vienna: "AUT",
  "Euronext Lisbon": "PRT",
  NZX: "NZL",
  Athens: "GRC",
  "PSE Manila": "PHL",
  "HOSE Vietnam": "VNM",
  Santiago: "CHL",
  BYMA: "ARG",
};

const REGION_LABELS: Record<string, { ko: string; en: string }> = {
  NORTH_AMERICA: { ko: "북미", en: "North America" },
  ASIA: { ko: "아시아", en: "Asia" },
  EUROPE: { ko: "유럽", en: "Europe" },
  MIDDLE_EAST: { ko: "중동", en: "Middle East" },
  OCEANIA: { ko: "오세아니아", en: "Oceania" },
  LATIN_AMERICA: { ko: "중남미", en: "Latin America" },
  AFRICA: { ko: "아프리카", en: "Africa" },
};

const PAGE_SIZE = 25;

function regionLabel(code: string, lang: string) {
  const entry = REGION_LABELS[code];
  if (!entry) return code;
  return lang === "ko" ? entry.ko : entry.en;
}

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
  const [regionFilter, setRegionFilter] = useState<string>("ALL");
  const [exchangeFilter, setExchangeFilter] = useState<string>("ALL");
  const [countryFilter, setCountryFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [loadingExchange, setLoadingExchange] = useState(false);
  const [showAllExchanges, setShowAllExchanges] = useState(false);
  const tableTopRef = useRef<HTMLDivElement>(null);

  function goToPage(nextPage: number) {
    setPage(nextPage);
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const cacheRef = useRef<Map<string, CompanyFeed>>(
    new Map([["ALL|ALL", initialFeed]]),
  );

  async function selectScope(
    nextRegion: string,
    nextExchange: string,
    force = false,
  ) {
    setRegionFilter(nextRegion);
    setExchangeFilter(nextExchange);
    setCountryFilter("ALL");
    setPage(0);
    const cacheKey = `${nextRegion}|${nextExchange}`;
    if (!force && cacheRef.current.has(cacheKey)) {
      setFeed(cacheRef.current.get(cacheKey)!);
      return;
    }
    setLoadingExchange(true);
    try {
      const params = new URLSearchParams();
      if (nextRegion !== "ALL") params.set("region", nextRegion);
      if (nextExchange !== "ALL") params.set("exchange", nextExchange);
      params.set(
        "limit",
        nextRegion === "ALL" && nextExchange === "ALL" ? "250" : "100",
      );
      const res = await fetch(`/api/companies?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const next = (await res.json()) as CompanyFeed;
        cacheRef.current.set(cacheKey, next);
        setFeed(next);
      }
    } catch {
    } finally {
      setLoadingExchange(false);
    }
  }

  const items = feed.items;
  const regions = feed.regions ?? initialFeed.regions ?? [];
  const exchanges = feed.exchanges ?? initialFeed.exchanges ?? [];
  const visibleExchanges = showAllExchanges ? exchanges : exchanges.slice(0, 14);

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
        c.exchange.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        localizedCountry.includes(q) ||
        c.countryCode.toLowerCase().includes(q)
      );
    });
  }, [items, query, countryFilter, lang]);

  const localTopCap = filtered[0]?.marketCap ?? items[0]?.marketCap ?? 1;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );
  const isScopedView = exchangeFilter !== "ALL" || regionFilter !== "ALL";

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
    const scopeSlug =
      exchangeFilter !== "ALL"
        ? exchangeFilter
        : regionFilter !== "ALL"
          ? regionFilter
          : "global";
    a.download = `statagora-companies-${scopeSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {regions.length > 0 && (
        <div
          className="exchange-bar"
          role="region"
          aria-label={
            lang === "ko" ? "권역별 시가총액 순위" : "Market cap rankings by region"
          }
        >
          <div className="exchange-bar-head">
            <span className="region-share-title">
              {lang === "ko"
                ? "권역별 시가총액 순위 (북미 · 아시아 · 유럽 등 각 Top 100)"
                : "Rankings by Region (North America · Asia · Europe · Top 100 each)"}
            </span>
            {regionFilter !== "ALL" && (
              <span className="exchange-active-note mono">
                {regionLabel(regionFilter, lang)} · Top {items.length} /{" "}
                {feed.exchangeTotal ?? items.length}
              </span>
            )}
          </div>
          <div className="exchange-pills">
            <button
              type="button"
              className={`exchange-pill ${regionFilter === "ALL" && exchangeFilter === "ALL" ? "active" : ""}`}
              onClick={() => selectScope("ALL", "ALL")}
            >
              <span>{lang === "ko" ? "전체 글로벌 Top 250" : "Global Top 250"}</span>
              <small className="mono">{feed.total.toLocaleString()}</small>
            </button>
            {regions.map((r) => (
              <button
                key={r.code}
                type="button"
                className={`exchange-pill ${regionFilter === r.code ? "active" : ""}`}
                onClick={() =>
                  selectScope(regionFilter === r.code ? "ALL" : r.code, "ALL")
                }
              >
                <span>{regionLabel(r.code, lang)}</span>
                <small className="mono">{r.count.toLocaleString()}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {exchanges.length > 0 && (
        <div
          className="exchange-bar"
          role="region"
          aria-label={
            lang === "ko" ? "국가 거래소별 주식 순위" : "Rankings by stock exchange"
          }
        >
          <div className="exchange-bar-head">
            <span className="region-share-title">
              {lang === "ko"
                ? `국가 거래소별 주식 순위 (${exchanges.length}개 거래소 · 각 Top 100)`
                : `Stock Rankings by Exchange (${exchanges.length} exchanges · Top 100 each)`}
            </span>
            {exchangeFilter !== "ALL" && (
              <span className="exchange-active-note mono">
                {exchangeLabel(exchangeFilter, lang)} · Top {items.length} /{" "}
                {feed.exchangeTotal ?? items.length}
              </span>
            )}
          </div>
          <div className="exchange-pills">
            {visibleExchanges.map((ex) => {
              const flagCode = EXCHANGE_FLAGS[ex.code];
              return (
                <button
                  key={ex.code}
                  type="button"
                  className={`exchange-pill ${exchangeFilter === ex.code ? "active" : ""}`}
                  onClick={() =>
                    selectScope(
                      "ALL",
                      exchangeFilter === ex.code ? "ALL" : ex.code,
                    )
                  }
                >
                  {flagCode && <CountryFlag code={flagCode} size="sm" />}
                  <span>{exchangeLabel(ex.code, lang)}</span>
                  <small className="mono">{ex.count}</small>
                </button>
              );
            })}
            {exchanges.length > 14 && (
              <button
                type="button"
                className="exchange-pill exchange-more-btn"
                onClick={() => setShowAllExchanges((v) => !v)}
              >
                {showAllExchanges
                  ? lang === "ko"
                    ? "접기 ▲"
                    : "Show less ▲"
                  : lang === "ko"
                    ? `+${exchanges.length - 14}개 거래소 더보기 ▼`
                    : `+${exchanges.length - 14} more exchanges ▼`}
              </button>
            )}
          </div>
        </div>
      )}

      {!isScopedView && topCountries.length > 0 && totalCap > 0 && (
        <div className="region-share-box">
          <div className="region-share-head">
            <span className="region-share-title">
              {lang === "ko"
                ? `글로벌 상위 ${items.length}개 기업 국가별 시총 비중`
                : `Top ${items.length} market cap share by country`}
            </span>
            <span className="region-share-total mono">
              {lang === "ko" ? "합산 시총" : "Combined"}:{" "}
              {amount(totalCap, lang)} US$
            </span>
          </div>
          <div
            className="region-stacked-bar"
            role="group"
            aria-label="Country market cap breakdown"
          >
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

      <div className="explorer-toolbar" ref={tableTopRef}>
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
            disabled={loadingExchange}
            onClick={() => selectScope(regionFilter, exchangeFilter, true)}
          >
            {loadingExchange
              ? lang === "ko"
                ? "불러오는 중…"
                : "Loading…"
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

      {loadingExchange ? (
        <div className="panel-pad">
          <p className="notice" role="status">
            {t.loading}
          </p>
        </div>
      ) : filtered.length === 0 ? (
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
                  {lang === "ko"
                    ? "기업 / 티커 · 거래소"
                    : "Company / Ticker · Exchange"}
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
                const displayRank = isScopedView
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
                      {isScopedView && (
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
            onClick={() => goToPage(Math.max(0, safePage - 1))}
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
            onClick={() => goToPage(Math.min(totalPages - 1, safePage + 1))}
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
                ? `전 세계 ${feed.total.toLocaleString()}개 상장 기업·${exchanges.length}개 국가 거래소 데이터를 ${feed.refreshIntervalMinutes}분 TTL 캐시로 요청 시에만 효율적으로 갱신합니다.`
                : `${feed.total.toLocaleString()} global public companies across ${exchanges.length} stock exchanges, refreshed lazily on demand with a ${feed.refreshIntervalMinutes}-minute TTL cache.`}
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
