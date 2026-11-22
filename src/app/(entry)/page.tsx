import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  countryToLocale,
  isLocale,
  localeFromAcceptLanguage,
  type Locale,
} from "@/lib/locales";

export const dynamic = "force-dynamic";

async function detectCountryFromBackend(
  forwardedFor: string | null,
  edgeCountry: string | null,
): Promise<string | null> {
  if (edgeCountry) return edgeCountry;
  try {
    const reqHeaders: Record<string, string> = {};
    if (forwardedFor) reqHeaders["X-Forwarded-For"] = forwardedFor;
    const res = await fetch(
      `${process.env.API_BASE_URL || "http://127.0.0.1:8080"}/api/geo`,
      {
        headers: reqHeaders,
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      },
    );
    if (res.ok) {
      const body = (await res.json()) as { countryCode?: string | null };
      return body.countryCode || null;
    }
  } catch {}
  return null;
}

export default async function Home() {
  const cookieStore = await cookies();
  const saved = cookieStore.get("statagora_lang")?.value;
  if (saved && isLocale(saved)) {
    redirect(`/${saved}`);
  }

  const hdrs = await headers();
  const edgeCountry =
    hdrs.get("cf-ipcountry") ||
    hdrs.get("x-vercel-ip-country") ||
    hdrs.get("x-country-code");
  const countryCode = await detectCountryFromBackend(
    hdrs.get("x-forwarded-for"),
    edgeCountry,
  );

  const resolved: Locale =
    countryToLocale(countryCode) ??
    localeFromAcceptLanguage(hdrs.get("accept-language")) ??
    "en";

  redirect(`/${resolved}`);
}
