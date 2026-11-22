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
