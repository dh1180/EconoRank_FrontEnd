"use client";
import { useMemo, useState } from "react";
import {
  amount,
  metricAmount,
  fullAmount,
  metrics,
  type Country,
  type Metric,
  type Observation,
} from "@/lib/api";
import { dictionary, type Locale } from "@/lib/i18n";
import { countryName } from "@/lib/geography";
import { COMPARE_COLORS } from "@/lib/palette";
import CountryFlag from "@/components/CountryFlag";

type ChartMetric = Metric | "pop";
type RangeKey = "all" | "1990" | "2000" | "10y" | "forecast";

function popLabel(lang: Locale): string {
  if (lang === "ko") return "인구수";
  if (lang === "ja") return "人口";
  if (lang.startsWith("zh")) return "人口";
  return "Population";
}

function formatVal(val: number | undefined, metric: ChartMetric, lang: Locale): string {
  if (val === undefined || !Number.isFinite(val)) return "—";
  if (metric === "pop") {
    const c = amount(val, lang);
    if (lang === "ko") return `${c}명`;
    if (lang === "ja") return `${c}人`;
    return c;
  }
  return metricAmount(val, metric, lang);
}

/** Compute clean human-friendly rounded tick ceiling (e.g. 6T instead of 5.91T). */
function niceCeiling(maxVal: number): number {
  if (maxVal <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const frac = maxVal / exp;
  const niceFrac =
    frac <= 1.2 ? 1.2 : frac <= 1.5 ? 1.5 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 3 ? 3 : frac <= 4 ? 4 : frac <= 5 ? 5 : frac <= 6 ? 6 : frac <= 8 ? 8 : 10;
  return niceFrac * exp;
}

export default function CompareLineChart({
  countries,
  observations,
  lang,
}: {
  countries: Country[];
  observations: Observation[];
  lang: Locale;
}) {
  const t = dictionary(lang);
  const ko = lang === "ko";
  const currentYear = new Date().getUTCFullYear();
  const [metric, setMetric] = useState<ChartMetric>("gdp");
  const [range, setRange] = useState<RangeKey>("all");
  const [logScale, setLogScale] = useState(false);
  const [hiddenCodes, setHiddenCodes] = useState<Set<string>>(new Set());
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const pointsByCountry = useMemo(() => {
    const map = new Map<
      string,
      Map<number, { value: number; status: "ACTUAL" | "ESTIMATE_OR_FORECAST" }>
    >();
    for (const c of countries) map.set(c.code, new Map());

    if (metric === "pop") {
      const pair = new Map<
        string,
        Map<number, { gdp?: Observation; gdppc?: Observation }>
      >();
      for (const o of observations) {
        if (o.indicator !== "gdp" && o.indicator !== "gdppc") continue;
        let cm = pair.get(o.code);
        if (!cm) {
          cm = new Map();
          pair.set(o.code, cm);
        }
        const entry = cm.get(o.year) ?? {};
        if (o.indicator === "gdp") entry.gdp = o;
        else entry.gdppc = o;
        cm.set(o.year, entry);
      }
      for (const [code, ym] of pair.entries()) {
        const target = map.get(code);
        if (!target) continue;
        for (const [year, { gdp, gdppc }] of ym.entries()) {
          if (gdp && gdppc && gdp.value > 0 && gdppc.value > 0) {
            target.set(year, {
              value: Math.round(gdp.value / gdppc.value),
              status:
                gdp.status === "ACTUAL" && gdppc.status === "ACTUAL"
                  ? "ACTUAL"
                  : "ESTIMATE_OR_FORECAST",
            });
          }
        }
      }
    } else {
      for (const o of observations) {
        if (o.indicator !== metric) continue;
        const target = map.get(o.code);
        if (target && o.value > 0) {
          target.set(o.year, { value: o.value, status: o.status });
        }
      }
    }
    return map;
  }, [countries, observations, metric]);

  const allYears = useMemo(() => {
    const set = new Set<number>();
    for (const c of countries) {
      if (hiddenCodes.has(c.code)) continue;
      const ym = pointsByCountry.get(c.code);
      if (!ym) continue;
      for (const y of ym.keys()) set.add(y);
    }
    const sorted = [...set].sort((a, b) => a - b);
    const minY =
      range === "all"
        ? 1980
        : range === "1990"
          ? 1990
          : range === "2000"
            ? 2000
            : range === "10y"
              ? currentYear - 10
              : 1980;
    const maxY = range === "forecast" ? 2035 : currentYear;
    return sorted.filter((y) => y >= minY && y <= maxY);
  }, [countries, hiddenCodes, pointsByCountry, range, currentYear]);

  if (allYears.length < 2) return null;

  const visibleCountries = countries.filter((c) => !hiddenCodes.has(c.code));
  const allVals: number[] = [];
  for (const c of visibleCountries) {
    const ym = pointsByCountry.get(c.code);
    if (!ym) continue;
    for (const y of allYears) {
      const p = ym.get(y);
      if (p && p.value > 0) allVals.push(p.value);
    }
  }
  if (allVals.length === 0) return null;

  const minRaw = Math.min(...allVals);
  const maxRaw = Math.max(...allVals);
  const yMin = logScale ? Math.max(1, minRaw * 0.85) : 0;
  const yMax = logScale ? maxRaw * 1.12 : niceCeiling(maxRaw * 1.03);

  const width = 860;
  const height = 340;
  const padL = 72;
  const padR = 112;
  const padT = 20;
  const padB = 34;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const minYear = allYears[0];
  const maxYear = allYears[allYears.length - 1];
  const xOfYear = (y: number) =>
    padL +
    (maxYear === minYear ? chartW / 2 : ((y - minYear) / (maxYear - minYear)) * chartW);

  const yOfVal = (v: number) => {
    if (logScale) {
      const lo = Math.log10(yMin);
      const hi = Math.log10(yMax);
      const lv = Math.log10(Math.max(yMin, v));
      return padT + chartH - ((lv - lo) / Math.max(0.0001, hi - lo)) * chartH;
    }
    return padT + chartH - ((v - yMin) / Math.max(0.0001, yMax - yMin)) * chartH;
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => {
    const v = logScale
      ? Math.pow(10, Math.log10(yMin) + (Math.log10(yMax) - Math.log10(yMin)) * r)
      : yMin + (yMax - yMin) * r;
    return { v, y: yOfVal(v) };
  });

  const xTickStep =
    allYears.length > 42 ? 10 : allYears.length > 20 ? 5 : allYears.length > 12 ? 2 : 1;
  const xTicks = allYears.filter((y, idx) => {
    if (idx === 0 || idx === allYears.length - 1) return true;
    if (y % xTickStep !== 0) return false;
    // Prevent label crowding right next to the last year
    if (maxYear - y < Math.max(2, xTickStep * 0.45)) return false;
    return true;
  });

  const activeYear =
    hoveredYear !== null && allYears.includes(hoveredYear)
      ? hoveredYear
      : allYears.includes(currentYear)
        ? currentYear
        : allYears[allYears.length - 1];

  const readoutRows = countries
    .map((c, idx) => {
      const pt = pointsByCountry.get(c.code)?.get(activeYear);
      return {
        country: c,
        color: COMPARE_COLORS[idx % COMPARE_COLORS.length],
        value: pt?.value,
        hidden: hiddenCodes.has(c.code),
      };
    })
    .sort((a, b) => {
      if (a.hidden !== b.hidden) return a.hidden ? 1 : -1;
      return (b.value ?? -1) - (a.value ?? -1);
    });

  // Direct end-of-line labels with vertical anti-collision spacing
  const endLabelsRaw = visibleCountries
    .map((c) => {
      const idx = countries.findIndex((x) => x.code === c.code);
      const ym = pointsByCountry.get(c.code);
      if (!ym) return null;
      let lastY: number | null = null;
      let lastVal: number | null = null;
      for (let i = allYears.length - 1; i >= 0; i--) {
        const p = ym.get(allYears[i]);
        if (p) {
          lastY = allYears[i];
          lastVal = p.value;
          break;
        }
      }
      if (lastY === null || lastVal === null) return null;
      return {
        code: c.code,
        label: countryName(c.code, c.name, lang),
        color: COMPARE_COLORS[idx % COMPARE_COLORS.length],
        rawY: yOfVal(lastVal),
        y: yOfVal(lastVal),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.rawY - b.rawY);

  const minGap = 16;
  for (let i = 1; i < endLabelsRaw.length; i++) {
    if (endLabelsRaw[i].y - endLabelsRaw[i - 1].y < minGap) {
      endLabelsRaw[i].y = endLabelsRaw[i - 1].y + minGap;
    }
  }
  const bottomLimit = padT + chartH - 4;
  if (
    endLabelsRaw.length > 0 &&
    endLabelsRaw[endLabelsRaw.length - 1].y > bottomLimit
  ) {
    endLabelsRaw[endLabelsRaw.length - 1].y = bottomLimit;
    for (let i = endLabelsRaw.length - 2; i >= 0; i--) {
      if (endLabelsRaw[i + 1].y - endLabelsRaw[i].y < minGap) {
        endLabelsRaw[i].y = Math.max(padT + 8, endLabelsRaw[i + 1].y - minGap);
      }
    }
  }

  const metricTabs: { key: ChartMetric; label: string }[] = [
    ...metrics.map((m) => ({ key: m as ChartMetric, label: t[m] })),
    { key: "pop", label: popLabel(lang) },
  ];

  const rangeTabs: { key: RangeKey; label: string }[] = [
    { key: "all", label: ko ? "전체 (1980~)" : "All (1980–)" },
    { key: "1990", label: "1990~" },
    { key: "2000", label: "2000~" },
    { key: "10y", label: ko ? "최근 10년" : "10Y" },
    { key: "forecast", label: ko ? "전망 포함 (~2031)" : "Forecast (~2031)" },
  ];

  function toggleCountry(code: string) {
    setHiddenCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else if (countries.length - next.size > 1) {
        next.add(code);
      }
      return next;
    });
  }

  const sliceW = Math.max(10, chartW / Math.max(1, allYears.length));
  const forecastBoundaryX =
    range === "forecast" && allYears.includes(currentYear)
      ? xOfYear(currentYear)
      : null;

  return (
    <section className="panel compare-chart-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">{ko ? "장기 추이 비교" : "HISTORICAL COMPARISON"}</p>
          <h2>
            {metric === "pop" ? popLabel(lang) : t[metric]}{" "}
            <span className="trend-range">
              ({minYear}–{maxYear})
            </span>
          </h2>
        </div>
        <div className="tabs" role="tablist">
          {metricTabs.map((mt) => (
            <button
              key={mt.key}
              type="button"
              role="tab"
              aria-selected={metric === mt.key}
              className={metric === mt.key ? "tab-btn active" : "tab-btn"}
              onClick={() => setMetric(mt.key)}
            >
              {mt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="compare-chart-controls">
        <div className="compare-range-pills">
          {rangeTabs.map((rt) => (
            <button
              key={rt.key}
              type="button"
              className={`pill ${range === rt.key ? "active" : ""}`}
              onClick={() => {
                setRange(rt.key);
                setHoveredYear(null);
              }}
            >
              {rt.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`pill ${logScale ? "active" : ""}`}
          onClick={() => setLogScale((v) => !v)}
          title={ko ? "로그 스케일 전환 (장기 성장률 비교에 유용)" : "Toggle logarithmic scale"}
        >
          {logScale ? (ko ? "로그 축 ON" : "Log ON") : ko ? "로그 축" : "Log scale"}
        </button>
      </div>

      <div className="compare-chart-readout">
        <span className="compare-readout-year mono">{activeYear}</span>
        <div className="compare-readout-items">
          {readoutRows.map(({ country, color, value, hidden }) => (
            <button
              key={country.code}
              type="button"
              className={`compare-readout-chip ${hidden ? "off" : ""}`}
              onClick={() => toggleCountry(country.code)}
              title={
                value
                  ? `${fullAmount(value, lang)} (${ko ? "클릭하여 표시 전환" : "Click to toggle"})`
                  : undefined
              }
            >
              <i style={{ background: hidden ? "var(--muted)" : color }} />
              <CountryFlag code={country.code} size="sm" />
              <span className="compare-readout-name">
                {countryName(country.code, country.name, lang)}
              </span>
              <strong className="mono">{formatVal(value, metric, lang)}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="trend-svg-wrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="trend-svg"
          role="img"
          aria-label={`${metric} ${minYear}-${maxYear}`}
        >
          {forecastBoundaryX !== null && (
            <rect
              x={forecastBoundaryX}
              y={padT}
              width={width - padR - forecastBoundaryX}
              height={chartH}
              className="forecast-zone"
            />
          )}

          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={padL}
                y1={tick.y}
                x2={width - padR}
                y2={tick.y}
                className="chart-grid"
              />
              <text
                x={padL - 10}
                y={tick.y + 4}
                textAnchor="end"
                className="chart-axis-text"
              >
                {formatVal(tick.v, metric, lang)}
              </text>
            </g>
          ))}

          {xTicks.map((y) => (
            <text
              key={y}
              x={xOfYear(y)}
              y={height - 10}
              textAnchor="middle"
              className={`chart-axis-text ${y === activeYear ? "active" : ""}`}
            >
              {y}
            </text>
          ))}

          <line
            x1={xOfYear(activeYear)}
            y1={padT}
            x2={xOfYear(activeYear)}
            y2={padT + chartH}
            className="chart-cursor"
          />

          {countries.map((c, idx) => {
            if (hiddenCodes.has(c.code)) return null;
            const color = COMPARE_COLORS[idx % COMPARE_COLORS.length];
            const ym = pointsByCountry.get(c.code);
            if (!ym) return null;

            const pts = allYears
              .map((y) => {
                const p = ym.get(y);
                return p
                  ? { year: y, x: xOfYear(y), y: yOfVal(p.value), status: p.status }
                  : null;
              })
              .filter((p): p is NonNullable<typeof p> => p !== null);

            if (pts.length < 2) return null;

            const toPath = (list: typeof pts) =>
              list
                .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                .join(" ");

            const splitForecast = range === "forecast";
            const firstForecast = splitForecast
              ? pts.findIndex((p) => p.year > currentYear)
              : -1;
            const actualPts =
              firstForecast === -1
                ? pts
                : firstForecast === 0
                  ? []
                  : pts.slice(0, firstForecast);
            const forecastPts =
              firstForecast === -1
                ? []
                : firstForecast === 0
                  ? pts
                  : pts.slice(firstForecast - 1);

            const activePt = pts.find((p) => p.year === activeYear);

            return (
              <g key={c.code}>
                {actualPts.length >= 2 && (
                  <path
                    d={toPath(actualPts)}
                    fill="none"
                    stroke={color}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {forecastPts.length >= 2 && (
                  <path
                    d={toPath(forecastPts)}
                    fill="none"
                    stroke={color}
                    strokeWidth={2.2}
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.85}
                  />
                )}
                {activePt && (
                  <circle
                    cx={activePt.x}
                    cy={activePt.y}
                    r={5}
                    fill={color}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                )}
              </g>
            );
          })}

          {endLabelsRaw.map((el) => (
            <g key={el.code}>
              <circle cx={width - padR + 8} cy={el.y} r={3.5} fill={el.color} />
              <text
                x={width - padR + 16}
                y={el.y + 4}
                className="chart-end-label"
                fill={el.color}
              >
                {el.label.length > 10 ? `${el.label.slice(0, 9)}…` : el.label}
              </text>
            </g>
          ))}

          {allYears.map((y) => (
            <rect
              key={y}
              x={xOfYear(y) - sliceW / 2}
              y={padT}
              width={sliceW}
              height={chartH + 20}
              fill="transparent"
              style={{ cursor: "crosshair" }}
              onMouseEnter={() => setHoveredYear(y)}
              onClick={() => setHoveredYear(y)}
            />
          ))}
        </svg>
      </div>

      <div className="compare-chart-footer">
        <span className="muted">
          {ko
            ? "차트 위를 움직여 연도별 비교 · 상단 국가 칩 클릭으로 선 숨김/표시"
            : "Hover chart to compare by year · Click country chips above to toggle lines"}
        </span>
        <span className="muted">IMF WEO (1980–2031)</span>
      </div>
    </section>
  );
}
