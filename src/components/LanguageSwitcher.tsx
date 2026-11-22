"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { WORLD_LOCALES, localeMeta, type Locale } from "@/lib/locales";

function SwitcherInner({ lang }: { lang: Locale }) {
  const path = usePathname() || `/${lang}`;
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const suffix = qs ? `?${qs}` : "";

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = localeMeta(lang);

  const hrefFor = (code: string) =>
    path.replace(/^\/[a-z]{2}(?=\/|$)/, `/${code}`) + suffix;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    inputRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? WORLD_LOCALES.filter(
        (l) =>
          l.nativeName.toLowerCase().includes(q) ||
          l.englishName.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q),
      )
    : WORLD_LOCALES;
  const popular = WORLD_LOCALES.filter((l) => l.popular);

  return (
    <div className="lang-switcher" ref={containerRef}>
      <button
        type="button"
        className="lang-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Language: ${current.nativeName}`}
        onClick={() => setOpen((v) => !v)}
      >
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
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="lang-current">{current.nativeName}</span>
        <span className="lang-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="lang-popover" role="dialog" aria-label="Select language">
          <div className="lang-search-wrap">
            <input
              ref={inputRef}
              type="search"
              className="lang-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                lang === "ko"
                  ? `언어 검색 (${WORLD_LOCALES.length}개 언어)...`
                  : `Search ${WORLD_LOCALES.length} languages...`
              }
            />
          </div>

          <div className="lang-list" role="listbox">
            {!q && (
              <>
                <p className="lang-group-label">
                  {lang === "ko" ? "주요 언어" : "Popular"}
                </p>
                {popular.map((l) => (
                  <Link
                    key={`pop-${l.code}`}
                    href={hrefFor(l.code)}
                    hrefLang={l.code}
                    className={`lang-item ${l.code === lang ? "active" : ""}`}
                    aria-current={l.code === lang ? "true" : undefined}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <span className="lang-names">
                      <strong>{l.nativeName}</strong>
                      <small>{l.englishName}</small>
                    </span>
                    <span className="lang-code">{l.code.toUpperCase()}</span>
                  </Link>
                ))}
                <p className="lang-group-label">
                  {lang === "ko"
                    ? `전체 언어 (${WORLD_LOCALES.length})`
                    : `All languages (${WORLD_LOCALES.length})`}
                </p>
              </>
            )}

            {filtered.length === 0 ? (
              <p className="lang-empty">
                {lang === "ko" ? "검색 결과가 없습니다." : "No matching language."}
              </p>
            ) : (
              filtered.map((l) => (
                <Link
                  key={l.code}
                  href={hrefFor(l.code)}
                  hrefLang={l.code}
                  className={`lang-item ${l.code === lang ? "active" : ""}`}
                  aria-current={l.code === lang ? "true" : undefined}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <span className="lang-names">
                    <strong>{l.nativeName}</strong>
                    <small>{l.englishName}</small>
                  </span>
                  <span className="lang-code">{l.code.toUpperCase()}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LanguageSwitcher({ lang }: { lang: Locale }) {
  const current = localeMeta(lang);
  return (
    <Suspense
      fallback={
        <div className="lang-switcher">
          <span className="lang-trigger">{current.nativeName}</span>
        </div>
      }
    >
      <SwitcherInner lang={lang} />
    </Suspense>
  );
}
