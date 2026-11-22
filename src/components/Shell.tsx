import Link from "next/link";
import { dictionary, type Locale } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
export default function Shell({
  lang,
  children,
}: {
  lang: Locale;
  children: React.ReactNode;
}) {
  const t = dictionary(lang);
  return (
    <>
      <a href="#main" className="skip">
        {lang === "ko" ? "본문으로 이동" : "Skip to content"}
      </a>
      <header className="header">
        <div className="container header-inner">
          <Link href={`/${lang}`} className="brand" aria-label="StatAgora home">
            <span className="brand-mark" aria-hidden="true">
              ▥
            </span>
            Stat<span>Agora</span>
          </Link>
          <nav aria-label={lang === "ko" ? "주 메뉴" : "Main navigation"}>
            <Link href={`/${lang}`}>{t.rankings}</Link>
            <Link href={`/${lang}/compare`}>{t.compare}</Link>
            <Link href={`/${lang}/community`}>{t.community}</Link>
          </nav>
          <LanguageSwitcher lang={lang} />
        </div>
      </header>
      <main id="main" className="container">
        {children}
      </main>
      <footer className="container footer">
        <strong>StatAgora</strong>
        <span>{t.policy}</span>
        <a href="https://data.worldbank.org" target="_blank" rel="noreferrer">
          World Bank Open Data
        </a>
      </footer>
    </>
  );
}
