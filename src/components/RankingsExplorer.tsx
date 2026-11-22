"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { countryName, regionName } from "@/lib/geography";
import { metricAmount, fullAmount, type Metric, type Ranking } from "@/lib/api";
import { dictionary, type Locale } from "@/lib/i18n";
import CountryFlag from "@/components/CountryFlag";
import { statusName } from "@/components/Provenance";

const REGION_COLORS: Record<string, string> = {
  "East Asia & Pacific": "#0B6E5C",
  "North America": "#2563EB",
  "Europe & Central Asia": "#7C3AED",
  "Latin America & Caribbean": "#C68B2C",
  "South Asia": "#0891B2",
  "Middle East & North Africa": "#D97706",
  "Middle East, North Africa, Afghanistan & Pakistan": "#D97706",
  "Sub-Saharan Africa": "#BE123C",
  "Other economies": "#64748B",
};

const PAGE_SIZE = 25;

export default function RankingsExplorer({
  items,
  metric,
  year,
  lang,
}: {
  items: Ranking[];
  metric: Metric;
  year: number;
  lang: Locale;
}) {
  const t = dictionary(lang);
  const [query, setQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [compareList, setCompareList] = useState<string[]>([]);
  const tableTopRef = useRef<HTMLDivElement>(null);

  function goToPage(nextPage: number) {
    setPage(nextPage);
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const unitLabel = metric === "ppp" ? "Int$" : "US$";
  const topLeaderValue = items[0]?.value ?? 1;

  const worldTotal = useMemo(
    () => items.reduce((sum, r) => sum + r.value, 0),
    [items],
  );
  const globalAvg = items.length > 0 ? worldTotal / items.length : 1;

  const regionShares = useMemo(() => {
    const map = new Map<string, { region: string; total: number; count: number }>();
    for (const row of items) {
      const key = row.region.trim() || "Other economies";
      const cur = map.get(key) ?? { region: key, total: 0, count: 0 };
      cur.total += row.value;
      cur.count += 1;
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((row) => {
      if (selectedRegion !== "ALL" && row.region.trim() !== selectedRegion) {
        return false;
      }
      if (!q) return true;
      const localized = countryName(row.code, row.name, lang).toLowerCase();
      return (
        localized.includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.code.toLowerCase().includes(q)
      );
    });
  }, [items, query, selectedRegion, lang]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  function toggleCompare(code: string) {
    setCompareList((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code);
      if (prev.length >= 5) return prev;
      return [...prev, code];
    });
  }

  function exportCsv() {
    const header = [
      "Rank",
      "Code",
      "Country",
      "Region",
      "Indicator",
      "Year",
      `Value (${unitLabel})`,
      "Status",
      "Source",
    ];
    const rows = filtered.map((r) => [
      r.rank,
      r.code,
      `"${countryName(r.code, r.name, lang).replace(/"/g, '""')}"`,
      `"${regionName(r.region, lang).replace(/"/g, '""')}"`,
      metric,
      year,
      r.value,
      r.status,
      `"${r.source}"`,
    ]);
    const csv =
      "\uFEFF" +
      [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statagora-${metric}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const compareHref = `/${lang}/compare?${compareList.map((c) => `country=${c}`).join("&")}&year=${year}`;

  return (
    <>
      {metric !== "gdppc" && regionShares.length > 0 && worldTotal > 0 && (
        <div className="region-share-box">
          <div className="region-share-head">
            <span className="region-share-title">
              {lang === "ko" ? "권역별 세계 비중" : "Regional share of global total"}
            </span>
            <span className="region-share-total mono">
              {lang === "ko" ? "합계" : "Total"}:{" "}
              {metricAmount(worldTotal, metric, lang)} {unitLabel}
            </span>
          </div>
          <div className="region-stacked-bar" role="group" aria-label="Regional breakdown">
            {regionShares.map((seg) => {
              const pct = (seg.total / worldTotal) * 100;
              if (pct < 0.8) return null;
              const color = REGION_COLORS[seg.region] || "#64748B";
              const isSelected = selectedRegion === seg.region;
              return (
                <button
                  key={seg.region}
                  type="button"
                  className={`region-bar-seg ${isSelected ? "active" : ""}`}
                  style={{ width: `${pct}%`, background: color }}
                  title={`${regionName(seg.region, lang)}: ${pct.toFixed(1)}%`}
                  onClick={() => {
                    setSelectedRegion((cur) =>
                      cur === seg.region ? "ALL" : seg.region,
                    );
                    setPage(0);
                  }}
                />
              );
            })}
          </div>
          <div className="region-pills">
            <button
              type="button"
              className={`region-pill ${selectedRegion === "ALL" ? "active" : ""}`}
              onClick={() => {
                setSelectedRegion("ALL");
                setPage(0);
              }}
            >
              {t.all} ({items.length})
            </button>
            {regionShares.map((seg) => {
              const pct = (seg.total / worldTotal) * 100;
              const color = REGION_COLORS[seg.region] || "#64748B";
              return (
                <button
                  key={seg.region}
                  type="button"
                  className={`region-pill ${selectedRegion === seg.region ? "active" : ""}`}
                  onClick={() => {
                    setSelectedRegion((cur) =>
                      cur === seg.region ? "ALL" : seg.region,
                    );
                    setPage(0);
                  }}
                >
                  <i style={{ background: color }} aria-hidden="true" />
                  <span>{regionName(seg.region, lang)}</span>
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
            placeholder={t.searchCountries}
          />
        </div>
        <div className="explorer-tools-right">
          {metric === "gdppc" && (
            <select
              aria-label={lang === "ko" ? "권역 필터" : "Filter by region"}
              className="region-select"
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setPage(0);
              }}
            >
              <option value="ALL">
                {lang === "ko" ? `전체 권역 (${items.length})` : `All regions (${items.length})`}
              </option>
              {regionShares.map((seg) => (
                <option key={seg.region} value={seg.region}>
                  {regionName(seg.region, lang)} ({seg.count})
                </option>
              ))}
            </select>
          )}
          <span className="result-count mono">
            {filtered.length} / {items.length}
          </span>
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
              {t[metric]} · {year}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t.rank}</th>
                <th scope="col">{t.country}</th>
                <th scope="col" className="numeric">
                  {t.value} <span className="muted">({unitLabel})</span>
                </th>
                <th scope="col" className="numeric share-col">
                  {metric === "gdppc" ? t.vsAvg : t.share}
                </th>
                <th scope="col" className="bar-column">
                  <span className="sr-only">Relative value</span>
                </th>
                <th scope="col" className="compare-col">
                  <span className="sr-only">{t.compare}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((row) => {
                const isTop3 = row.rank >= 1 && row.rank <= 3;
                const sharePct = Math.max(
                  1,
                  (row.value / topLeaderValue) * 100,
                );
                const worldShare =
                  worldTotal > 0 ? (row.value / worldTotal) * 100 : 0;
                const avgRatio = globalAvg > 0 ? row.value / globalAvg : 0;
                const isPicked = compareList.includes(row.code);

                return (
                  <tr
                    key={row.code}
                    className={`${isTop3 ? "top-row" : ""} ${isPicked ? "picked-row" : ""}`}
                  >
                    <td className="rank-number">
                      <span
                        className={
                          isTop3
                            ? `rank-medal rank-medal-${row.rank}`
                            : "rank-plain"
                        }
                      >
                        {row.rank.toString().padStart(2, "0")}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="country-name"
                        href={`/${lang}/countries/${row.code}`}
                      >
                        <CountryFlag code={row.code} size="md" />
                        <span className="country-code">{row.code}</span>
                        <span className="country-meta">
                          <span className="country-label">
                            {countryName(row.code, row.name, lang)}
                          </span>
                          <span className="region">
                            {regionName(row.region, lang)}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="numeric" title={fullAmount(row.value, lang)}>
                      <span className="amount-val">
                        {metricAmount(row.value, metric, lang)}
                      </span>
                      <small
                        className={`value-status ${row.status === "ACTUAL" ? "actual" : "forecast"}`}
                      >
                        {statusName(row.status, lang)}
                      </small>
                    </td>
                    <td className="numeric share-col">
                      <span className="share-val mono">
                        {metric === "gdppc"
                          ? `${avgRatio.toFixed(1)}×`
                          : worldShare >= 0.1
                            ? `${worldShare.toFixed(1)}%`
                            : "<0.1%"}
                      </span>
                    </td>
                    <td className="bar-column">
                      <div className="bar-track">
                        <div style={{ width: `${sharePct}%` }} />
                      </div>
                    </td>
                    <td className="compare-col">
                      <button
                        type="button"
                        className={`pick-btn ${isPicked ? "active" : ""}`}
                        disabled={!isPicked && compareList.length >= 5}
                        onClick={() => toggleCompare(row.code)}
                        aria-label={`${t.compare}: ${countryName(row.code, row.name, lang)}`}
                        title={
                          isPicked
                            ? lang === "ko"
                              ? "비교 목록에서 제거"
                              : "Remove from comparison"
                            : lang === "ko"
                              ? "비교 목록에 추가 (최대 5개)"
                              : "Add to quick compare (max 5)"
                        }
                      >
                        {isPicked ? "✓" : "+"}
                      </button>
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

      {compareList.length > 0 && (
        <div className="compare-dock" role="region" aria-label={t.compare}>
          <div className="compare-dock-inner">
            <div className="compare-dock-chips">
              <span className="dock-count mono">{compareList.length}/5</span>
              {compareList.map((code) => {
                const row = items.find((i) => i.code === code);
                return (
                  <button
                    key={code}
                    type="button"
                    className="dock-chip"
                    onClick={() => toggleCompare(code)}
                  >
                    <CountryFlag code={code} size="sm" />
                    <span>{countryName(code, row?.name || code, lang)}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                );
              })}
            </div>
            <div className="compare-dock-actions">
              <button
                type="button"
                className="dock-clear"
                onClick={() => setCompareList([])}
              >
                {t.cancel}
              </button>
              {compareList.length >= 2 ? (
                <Link className="button button-bright" href={compareHref}>
                  {t.apply} ({compareList.length}) →
                </Link>
              ) : (
                <span className="dock-hint">
                  {lang === "ko"
                    ? "1개국 더 선택하세요"
                    : "Pick 1 more country"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
