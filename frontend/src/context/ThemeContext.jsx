import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeContext } from './ThemeContextObject';
import {
  THEME_OPTIONS,
  loadThemeFromStorage,
  saveThemeToStorage,
  getEffectiveTheme,
  listenSystemThemeChanges,
} from '../utils/themeUtils';

export { ThemeContext };

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => loadThemeFromStorage());
  const [systemTheme, setSystemTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize system theme
  useEffect(() => {
    const updateSystemTheme = () => {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemTheme(media.matches ? THEME_OPTIONS.DARK : THEME_OPTIONS.LIGHT);
    };

    updateSystemTheme();
    setIsLoading(false);

    // Listen for system theme changes if mode is 'system'
    let unsubscribe;
    if (mode === THEME_OPTIONS.SYSTEM) {
      unsubscribe = listenSystemThemeChanges(setSystemTheme);
    }

    return unsubscribe;
  }, [mode]);

  // Save to localStorage when mode changes
  useEffect(() => {
    saveThemeToStorage(mode);
  }, [mode]);

  // Get current effective theme
  const currentTheme = useMemo(() => {
    if (systemTheme === null) {
      return getEffectiveTheme(mode);
    }
    return mode === THEME_OPTIONS.SYSTEM ? systemTheme : mode;
  }, [mode, systemTheme]);

  // Toggle theme with cycle: light -> dark -> system -> light
  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const themes = Object.values(THEME_OPTIONS);
      const currentIndex = themes.indexOf(prev);
      const nextIndex = (currentIndex + 1) % themes.length;
      const newTheme = themes[nextIndex];
      console.log('ThemeContext - toggleTheme:', prev, '->', newTheme);
      return newTheme;
    });
  }, []);

  // Set theme to specific mode
  const setTheme = useCallback((newMode) => {
    if (Object.values(THEME_OPTIONS).includes(newMode)) {
      setMode(newMode);
    }
  }, []);

  const value = useMemo(
    () => ({
      mode,
      currentTheme,
      toggleTheme,
      setTheme,
      isLoading,
    }),
    [mode, currentTheme, toggleTheme, setTheme, isLoading]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
