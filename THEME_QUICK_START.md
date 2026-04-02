# Quick Start - Theme System

## Installation (Already Done ✓)

```bash
npm install antd dayjs
```

## Files Created

### Core System
- `src/context/ThemeContext.jsx` - Theme state management provider
- `src/context/ThemeContextObject.js` - Context object (separated for fast refresh)
- `src/utils/themeUtils.js` - Theme utilities & helpers
- `src/hooks/useTheme.js` - Custom hook
- `src/components/ThemeWrapper.jsx` - Ant Design ConfigProvider wrapper
- `src/components/ThemeToggle.jsx` - UI toggle button with sun/moon icons
- `src/components/ThemeSettings.jsx` - Example settings component

### Integration
- `src/main.jsx` - Updated with ThemeProvider wrapper
- `src/App.jsx` - Updated with ThemeWrapper
- `src/components/Header.jsx` - Updated with ThemeToggle button
- `src/index.css` - Updated with dark mode support

## How to Use

### 1. Basic Usage in Components

```jsx
import { useTheme } from "../hooks/useTheme";

export const MyComponent = () => {
  const { mode, currentTheme, toggleTheme, setTheme } = useTheme();
  
  return (
    <div className="bg-white dark:bg-gray-950">
      <button onClick={toggleTheme}>Toggle Theme</button>
      <p>Current: {currentTheme}</p>
    </div>
  );
};
```

### 2. Integrate ThemeSettings in Settings Page

```jsx
import ThemeSettings from '../components/ThemeSettings';

const SettingsPage = () => {
  return (
    <div>
      <ThemeSettings />
    </div>
  );
};
```

### 3. Style with Tailwind Dark Mode

```jsx
<div className="
  bg-white dark:bg-gray-950 
  text-gray-900 dark:text-gray-100 
  border border-gray-200 dark:border-gray-700
">
  Content adapts to theme automatically
</div>
```

## Theme Modes

1. **Light** (`light`) - Always light theme
2. **Dark** (`dark`) - Always dark theme  
3. **System** (`system`) - Follow OS setting (default)

## localStorage Key

Theme preference is saved to: `app-theme-mode`

## Testing

### In Developer Tools

1. **Toggle in Header** - Click the sun/moon icon
2. **Cycle modes** - Light → Dark → System → Light
3. **System mode** - On macOS: System Preferences → General → Appearance
4. **Check storage** - DevTools → Application → localStorage → `app-theme-mode`

### Test System Detection

```javascript
// In browser console
window.matchMedia('(prefers-color-scheme: dark)').matches
// true (dark mode) or false (light mode)
```

## Ant Design Components

All Ant Design v5 components respect the theme:
- Buttons, Inputs, DatePickers
- Tables, Lists, Cards
- Modals, Drawers, Notifications
- Forms, Upload, Tree, etc.

## Performance

✓ No re-renders on unrelated state changes
✓ localStorage access optimized
✓ matchMedia listener only active when needed
✓ Component memoization for ThemeToggle
✓ useMemo for expensive computations

## Customization

### Change Primary Color

Edit `src/components/ThemeWrapper.jsx`:

```jsx
token: {
  colorPrimary: '#ff6b6b', // Your color
}
```

### Add More Component Styles

```jsx
components: {
  Card: { borderRadius: 8 },
  Notification: { borderRadius: 8 },
  // ... more components
}
```

## Common Issues

**Q: Theme not persisting?**
→ Check localStorage is enabled

**Q: System mode not working?**
→ Verify `prefers-color-scheme` in DevTools → Rendering

**Q: Ant Design not styled?**
→ Ensure ThemeWrapper wraps your routes

**Q: Tailwind dark mode not working?**
→ Make sure using `dark:` prefix in classNames

## Next Steps

1. Update other pages/components with dark mode classes
2. Test on different browsers (Chrome, Firefox, Safari, Edge)
3. Test system theme following on macOS/Windows
4. Add theme color picker if needed
5. Add transitions animations for smooth theme switching

## Resources

- [Ant Design Theming](https://ant.design/docs/react/customize-theme)
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [prefers-color-scheme MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [React Context API](https://react.dev/reference/react/useContext)
