"use client";
import { useState } from "react";
import { countryName } from "@/lib/geography";
import type { Country } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
export default function CountrySelector({
  countries,
  initial,
  lang,
}: {
  countries: Country[];
  initial: string[];
  lang: Locale;
}) {
  const [selected, setSelected] = useState(initial),
    [query, setQuery] = useState("");
  return (
    <>
      <label htmlFor="country-search">
        {lang === "ko" ? "국가 검색" : "Find a country"}
      </label>
      <input
        id="country-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={
          lang === "ko" ? "국가명 또는 코드" : "Country name or code"
        }
      />
      <p className="muted" aria-live="polite">
        {selected.length} / 5 {lang === "ko" ? "선택" : "selected"}
      </p>
      <div className="selected-countries">
        {selected.map((code) => {
          const c = countries.find((c) => c.code === code);
          return (
            <button
              key={code}
              type="button"
              aria-label={`${lang === "ko" ? "선택 해제" : "Remove"} ${countryName(code, c?.name || code, lang)}`}
              onClick={() =>
                setSelected((s) => s.filter((item) => item !== code))
              }
            >
              {countryName(code, c?.name || code, lang)}{" "}
              <span aria-hidden="true">×</span>
            </button>
          );
        })}
      </div>
      <div className="country-options">
        {countries
          .filter((c) =>
            (countryName(c.code, c.name, lang) + " " + c.name + " " + c.code)
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((c) => (
            <label key={c.code}>
              <input
                type="checkbox"
                checked={selected.includes(c.code)}
                disabled={!selected.includes(c.code) && selected.length >= 5}
                onChange={(e) =>
                  setSelected((s) =>
                    e.target.checked
                      ? [...s, c.code]
                      : s.filter((code) => code !== c.code),
                  )
                }
              />
              <span>
                {countryName(c.code, c.name, lang)} <small>{c.code}</small>
              </span>
            </label>
          ))}
      </div>
      {selected.map((code) => (
        <input key={code} type="hidden" name="country" value={code} />
      ))}
      {selected.length === 0 && <input type="hidden" name="country" value="" />}
    </>
  );
}
