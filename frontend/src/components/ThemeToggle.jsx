import React, { memo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { THEME_OPTIONS } from '../utils/themeUtils';

/**
 * Theme toggle button with sun/moon icon
 */
const ThemeToggle = memo(() => {
  const { mode, currentTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    if (currentTheme === THEME_OPTIONS.DARK) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.121-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM5.464 5.464a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM3 11a1 1 0 100-2H2a1 1 0 100 2h1zm14 0a1 1 0 100-2h-1a1 1 0 100 2h1z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const getTooltip = () => {
    if (mode === THEME_OPTIONS.DARK) return 'Dark Mode';
    if (mode === THEME_OPTIONS.LIGHT) return 'Light Mode';
    return `System (${currentTheme})`;
  };

  const getModeLabel = () => {
    if (mode === THEME_OPTIONS.DARK) return 'Dark';
    if (mode === THEME_OPTIONS.LIGHT) return 'Light';
    return 'System';
  };

  return (
    <button
      onClick={toggleTheme}
      title={getTooltip()}
      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 text-gray-700 dark:text-gray-200"
      aria-label="Toggle theme"
    >
      <div className="flex items-center space-x-1">
        {getIcon()}
        <span className="text-xs font-medium hidden sm:inline">
          {getModeLabel()}
        </span>
      </div>
    </button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;
