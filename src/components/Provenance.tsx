import type { Observation } from "@/lib/api";

export function statusName(status: string, lang: string) {
  return status === "ACTUAL"
    ? lang === "ko"
      ? "실적"
      : "Actual"
    : lang === "ko"
      ? "추정·전망"
      : "Estimate / forecast";
}

export function editionName(
  item: Pick<Observation, "publishedAt" | "edition" | "source">,
  lang: string,
) {
  if (!item.publishedAt) return item.source;
  const date = item.publishedAt.slice(0, 10);
  return lang === "ko"
    ? `${date.slice(0, 4)}년 ${Number(date.slice(5, 7))}월 발표`
    : `Published ${date}`;
}

export default function Provenance({
  items,
  lang,
  checkedAt,
}: {
  items: Observation[];
  lang: string;
  checkedAt?: string;
}) {
  const releases = [
    ...new Map(
      items.map((item) => [item.provider + "|" + item.publishedAt, item]),
    ).values(),
  ];

  return (
    <aside className="provenance">
      <div className="provenance-head">
        <div>
          <p className="eyebrow">
            {lang === "ko" ? "데이터 출처와 갱신" : "SOURCES & METHODOLOGY"}
          </p>
          <p className="provenance-desc">
            {lang === "ko"
              ? "같은 기준연도·출처로 비교합니다. 추정·전망은 발표 이후 수정될 수 있습니다."
              : "Comparisons use a common reference year and source. Estimates and forecasts may be revised."}
          </p>
        </div>
        <div className="sync-pill">
          <span className="sync-dot" aria-hidden="true" />
          <span>
            {lang === "ko" ? "6시간마다 자동 확인" : "Auto-sync every 6h"}
          </span>
        </div>
      </div>

      {releases.length > 0 && (
        <div className="source-cards">
          {releases.map((item) => (
            <a
              className="source-card"
              key={item.provider + "|" + item.publishedAt}
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              <div className="source-card-top">
                <strong>{item.source}</strong>
                <span className="source-arrow" aria-hidden="true">
                  ↗
                </span>
              </div>
              <span className="source-edition">{editionName(item, lang)}</span>
              <small>
                {lang === "ko" ? "수집" : "Retrieved"}{" "}
                {item.retrievedAt.slice(0, 10)}
              </small>
            </a>
          ))}
        </div>
      )}

      <div className="provenance-notes">
        <p className="refresh-note">
          {lang === "ko"
            ? "출처: IMF World Economic Outlook (WEO) · 명목 GDP·1인당 GDP: 당해 미국 달러(US$) · PPP: 당해 국제달러(Int$) · 결측값은 추정하지 않습니다."
            : "Source: IMF World Economic Outlook (WEO) · Nominal GDP & GDP per capita: current US dollars · PPP: current international dollars · Missing values are not estimated."}
        </p>
        {checkedAt && (
          <p className="refresh-note mono">
            {lang === "ko" ? "최근 서버 확인" : "Last verified"}{" "}
            {checkedAt.slice(0, 16).replace("T", " ")} UTC
          </p>
        )}
      </div>
    </aside>
  );
}
