import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { THEME_OPTIONS } from '../utils/themeUtils';

/**
 * Example component showing how to use the theme system
 * This can be rendered in a settings/preferences page or modal
 */
const ThemeSettings = () => {
  const { mode, currentTheme, setTheme } = useTheme();

  const themeOptions = [
    {
      value: THEME_OPTIONS.LIGHT,
      label: 'Light',
      description: 'Always use light theme',
      icon: '☀️',
    },
    {
      value: THEME_OPTIONS.DARK,
      label: 'Dark',
      description: 'Always use dark theme',
      icon: '🌙',
    },
    {
      value: THEME_OPTIONS.SYSTEM,
      label: 'System',
      description: `Follow system preference (currently ${currentTheme})`,
      icon: '🖥️',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-4 dark:text-gray-100">
          Theme Settings
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choose how you'd like the application to appear
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {themeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={`p-4 rounded-lg border-2 transition-all ${
              mode === option.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="text-3xl mb-2">{option.icon}</div>
            <h3 className="font-semibold dark:text-gray-100">{option.label}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {option.description}
            </p>
          </button>
        ))}
      </div>

      {/* Display current state for debugging */}
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
          Mode: <span className="font-bold">{mode}</span> | Theme:{' '}
          <span className="font-bold">{currentTheme}</span>
        </p>
      </div>
    </div>
  );
};

export default ThemeSettings;
