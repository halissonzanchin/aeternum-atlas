import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "../i18n";

const LanguageContext = createContext(null);

const DEFAULT_LANGUAGE = "pt";
const STORAGE_KEY = "aeternum_language";

const availableLanguages = [
  { code: "pt", label: "Português", nativeName: "Português", flag: "🇧🇷" },
  { code: "es", label: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "de", label: "German", nativeName: "Deutsch", flag: "🇩🇪" }
];

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
    return translations[savedLanguage] ? savedLanguage : DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => {
    function setLanguage(nextLanguage) {
      if (!translations[nextLanguage]) return;
      setLanguageState(nextLanguage);
    }

    function t(key, params = {}) {
      const ptValue = getNestedValue(translations.pt, key);
      const translatedValue = getNestedValue(translations[language], key) ?? ptValue ?? key;

      if (typeof translatedValue !== "string") return translatedValue;

      return translatedValue.replace(/\{\{(.*?)\}\}/g, (_, paramKey) => {
        const cleanKey = paramKey.trim();
        return params[cleanKey] ?? "";
      });
    }

    return {
      language,
      setLanguage,
      t,
      availableLanguages
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

function getNestedValue(obj, path) {
  if (!path || typeof path !== 'string') return undefined;
  return path.split(".").reduce((acc, part) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, part)) {
      return acc[part];
    }
    return undefined;
  }, obj);
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
