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
      <div>
        <p className="eyebrow">
          {lang === "ko" ? "데이터 출처와 갱신" : "SOURCES & UPDATES"}
        </p>
        <p>
          {lang === "ko"
            ? "같은 기준연도·출처로 비교합니다. 추정·전망은 발표 이후 수정될 수 있습니다."
            : "Comparisons use a common year and source. Estimates and forecasts may be revised."}
        </p>
      </div>
      <div className="source-cards">
        {releases.map((item) => (
          <a
            className="source-card"
            key={item.provider + "|" + item.publishedAt}
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            <strong>{item.source}</strong>
            <span>{editionName(item, lang)}</span>
            <small>
              {lang === "ko" ? "수집" : "Retrieved"}{" "}
              {item.retrievedAt.slice(0, 10)}
            </small>
          </a>
        ))}
      </div>
      <p className="refresh-note">
        {lang === "ko"
          ? "서버에서 6시간마다 새 발표와 수정치를 확인합니다."
          : "The server checks for new releases and revisions every 6 hours."}
        {checkedAt && (
          <>
            {" "}
            · {lang === "ko" ? "최근 확인" : "Last checked"}{" "}
            {checkedAt.slice(0, 16).replace("T", " ")} UTC
          </>
        )}
      </p>
      <p className="refresh-note">
        {lang === "ko"
          ? "명목 GDP·수출: 당해 미국 달러 · PPP: 당해 국제달러 · 수출: 재화 및 서비스 · 결측값은 추정하지 않습니다."
          : "GDP and exports: current US dollars · PPP: current international dollars · Exports include goods and services · Missing values are not estimated."}
      </p>
    </aside>
  );
}
