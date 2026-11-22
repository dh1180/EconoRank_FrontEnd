"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

type NavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
};

export default function NavLinks({
  lang,
  labels,
}: {
  lang: Locale;
  labels: {
    rankings: string;
    companies: string;
    compare: string;
    community: string;
  };
}) {
  const pathname = usePathname() || `/${lang}`;
  const items: NavItem[] = [
    {
      href: `/${lang}`,
      label: labels.rankings,
      match: (p) =>
        p === `/${lang}` ||
        p === `/${lang}/` ||
        p.startsWith(`/${lang}/countries`),
    },
    {
      href: `/${lang}/companies`,
      label: labels.companies,
      match: (p) => p.startsWith(`/${lang}/companies`),
    },
    {
      href: `/${lang}/compare`,
      label: labels.compare,
      match: (p) => p.startsWith(`/${lang}/compare`),
    },
    {
      href: `/${lang}/community`,
      label: labels.community,
      match: (p) => p.startsWith(`/${lang}/community`),
    },
  ];

  return (
    <nav aria-label={lang === "ko" ? "주 메뉴" : "Main navigation"}>
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            scroll={false}
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
