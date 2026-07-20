import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getStoredLanguage, isAppLanguage, saveLanguage } from "@/lib/i18n/languages";
import en from "@/lib/i18n/locales/en.json";
import uz from "@/lib/i18n/locales/uz.json";
import ru from "@/lib/i18n/locales/ru.json";
import zh from "@/lib/i18n/locales/zh.json";

const initialLanguage = getStoredLanguage();
document.documentElement.lang = initialLanguage;

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    uz: { translation: uz },
    ru: { translation: ru },
    zh: { translation: zh },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  supportedLngs: ["en", "uz", "ru", "zh"],
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (language) => {
  if (isAppLanguage(language)) {
    saveLanguage(language);
  }
});

export default i18n;
