import countries from "i18n-iso-countries";
import korean from "i18n-iso-countries/langs/ko.json" with { type: "json" };

countries.registerLocale(korean);

const EXTRA_ALPHA2: Record<string, string> = {
  XKX: "XK",
  KOS: "XK",
  PSE: "PS",
  WBG: "PS",
  TWN: "TW",
  HKG: "HK",
  MAC: "MO",
  CHI: "JE",
};

const commonKo: Record<string, string> = {
  POL: "폴란드",
  TUR: "튀르키예",
  SWZ: "에스와티니",
  MKD: "북마케도니아",
  KOS: "코소보",
  WBG: "팔레스타인",
  USA: "미국",
  KOR: "대한민국",
  PRK: "북한",
  GBR: "영국",
  RUS: "러시아",
  IRN: "이란",
  SYR: "시리아",
  LAO: "라오스",
  VNM: "베트남",
  VEN: "베네수엘라",
  TZA: "탄자니아",
  COD: "콩고민주공화국",
  COG: "콩고공화국",
  XKX: "코소보",
  UVK: "코소보",
  CHI: "채널 제도",
  TWN: "대만",
  NRU: "나우루",
};

const displayNameCache = new Map<string, Intl.DisplayNames | null>();

function getDisplayNames(lang: string): Intl.DisplayNames | null {
  if (displayNameCache.has(lang)) return displayNameCache.get(lang) ?? null;
  try {
    const dn = new Intl.DisplayNames([lang], { type: "region" });
    displayNameCache.set(lang, dn);
    return dn;
  } catch {
    displayNameCache.set(lang, null);
    return null;
  }
}

export function countryName(code: string, name: string, lang: string) {
  if (lang === "en") return name;
  if (lang === "ko") {
    return commonKo[code] || countries.getName(code, "ko") || name;
  }
  const upper = code.toUpperCase();
  const alpha2 = EXTRA_ALPHA2[upper] || countries.alpha3ToAlpha2(upper);
  if (alpha2) {
    const dn = getDisplayNames(lang);
    const localized = dn?.of(alpha2);
    if (localized && localized !== alpha2) return localized;
  }
  return name;
}

const regionsKo: Record<string, string> = {
  "North America": "북아메리카",
  "East Asia & Pacific": "동아시아·태평양",
  "Europe & Central Asia": "유럽·중앙아시아",
  "Latin America & Caribbean": "라틴아메리카·카리브해",
  "South Asia": "남아시아",
  "Sub-Saharan Africa": "사하라 이남 아프리카",
  "Middle East, North Africa, Afghanistan & Pakistan":
    "중동·북아프리카·아프가니스탄·파키스탄",
  "Middle East & North Africa": "중동·북아프리카",
  "Other economies": "기타 경제권",
};

export function regionName(region: string, lang: string) {
  return lang === "ko" ? regionsKo[region.trim()] || region.trim() : region;
}
