export type LocaleMeta = {
  code: string;
  nativeName: string;
  englishName: string;
  rtl?: boolean;
  popular?: boolean;
};

export const WORLD_LOCALES: readonly LocaleMeta[] = [
  { code: "en", nativeName: "English", englishName: "English", popular: true },
  { code: "ko", nativeName: "한국어", englishName: "Korean", popular: true },
  { code: "ja", nativeName: "日本語", englishName: "Japanese", popular: true },
  { code: "zh", nativeName: "中文", englishName: "Chinese", popular: true },
  { code: "es", nativeName: "Español", englishName: "Spanish", popular: true },
  { code: "fr", nativeName: "Français", englishName: "French", popular: true },
  { code: "de", nativeName: "Deutsch", englishName: "German", popular: true },
  { code: "pt", nativeName: "Português", englishName: "Portuguese", popular: true },
  { code: "ru", nativeName: "Русский", englishName: "Russian", popular: true },
  { code: "ar", nativeName: "العربية", englishName: "Arabic", rtl: true, popular: true },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", popular: true },
  { code: "id", nativeName: "Bahasa Indonesia", englishName: "Indonesian", popular: true },
  { code: "vi", nativeName: "Tiếng Việt", englishName: "Vietnamese" },
  { code: "th", nativeName: "ไทย", englishName: "Thai" },
  { code: "tr", nativeName: "Türkçe", englishName: "Turkish" },
  { code: "it", nativeName: "Italiano", englishName: "Italian" },
  { code: "nl", nativeName: "Nederlands", englishName: "Dutch" },
  { code: "pl", nativeName: "Polski", englishName: "Polish" },
  { code: "uk", nativeName: "Українська", englishName: "Ukrainian" },
  { code: "bn", nativeName: "বাংলা", englishName: "Bengali" },
  { code: "ur", nativeName: "اردو", englishName: "Urdu", rtl: true },
  { code: "fa", nativeName: "فارسی", englishName: "Persian", rtl: true },
  { code: "he", nativeName: "עברית", englishName: "Hebrew", rtl: true },
  { code: "ms", nativeName: "Bahasa Melayu", englishName: "Malay" },
  { code: "tl", nativeName: "Filipino", englishName: "Filipino / Tagalog" },
  { code: "sv", nativeName: "Svenska", englishName: "Swedish" },
  { code: "no", nativeName: "Norsk", englishName: "Norwegian" },
  { code: "da", nativeName: "Dansk", englishName: "Danish" },
  { code: "fi", nativeName: "Suomi", englishName: "Finnish" },
  { code: "cs", nativeName: "Čeština", englishName: "Czech" },
  { code: "hu", nativeName: "Magyar", englishName: "Hungarian" },
  { code: "ro", nativeName: "Română", englishName: "Romanian" },
  { code: "el", nativeName: "Ελληνικά", englishName: "Greek" },
  { code: "sk", nativeName: "Slovenčina", englishName: "Slovak" },
  { code: "bg", nativeName: "Български", englishName: "Bulgarian" },
  { code: "hr", nativeName: "Hrvatski", englishName: "Croatian" },
  { code: "sr", nativeName: "Српски", englishName: "Serbian" },
  { code: "sl", nativeName: "Slovenščina", englishName: "Slovenian" },
  { code: "lt", nativeName: "Lietuvių", englishName: "Lithuanian" },
  { code: "lv", nativeName: "Latviešu", englishName: "Latvian" },
  { code: "et", nativeName: "Eesti", englishName: "Estonian" },
  { code: "is", nativeName: "Íslenska", englishName: "Icelandic" },
  { code: "ga", nativeName: "Gaeilge", englishName: "Irish" },
  { code: "cy", nativeName: "Cymraeg", englishName: "Welsh" },
  { code: "ca", nativeName: "Català", englishName: "Catalan" },
  { code: "eu", nativeName: "Euskara", englishName: "Basque" },
  { code: "gl", nativeName: "Galego", englishName: "Galician" },
  { code: "sq", nativeName: "Shqip", englishName: "Albanian" },
  { code: "mk", nativeName: "Македонски", englishName: "Macedonian" },
  { code: "bs", nativeName: "Bosanski", englishName: "Bosnian" },
  { code: "mt", nativeName: "Malti", englishName: "Maltese" },
  { code: "sw", nativeName: "Kiswahili", englishName: "Swahili" },
  { code: "af", nativeName: "Afrikaans", englishName: "Afrikaans" },
  { code: "am", nativeName: "አማርኛ", englishName: "Amharic" },
  { code: "ha", nativeName: "Hausa", englishName: "Hausa" },
  { code: "yo", nativeName: "Yorùbá", englishName: "Yoruba" },
  { code: "zu", nativeName: "isiZulu", englishName: "Zulu" },
  { code: "so", nativeName: "Soomaali", englishName: "Somali" },
  { code: "ta", nativeName: "தமிழ்", englishName: "Tamil" },
  { code: "te", nativeName: "తెలుగు", englishName: "Telugu" },
  { code: "mr", nativeName: "मराठी", englishName: "Marathi" },
  { code: "gu", nativeName: "ગુજરાતી", englishName: "Gujarati" },
  { code: "kn", nativeName: "ಕನ್ನಡ", englishName: "Kannada" },
  { code: "ml", nativeName: "മലയാളം", englishName: "Malayalam" },
  { code: "pa", nativeName: "ਪੰਜਾਬੀ", englishName: "Punjabi" },
  { code: "ne", nativeName: "नेपाली", englishName: "Nepali" },
  { code: "si", nativeName: "සිංහල", englishName: "Sinhala" },
  { code: "my", nativeName: "မြန်မာ", englishName: "Burmese" },
  { code: "km", nativeName: "ខ្មែរ", englishName: "Khmer" },
  { code: "lo", nativeName: "ລາວ", englishName: "Lao" },
  { code: "mn", nativeName: "Монгол", englishName: "Mongolian" },
  { code: "kk", nativeName: "Қазақша", englishName: "Kazakh" },
  { code: "uz", nativeName: "Oʻzbekcha", englishName: "Uzbek" },
  { code: "az", nativeName: "Azərbaycan", englishName: "Azerbaijani" },
  { code: "ka", nativeName: "ქართული", englishName: "Georgian" },
  { code: "hy", nativeName: "Հայերեն", englishName: "Armenian" },
  { code: "ps", nativeName: "پښتو", englishName: "Pashto", rtl: true },
  { code: "ku", nativeName: "کوردی", englishName: "Kurdish", rtl: true },
] as const;

