import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  translations,
  formatTranslation,
  LanguageCode,
  TranslationKey,
} from "../constants/translations";

interface I18nContextType {
  currentLang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  toggleLang: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const STORAGE_KEY = "APP_LANG_CODE";

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{
  children: React.ReactNode;
  initialLang?: LanguageCode;
}> = ({ children, initialLang = "vi" }) => {
  // Synchronous web hydration to prevent VI/EN language flash on reload
  const [currentLang, setCurrentLang] = useState<LanguageCode>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem('esp32_lang');
      if (saved === 'vi' || saved === 'en') return saved;
    }
    return initialLang;
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === "vi" || saved === "en") {
          setCurrentLang(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setLang = useCallback((lang: LanguageCode) => {
    setCurrentLang(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, lang);
      window.localStorage.setItem('esp32_lang', lang);
    }
  }, []);

  const toggleLang = useCallback(() => {
    setCurrentLang((prev) => {
      const next: LanguageCode = prev === "vi" ? "en" : "vi";
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, next);
        window.localStorage.setItem('esp32_lang', next);
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey, params: Record<string, string | number> = {}): string => {
      const dict = translations[currentLang];
      const template = dict[key] || translations.vi[key] || key;
      return formatTranslation(template, params);
    },
    [currentLang]
  );

  const value: I18nContextType = {
    currentLang,
    setLang,
    toggleLang,
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      currentLang: "vi",
      setLang: () => {},
      toggleLang: () => {},
      t: (key: TranslationKey, params: Record<string, string | number> = {}) => {
        const template = translations.vi[key] || key;
        return formatTranslation(template, params);
      },
    };
  }
  return context;
};

