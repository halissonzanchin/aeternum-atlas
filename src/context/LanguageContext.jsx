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

function getValidLanguage(candidate) {
  if (typeof candidate !== "string") return null;
  const normalized = candidate.trim().toLowerCase();
  return translations[normalized] ? normalized : null;
}

function resolveInitialLanguage() {
  if (typeof window !== "undefined") {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlLang = getValidLanguage(searchParams.get("lang"));
      if (urlLang) {
        return urlLang;
      }

      const savedLanguage = getValidLanguage(window.localStorage.getItem(STORAGE_KEY));
      if (savedLanguage) {
        return savedLanguage;
      }
    } catch (e) {
      // ignore
    }
  }

  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(resolveInitialLanguage);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (e) {
      // ignore
    }
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handlePopState() {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const urlLang = getValidLanguage(searchParams.get("lang"));
        if (urlLang) {
          setLanguageState(urlLang);
        }
      } catch (e) {
        // ignore
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const value = useMemo(() => {
    function setLanguage(nextLanguage) {
      const valid = getValidLanguage(nextLanguage);
      if (!valid) return;
      setLanguageState(valid);

      if (typeof window !== "undefined") {
        try {
          const url = new URL(window.location.href);
          if (url.searchParams.get("lang") !== valid) {
            url.searchParams.set("lang", valid);
            window.history.pushState(window.history.state, "", url.pathname + url.search + url.hash);
          }
        } catch (e) {
          // ignore
        }
      }
    }

    function t(key, params = {}) {
      const ptValue = getNestedValue(translations.pt, key);
      const translatedValue = getNestedValue(translations[language], key) ?? ptValue ?? params.defaultValue ?? key;

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
