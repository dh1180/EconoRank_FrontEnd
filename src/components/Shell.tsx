import Link from "next/link";
import { dictionary, type Locale } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import NavLinks from "./NavLinks";

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
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="3" y="13" width="4" height="8" rx="1.2" fill="currentColor" opacity="0.7" />
                <rect x="10" y="8" width="4" height="13" rx="1.2" fill="currentColor" opacity="0.9" />
                <rect x="17" y="3" width="4" height="18" rx="1.2" fill="currentColor" />
              </svg>
            </span>
            <span className="brand-word">
              Stat<span>Agora</span>
            </span>
          </Link>
          <NavLinks
            lang={lang}
            labels={{
              rankings: t.rankings,
              compare: t.compare,
              community: t.community,
            }}
          />
          <LanguageSwitcher lang={lang} />
        </div>
      </header>
      <main id="main" className="container main-content">
        {children}
      </main>
      <footer className="footer-wrap">
        <div className="container footer">
          <div className="footer-brand">
            <strong>
              Stat<span>Agora</span>
            </strong>
            <span>{t.policy}</span>
          </div>
          <div className="footer-links">
            <a
              href="https://data.imf.org/en/datasets/IMF.RES:WEO"
              target="_blank"
              rel="noreferrer"
            >
              IMF World Economic Outlook (WEO) ↗
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
