import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, ThemeColors } from '@repo/design-tokens';

interface ThemeContextType {
  isDarkMode: boolean;
  theme: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (dark: boolean) => void;
}

const STORAGE_KEY = 'APP_THEME_MODE';

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  initialDark?: boolean;
}> = ({ children, initialDark = false }) => {
  // Synchronous web hydration to prevent dark/light flash on reload
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const saved =
        window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem('esp32_theme');
      if (saved) return saved === 'DARK' || saved === 'dark';
    }
    return initialDark;
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved) {
          setIsDarkMode(saved === 'DARK' || saved === 'dark');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      const modeStr = next ? 'DARK' : 'LIGHT';
      AsyncStorage.setItem(STORAGE_KEY, modeStr).catch(() => {});
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, modeStr);
        window.localStorage.setItem('esp32_theme', next ? 'dark' : 'light');
      }
      return next;
    });
  }, []);

  const setThemeMode = useCallback((dark: boolean) => {
    setIsDarkMode(dark);
    const modeStr = dark ? 'DARK' : 'LIGHT';
    AsyncStorage.setItem(STORAGE_KEY, modeStr).catch(() => {});
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, modeStr);
      window.localStorage.setItem('esp32_theme', dark ? 'dark' : 'light');
    }
  }, []);

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    isDarkMode,
    theme,
    toggleTheme,
    setThemeMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useTheme = useAppTheme;
