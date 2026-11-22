"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Locale } from "@/lib/i18n";

function SwitcherInner({ lang }: { lang: Locale }) {
  const path = usePathname() || `/${lang}`;
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const suffix = qs ? `?${qs}` : "";
  const enHref = path.replace(/^\/(en|ko)(?=\/|$)/, "/en") + suffix;
  const koHref = path.replace(/^\/(en|ko)(?=\/|$)/, "/ko") + suffix;

  return (
    <div className="locale" role="group" aria-label="Language">
      <Link
        href={enHref}
        hrefLang="en"
        aria-current={lang === "en" ? "true" : undefined}
      >
        EN
      </Link>
      <Link
        href={koHref}
        hrefLang="ko"
        aria-current={lang === "ko" ? "true" : undefined}
      >
        한국어
      </Link>
    </div>
  );
}

export default function LanguageSwitcher({ lang }: { lang: Locale }) {
  return (
    <Suspense
      fallback={
        <div className="locale" role="group" aria-label="Language">
          <Link href="/en" aria-current={lang === "en" ? "true" : undefined}>
            EN
          </Link>
          <Link href="/ko" aria-current={lang === "ko" ? "true" : undefined}>
            한국어
          </Link>
        </div>
      }
    >
      <SwitcherInner lang={lang} />
    </Suspense>
  );
}
