import isoCountries from "i18n-iso-countries";

const EXTRA_ALPHA2: Record<string, string> = {
  XKX: "xk",
  KOS: "xk",
  PSE: "ps",
  WBG: "ps",
  TWN: "tw",
  HKG: "hk",
  MAC: "mo",
  CHI: "je",
};

export function alpha2Of(code: string): string | null {
  const upper = code.toUpperCase();
  if (EXTRA_ALPHA2[upper]) return EXTRA_ALPHA2[upper];
  const a2 = isoCountries.alpha3ToAlpha2(upper);
  return a2 ? a2.toLowerCase() : null;
}

export default function CountryFlag({
  code,
  size = "md",
}: {
  code: string;
  size?: "sm" | "md" | "lg";
}) {
  const iso2 = alpha2Of(code);
  if (!iso2) return null;
  const dims =
    size === "sm"
      ? { w: 18, h: 13 }
      : size === "lg"
        ? { w: 32, h: 22 }
        : { w: 24, h: 17 };
  return (
    <img
      src={`https://flagcdn.com/w40/${iso2}.png`}
      srcSet={`https://flagcdn.com/w80/${iso2}.png 2x`}
      width={dims.w}
      height={dims.h}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className={`country-flag country-flag-${size}`}
    />
  );
}
