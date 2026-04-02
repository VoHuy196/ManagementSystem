# Theme System - Production Ready

## Introduction

This is a production-ready theme system for React + Ant Design v5 that supports light, dark, and system modes with localStorage persistence and smooth transitions.

## Features

✅ **Three theme modes**: Light, Dark, System (auto-detect)
✅ **Ant Design v5 integration** with ConfigProvider + theme algorithms
✅ **localStorage persistence** - maintains user preference across sessions
✅ **System theme detection** - uses matchMedia to follow OS dark mode preference
✅ **Performance optimized** - uses memo, useCallback, and useMemo to prevent unnecessary re-renders
✅ **Clean & scalable** - easy to extend with custom colors and components
✅ **Smooth transitions** - CSS transitions for theme changes
✅ **Full Tailwind dark mode support** - styled with `dark:` prefix utilities

## Project Structure

```
src/
├── context/
│   └── ThemeContext.jsx          # Theme state management
├── hooks/
│   └── useTheme.js               # Custom hook to use theme
├── utils/
│   └── themeUtils.js             # Theme utilities and helpers
├── components/
│   ├── ThemeWrapper.jsx          # Ant Design ConfigProvider wrapper
│   ├── ThemeToggle.jsx           # Theme toggle button with icons
│   └── Header.jsx                # Header with theme toggle integrated
└── index.css                     # Dark mode CSS variables
```

## Usage

### 1. Wrap your app with providers (main.jsx)

```jsx
import { ThemeProvider } from "./context/ThemeContext";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
```

### 2. Wrap routes with ThemeWrapper (App.jsx)

```jsx
import { ThemeWrapper } from "./components/ThemeWrapper";

const App = () => {
  return (
    <ThemeWrapper>
      <RouterProvider router={AppRoutes} />
    </ThemeWrapper>
  );
};
```

### 3. Use the theme hook in any component

```jsx
import { useTheme } from "../hooks/useTheme";

export const MyComponent = () => {
  const { mode, currentTheme, toggleTheme, setTheme } = useTheme();

  return (
    <div>
      <p>Current mode: {mode}</p>
      <p>Effective theme: {currentTheme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
    </div>
  );
};
```

### 4. Use ThemeToggle in Header

```jsx
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  return (
    <header>
      <nav>
        <ThemeToggle />
      </nav>
    </header>
  );
};
```

### 5. Style with Tailwind dark mode

```jsx
<div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
  Light background with dark mode support
</div>
```

## API Reference

### useTheme Hook

Returns an object with:

```typescript
{
  mode: 'light' | 'dark' | 'system',      // Current mode setting
  currentTheme: 'light' | 'dark',         // Effective theme (resolved if 'system')
  toggleTheme: () => void,                 // Cycle: light → dark → system → light
  setTheme: (mode: string) => void,        // Set specific theme mode
  isLoading: boolean,                      // Loading state during initialization
}
```

### Theme Utilities

Located in `src/utils/themeUtils.js`:

- `getSystemTheme()` - Detect current system theme
- `getEffectiveTheme(mode)` - Get effective theme based on mode
- `loadThemeFromStorage()` - Load saved theme preference
- `saveThemeToStorage(theme)` - Save theme to localStorage
- `listenSystemThemeChanges(callback)` - Listen for system theme changes

## Customization

### Change Primary Color

Edit `src/components/ThemeWrapper.jsx`:

```jsx
const getAntdThemeConfig = (isDark) => {
  return {
    token: {
      colorPrimary: '#ff6b6b', // Your color here
      // ...
    },
  };
};
```

### Add Custom Ant Design Component Styles

```jsx
components: {
  Card: {
    borderRadius: 8,
    boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.5)' : undefined,
  },
  // Add more components...
}
```

### Extend Tailwind Dark Mode

Update `tailwind.config.js`:

```js
export default {
  darkMode: 'class', // Already configured for you
  theme: {
    extend: {
      // Your custom theme extensions
    },
  },
};
```

## Performance Optimizations

1. **ThemeContext**: Uses `useMemo` for value object to prevent context re-renders
2. **useTheme hook**: Uses `useCallback` for mutations to prevent child re-renders
3. **ThemeToggle**: Wrapped with `React.memo` to prevent unnecessary re-renders
4. **ThemeWrapper**: Uses `useMemo` for theme config computation
5. **System theme listener**: Only subscribed when mode is 'system'

## localStorage Keys

- `app-theme-mode` - Stores user's theme preference

## Browser Support

- Modern browsers with CSS Custom Properties
- matchMedia API for system theme detection
- Graceful fallback to light theme if system detection fails

## Troubleshooting

### Theme not persisting
- Check if localStorage is enabled in your browser
- Verify localStorage is not being cleared on page refresh

### System mode not working
- Ensure `prefers-color-scheme` media query is supported
- Check browser DevTools → Rendering → Emulate CSS media feature

### Ant Design components not styled
- Verify ThemeWrapper wraps your routes
- Check console for any ConfigProvider errors
- Ensure Ant Design v5 is properly installed

## Example: Complete Integration

```jsx
// main.jsx
import { ThemeProvider } from "./context/ThemeContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);

// App.jsx
import { ThemeWrapper } from "./components/ThemeWrapper";

const App = () => {
  return (
    <ThemeWrapper>
      <RouterProvider router={AppRoutes} />
    </ThemeWrapper>
  );
};

// Header.jsx
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  return (
    <header className="dark:bg-gray-950">
      <ThemeToggle />
    </header>
  );
};

// Any component
const Dashboard = () => {
  const { currentTheme, setTheme } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-950">
      Current theme: {currentTheme}
    </div>
  );
};
```

## Future Enhancements

- Add theme color picker for custom brand colors
- Store user theme preferences in backend database
- Add theme transition animations
- Support for custom theme presets (e.g., high contrast mode)
