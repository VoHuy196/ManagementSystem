import React from 'react';
import { useTheme } from '../hooks/useTheme';

const ThemeTest = () => {
  const { mode, currentTheme, toggleTheme } = useTheme();

  // Debug: inline styles for testing
  const bgColor = currentTheme === 'dark' ? '#111827' : '#ffffff';
  const textColor = currentTheme === 'dark' ? '#f3f4f6' : '#111827';

  return (
    <div style={{ backgroundColor: bgColor, color: textColor }} className="p-8 space-y-4 min-h-screen transition-colors duration-300">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Theme Test Component - Debugging</h2>
        
        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 rounded border border-gray-300 dark:border-gray-700 mb-4" style={{backgroundColor: bgColor, color: textColor, border: `2px solid ${currentTheme === 'dark' ? '#374151' : '#d1d5db'}`}}>
          <p className="mb-2">Mode: <span className="font-bold">{mode}</span></p>
          <p className="mb-2">Current Theme: <span className="font-bold">{currentTheme}</span></p>
          <p className="mb-2 text-sm">HTML dark class: <span className="font-mono bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">{document.documentElement.classList.contains('dark') ? 'YES ✓' : 'NO ✗'}</span></p>
          <p className="mb-2 text-sm">HTML classes: <span className="font-mono text-xs break-all">{document.documentElement.className || '(empty)'}</span></p>
        </div>

        <button
          onClick={toggleTheme}
          style={{ backgroundColor: currentTheme === 'dark' ? '#2563eb' : '#3b82f6' }}
          className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
        >
          Toggle Theme (Current: {mode})
        </button>

        <div className="mt-8 space-y-3 text-left max-w-2xl mx-auto">
          <h3 className="text-lg font-bold mb-3">Tailwind dark: classes test:</h3>
          
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
            <span className="text-gray-900 dark:text-gray-100">Light: gray-100, Dark: gray-800</span>
          </div>
          
          <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded">
            <span className="text-blue-900 dark:text-blue-100">Light: blue-100 bg/blue-900 text, Dark: blue-900 bg/blue-100 text</span>
          </div>
          
          <div className="p-4 border-2 border-red-500 dark:border-red-400 rounded">
            <span className="text-red-600 dark:text-red-400">Border: red-500 light / red-400 dark</span>
          </div>

          <div className="p-4 text-sm bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 rounded">
            <span>Warning: yellow-50 light / yellow-900 dark</span>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-200 dark:bg-gray-700 rounded">
          <h3 className="font-bold mb-2">DevTools Instructions:</h3>
          <ol className="text-left text-sm space-y-1">
            <li>1. Open DevTools (F12)</li>
            <li>2. Inspect the &lt;html&gt; element</li>
            <li>3. Verify the 'dark' class is added/removed when toggling</li>
            <li>4. Check if Tailwind CSS utilities are being applied</li>
            <li>5. Look for any CSS errors in Console tab</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ThemeTest;
