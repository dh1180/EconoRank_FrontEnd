export default function SourceSelect({
  source,
  lang,
}: {
  source: string;
  lang: string;
}) {
  return (
    <>
      <label htmlFor="data-source">
        {lang === "ko" ? "데이터 기준" : "Data source"}
      </label>
      <select id="data-source" name="source" defaultValue={source}>
        <option value="auto">
          {lang === "ko" ? "최신 발표 · 자동" : "Latest release · automatic"}
        </option>
        <option value="imf">
          IMF WEO · {lang === "ko" ? "실적·전망" : "actuals & outlook"}
        </option>
        <option value="worldbank">
          World Bank · {lang === "ko" ? "실적" : "actuals"}
        </option>
      </select>
    </>
  );
}
