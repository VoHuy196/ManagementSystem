/**
 * Theme utilities - detect system theme, localStorage sync
 */

export const THEME_OPTIONS = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

export const STORAGE_KEY = 'app-theme-mode';

/**
 * Detect system theme preference
 */
export const getSystemTheme = () => {
  if (typeof window === 'undefined') return THEME_OPTIONS.LIGHT;
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? THEME_OPTIONS.DARK
    : THEME_OPTIONS.LIGHT;
};

/**
 * Get effective theme based on mode
 */
export const getEffectiveTheme = (mode) => {
  if (mode === THEME_OPTIONS.SYSTEM) {
    return getSystemTheme();
  }
  return mode;
};

/**
 * Load theme from localStorage
 */
export const loadThemeFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && Object.values(THEME_OPTIONS).includes(stored)) {
      return stored;
    }
  } catch (e) {
    console.warn('Failed to load theme from localStorage:', e);
  }
  return THEME_OPTIONS.SYSTEM;
};

/**
 * Save theme to localStorage
 */
export const saveThemeToStorage = (theme) => {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    console.warn('Failed to save theme to localStorage:', e);
  }
};

/**
 * Listen for system theme changes
 */
export const listenSystemThemeChanges = (callback) => {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e) => {
    callback(e.matches ? THEME_OPTIONS.DARK : THEME_OPTIONS.LIGHT);
  };
  
  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }
  
  // Fallback for older browsers
  mediaQuery.addListener(handleChange);
  return () => mediaQuery.removeListener(handleChange);
};
