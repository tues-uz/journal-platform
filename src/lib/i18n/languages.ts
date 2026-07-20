export const LANGUAGE_STORAGE_KEY = "journal-platform-language";

export type AppLanguage = "en" | "uz" | "ru" | "zh";

export interface LanguageOption {
  code: AppLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "uz", label: "Uzbekistan", nativeLabel: "Oʻzbekcha", flag: "🇺🇿" },
  { code: "ru", label: "Russia", nativeLabel: "Русский", flag: "🇷🇺" },
  { code: "zh", label: "China", nativeLabel: "中文", flag: "🇨🇳" },
];

export function getLanguageOption(code: AppLanguage): LanguageOption {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code) ?? SUPPORTED_LANGUAGES[0];
}

export function isAppLanguage(value: string): value is AppLanguage {
  return SUPPORTED_LANGUAGES.some((language) => language.code === value);
}

export function getStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored && isAppLanguage(stored) ? stored : "en";
}

export function saveLanguage(language: AppLanguage) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  document.documentElement.lang = language;
}
