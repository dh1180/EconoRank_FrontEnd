"use client";
import { useState } from "react";
import { countryName } from "@/lib/geography";
import { COMPARE_COLORS } from "@/lib/palette";
import CountryFlag from "@/components/CountryFlag";
import type { Country } from "@/lib/api";
import { dictionary, type Locale } from "@/lib/i18n";

export default function CountrySelector({
  countries,
  initial,
  lang,
}: {
  countries: Country[];
  initial: string[];
  lang: Locale;
}) {
  const t = dictionary(lang);
  const [selected, setSelected] = useState(initial),
    [query, setQuery] = useState("");
  const filtered = countries.filter((c) =>
    (countryName(c.code, c.name, lang) + " " + c.name + " " + c.code)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <>
      <label htmlFor="country-search" className="field-label">
        {t.findCountry}
      </label>
      <input
        id="country-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.countrySearchHint}
      />
      <p className="selection-counter muted" aria-live="polite">
        <strong>{selected.length}</strong> / 5 {t.selectedCount}
      </p>
      <div className="selected-countries">
        {selected.map((code, idx) => {
          const c = countries.find((item) => item.code === code);
          const dotColor = COMPARE_COLORS[idx % COMPARE_COLORS.length];
          return (
            <button
              key={code}
              type="button"
              aria-label={`${lang === "ko" ? "선택 해제" : "Remove"} ${countryName(code, c?.name || code, lang)}`}
              onClick={() =>
                setSelected((s) => s.filter((item) => item !== code))
              }
            >
              <i
                className="chip-dot"
                style={{ background: dotColor }}
                aria-hidden="true"
              />
              <CountryFlag code={code} size="sm" />
              {countryName(code, c?.name || code, lang)}
              <span aria-hidden="true">×</span>
            </button>
          );
        })}
      </div>
      <div className="country-options">
        {filtered.map((c) => {
          const isChecked = selected.includes(c.code);
          return (
            <label key={c.code} className={isChecked ? "is-checked" : undefined}>
              <input
                type="checkbox"
                checked={isChecked}
                disabled={!isChecked && selected.length >= 5}
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
          );
        })}
      </div>
      {selected.map((code) => (
        <input key={code} type="hidden" name="country" value={code} />
      ))}
      {selected.length === 0 && <input type="hidden" name="country" value="" />}
    </>
  );
}
