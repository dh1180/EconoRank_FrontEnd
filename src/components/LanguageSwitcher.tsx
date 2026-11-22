"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
export default function LanguageSwitcher({ lang }: { lang: Locale }) {
  const path = usePathname();
  return (
    <div className="locale">
      <Link
        href={path.replace(/^\/(en|ko)(?=\/|$)/, "/en")}
        hrefLang="en"
        aria-current={lang === "en" ? "true" : undefined}
      >
        EN
      </Link>
      <span>/</span>
      <Link
        href={path.replace(/^\/(en|ko)(?=\/|$)/, "/ko")}
        hrefLang="ko"
        aria-current={lang === "ko" ? "true" : undefined}
      >
        한국어
      </Link>
    </div>
  );
}
