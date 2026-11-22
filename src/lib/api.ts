export type Country = { code: string; name: string; region: string };
export type Observation = Country & {
  indicator: string;
  year: number;
  value: number;
  unit: string;
  sourceUrl: string;
  retrievedAt: string;
};
export type Ranking = Observation & { rank: number };
export type RankingPage = {
  items: Ranking[];
  page: number;
  size: number;
  total: number;
  indicator: string;
  year: number;
  source: string;
};
export const metrics = ["gdp", "ppp", "exports"] as const;
export type Metric = (typeof metrics)[number];
export function metricOf(value: string | undefined): Metric {
  return metrics.find((m) => m === value) || "gdp";
}
export function integer(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  const n = Number(value);
  return value !== undefined && Number.isInteger(n) && n >= min && n <= max
    ? n
    : fallback;
}
export async function api<T>(path: string): Promise<T> {
  const response = await fetch(
    `${process.env.API_BASE_URL || "http://127.0.0.1:8080"}/api${path}`,
    { cache: "no-store", signal: AbortSignal.timeout(10000) },
  );
  if (!response.ok) throw new Error(`API returned ${response.status}`);
  return response.json() as Promise<T>;
}
export function amount(value: number | undefined, locale: string) {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}
export function fullAmount(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}
export function comparisonCodes(values: string[]) {
  return [...new Set(values)].filter((c) => /^[A-Z]{3}$/.test(c));
}
