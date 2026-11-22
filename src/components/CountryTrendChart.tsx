"use client";
import { useState } from "react";
import {
  metrics,
  metricAmount,
  fullAmount,
  type Metric,
  type Observation,
} from "@/lib/api";
import { dictionary, type Locale } from "@/lib/i18n";
import { statusName } from "@/components/Provenance";

export default function CountryTrendChart({
  observations,
  lang,
}: {
  observations: Observation[];
  lang: Locale;
}) {
  const t = dictionary(lang);
  const [metric, setMetric] = useState<Metric>("gdp");
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const series = observations
    .filter((o) => o.indicator === metric)
    .sort((a, b) => a.year - b.year);

  if (series.length < 2) return null;

  const width = 760;
  const height = 250;
  const padL = 68;
  const padR = 24;
  const padT = 24;
  const padB = 34;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const values = series.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const yMin = Math.max(0, minVal * 0.85);
  const yMax = maxVal === yMin ? maxVal * 1.2 || 1 : maxVal * 1.08;

  const xOf = (idx: number) =>
    padL + (series.length === 1 ? chartW / 2 : (idx / (series.length - 1)) * chartW);
  const yOf = (val: number) =>
    padT + chartH - ((val - yMin) / (yMax - yMin)) * chartH;

  const points = series.map((d, idx) => ({
    ...d,
    idx,
    x: xOf(idx),
    y: yOf(d.value),
  }));

  const firstForecastIdx = points.findIndex((p) => p.status !== "ACTUAL");
  const actualPoints =
    firstForecastIdx === -1
      ? points
      : firstForecastIdx === 0
        ? []
        : points.slice(0, firstForecastIdx);
  const forecastPoints =
    firstForecastIdx === -1
      ? []
      : firstForecastIdx === 0
        ? points
        : points.slice(firstForecastIdx - 1);

  const toLine = (pts: typeof points) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const fullAreaPath = `${toLine(points)} L${points[points.length - 1].x.toFixed(1)},${(padT + chartH).toFixed(1)} L${points[0].x.toFixed(1)},${(padT + chartH).toFixed(1)} Z`;

  const activePoint =
    points.find((p) => p.year === hoveredYear) ??
    points.find((p) => p.year === new Date().getUTCFullYear()) ??
    points[points.length - 1];

  const prevPoint = points.find((p) => p.year === activePoint.year - 1);
  const yoyPct =
    prevPoint && prevPoint.value > 0
      ? ((activePoint.value - prevPoint.value) / prevPoint.value) * 100
      : null;

  const yTicks = [0, 0.5, 1].map((r) => {
    const v = yMin + (yMax - yMin) * r;
    return { v, y: yOf(v) };
  });

  const unitLabel = metric === "ppp" ? "Int$" : "US$";

  return (
    <section className="panel trend-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">{t.trajectory}</p>
          <h2>
            {t[metric]}{" "}
            <span className="trend-range">
              ({series[0].year}–{series[series.length - 1].year})
            </span>
          </h2>
        </div>
        <div className="tabs" role="tablist" aria-label={t[metric]}>
          {metrics.map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={m === metric}
              className={m === metric ? "tab-btn active" : "tab-btn"}
              onClick={() => {
                setMetric(m);
                setHoveredYear(null);
              }}
            >
              {t[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="trend-readout">
        <div className="trend-readout-main">
          <span className="trend-year mono">{activePoint.year}</span>
          <strong
            className="trend-val mono"
            title={fullAmount(activePoint.value, lang)}
          >
            {metricAmount(activePoint.value, metric, lang)}{" "}
            <small>{unitLabel}</small>
          </strong>
          <span
            className={`value-status ${activePoint.status === "ACTUAL" ? "actual" : "forecast"}`}
          >
            {statusName(activePoint.status, lang)}
          </span>
          {yoyPct !== null && (
            <span className={`delta-pill ${yoyPct >= 0 ? "up" : "down"}`}>
              {yoyPct >= 0 ? "+" : ""}
              {yoyPct.toFixed(1)}% YoY
            </span>
          )}
        </div>
        <div className="trend-legend">
          <span>
            <i className="legend-line actual" />
            {statusName("ACTUAL", lang)}
          </span>
          <span>
            <i className="legend-line forecast" />
            {statusName("ESTIMATE_OR_FORECAST", lang)}
          </span>
        </div>
      </div>

      <div className="trend-svg-wrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="trend-svg"
          role="img"
          aria-label={`${t[metric]} ${series[0].year}-${series[series.length - 1].year}`}
        >
          <defs>
            <linearGradient id="statagoraArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b89a" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#14b89a" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {firstForecastIdx > 0 && (
            <rect
              x={points[firstForecastIdx - 1].x}
              y={padT}
              width={width - padR - points[firstForecastIdx - 1].x}
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
                {metricAmount(tick.v, metric, lang)}
              </text>
            </g>
          ))}

          <path d={fullAreaPath} fill="url(#statagoraArea)" />

          {actualPoints.length >= 2 && (
            <path
              d={toLine(actualPoints)}
              fill="none"
              className="chart-line actual"
            />
          )}

          {forecastPoints.length >= 2 && (
            <path
              d={toLine(forecastPoints)}
              fill="none"
              className="chart-line forecast"
            />
          )}

          {points.map((p) => {
            const isActive = p.year === activePoint.year;
            return (
              <g
                key={p.year}
                className="chart-point-group"
                onMouseEnter={() => setHoveredYear(p.year)}
                onFocus={() => setHoveredYear(p.year)}
                tabIndex={0}
              >
                <rect
                  x={p.x - 20}
                  y={padT}
                  width={40}
                  height={chartH + 24}
                  fill="transparent"
                />
                {isActive && (
                  <line
                    x1={p.x}
                    y1={padT}
                    x2={p.x}
                    y2={padT + chartH}
                    className="chart-cursor"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isActive ? 6 : 4}
                  className={`chart-dot ${p.status === "ACTUAL" ? "actual" : "forecast"} ${isActive ? "active" : ""}`}
                />
                <text
                  x={p.x}
                  y={height - 10}
                  textAnchor="middle"
                  className={`chart-axis-text ${isActive ? "active" : ""}`}
                >
                  {p.year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
