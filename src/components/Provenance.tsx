import type { Observation } from "@/lib/api";
import { dictionary, isLocale } from "@/lib/i18n";

export function statusName(status: string, lang: string) {
  const t = dictionary(isLocale(lang) ? lang : "en");
  return status === "ACTUAL" ? t.statusActual : t.statusForecast;
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
  const t = dictionary(isLocale(lang) ? lang : "en");
  const releases = [
    ...new Map(
      items.map((item) => [item.provider + "|" + item.publishedAt, item]),
    ).values(),
  ];

  return (
    <aside className="provenance">
      <div className="provenance-head">
        <div>
          <p className="eyebrow">{t.sourcesHeading}</p>
          <p className="provenance-desc">{t.definition}</p>
        </div>
        <div className="sync-pill">
          <span className="sync-dot" aria-hidden="true" />
          <span>{t.dailySync}</span>
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
                {t.retrieved} {item.retrievedAt.slice(0, 10)}
              </small>
            </a>
          ))}
        </div>
      )}

      <div className="provenance-notes">
        <p className="refresh-note">
          {t.worldbank} · {t.exportNote}
        </p>
        {checkedAt && (
          <p className="refresh-note mono">
            {t.lastUpdated} {checkedAt.slice(0, 16).replace("T", " ")} UTC
          </p>
        )}
      </div>
    </aside>
  );
}