export const locales = WORLD_LOCALES.map((l) => l.code);
export type Locale = (typeof WORLD_LOCALES)[number]["code"];

const LOCALE_MAP = new Map<string, LocaleMeta>(
  WORLD_LOCALES.map((l) => [l.code, l]),
);

export function isLocale(value: string): value is Locale {
  return LOCALE_MAP.has(value);
}

export function localeMeta(code: string): LocaleMeta {
  return LOCALE_MAP.get(code) ?? WORLD_LOCALES[0];
}

export function isRtl(code: string): boolean {
  return Boolean(LOCALE_MAP.get(code)?.rtl);
}

const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  KR: "ko", KOR: "ko",
  JP: "ja", JPN: "ja",
  CN: "zh", CHN: "zh", TW: "zh", TWN: "zh", HK: "zh", HKG: "zh", MO: "zh", MAC: "zh",
  ES: "es", ESP: "es", MX: "es", MEX: "es", AR: "es", ARG: "es", CO: "es", COL: "es",
  CL: "es", CHL: "es", PE: "es", PER: "es", VE: "es", VEN: "es", EC: "es", ECU: "es",
  UY: "es", URY: "es", PY: "es", PRY: "es", BO: "es", BOL: "es", CR: "es", CRI: "es",
  PA: "es", PAN: "es", DO: "es", DOM: "es", GT: "es", GTM: "es", HN: "es", HND: "es",
  FR: "fr", FRA: "fr", BE: "fr", BEL: "fr", MC: "fr", MCO: "fr", LU: "fr", LUX: "fr",
  SN: "fr", SEN: "fr", CI: "fr", CIV: "fr",
  DE: "de", DEU: "de", AT: "de", AUT: "de", CH: "de", CHE: "de", LI: "de", LIE: "de",
  BR: "pt", BRA: "pt", PT: "pt", PRT: "pt", AO: "pt", AGO: "pt", MZ: "pt", MOZ: "pt",
  RU: "ru", RUS: "ru", BY: "ru", BLR: "ru",
  SA: "ar", SAU: "ar", AE: "ar", ARE: "ar", EG: "ar", EGY: "ar", QA: "ar", QAT: "ar",
  KW: "ar", KWT: "ar", OM: "ar", OMN: "ar", BH: "ar", BHR: "ar", JO: "ar", JOR: "ar",
  IQ: "ar", IRQ: "ar", LB: "ar", LBN: "ar", MA: "ar", MAR: "ar", DZ: "ar", DZA: "ar",
  TN: "ar", TUN: "ar",
  IN: "hi", IND: "hi",
  BD: "bn", BGD: "bn",
  PK: "ur", PAK: "ur",
  ID: "id", IDN: "id",
  VN: "vi", VNM: "vi",
  TH: "th", THA: "th",
  TR: "tr", TUR: "tr",
  IT: "it", ITA: "it",
  NL: "nl", NLD: "nl",
  PL: "pl", POL: "pl",
  UA: "uk", UKR: "uk",
  SE: "sv", SWE: "sv",
  NO: "no", NOR: "no",
  DK: "da", DNK: "da",
  FI: "fi", FIN: "fi",
  CZ: "cs", CZE: "cs",
  HU: "hu", HUN: "hu",
  RO: "ro", ROU: "ro",
  GR: "el", GRC: "el",
  IL: "he", ISR: "he",
  IR: "fa", IRN: "fa",
  MY: "ms", MYS: "ms",
  PH: "tl", PHL: "tl",
  KE: "sw", KEN: "sw", TZ: "sw", TZA: "sw",
  SK: "sk", SVK: "sk",
  BG: "bg", BGR: "bg",
  HR: "hr", HRV: "hr",
  RS: "sr", SRB: "sr",
  SI: "sl", SVN: "sl",
  LT: "lt", LTU: "lt",
  LV: "lv", LVA: "lv",
  EE: "et", EST: "et",
  IS: "is", ISL: "is",
  KZ: "kk", KAZ: "kk",
  UZ: "uz", UZB: "uz",
  AZ: "az", AZE: "az",
  GE: "ka", GEO: "ka",
  AM: "hy", ARM: "hy",
  MN: "mn", MNG: "mn",
  MM: "my", MMR: "my",
  KH: "km", KHM: "km",
  LA: "lo", LAO: "lo",
  NP: "ne", NPL: "ne",
  LK: "si", LKA: "si",
  ET: "am", ETH: "am",
  SO: "so", SOM: "so",
  AL: "sq", ALB: "sq",
  MK: "mk", MKD: "mk",
  BA: "bs", BIH: "bs",
  MT: "mt", MLT: "mt",
  US: "en", USA: "en", GB: "en", GBR: "en", CA: "en", CAN: "en",
  AU: "en", AUS: "en", NZ: "en", NZL: "en", IE: "en", IRL: "en",
  SG: "en", SGP: "en", ZA: "en", ZAF: "en", NG: "en", NGA: "en",
};

export function countryToLocale(countryCode: string | null | undefined): Locale | null {
  if (!countryCode) return null;
  const key = countryCode.trim().toUpperCase();
  return COUNTRY_TO_LOCALE[key] ?? null;
}

export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase();
    if (!tag) continue;
    const primary = tag.split("-")[0];
    if (isLocale(primary)) return primary;
  }
  return null;
}
