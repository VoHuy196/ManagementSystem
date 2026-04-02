# Theme System Debugging Guide

## Current Status

Dark mode system has been implemented with:
- ✅ ThemeContext with mode management (light/dark/system)
- ✅ localStorage persistence
- ✅ System theme detection via matchMedia
- ✅ useTheme custom hook
- ✅ ThemeWrapper for Ant Design ConfigProvider
- ✅ All pages updated with dark: Tailwind prefix classes

## Issue Reported

When clicking the theme toggle button:
- ✅ Scrollbar changes color (proves dark class is being added)
- ❌ Other UI elements don't change (dark: classes not applying)

## How to Debug

### Step 1: Visit Test Page
Navigate to: `http://localhost:5174/theme-test`

### Step 2: Check Browser Console
Open DevTools (F12) and watch the Console tab:

```
ThemeContext - toggleTheme: light -> dark
ThemeWrapper - isDark: true, currentTheme: dark
Added dark class to html
HTML classes: dark
```

### Step 3: Inspect HTML Element
1. Open DevTools Elements/Inspector tab
2. Look at the `<html>` element
3. Verify the `dark` class is present/absent when toggling
4. Example:
   ```html
   <html class="dark" data-theme="dark">
   ```

### Step 4: Check Generated CSS
1. In DevTools, go to Elements tab
2. Select any element with `dark:` classes (e.g., a container with `dark:bg-gray-900`)
3. In the Styles panel, verify if CSS rules are present
4. Should see something like:
   ```css
   .dark .dark\:bg-gray-900 {
     background-color: rgb(12, 17, 43);
   }
   ```

### Step 5: Expected Behavior on Test Page

**Light Mode:**
- Inline styled div: White background (#ffffff), dark text
- Tailwind classes: All light colors visible
- Button: Blue

**Dark Mode (after clicking button):**
- Inline styled div: Dark gray background (#111827), light text
- Tailwind classes: All dark colors visible
- Button: Darker blue

## Potential Issues & Solutions

### Issue 1: Dark class not being added to HTML
**Symptom:** HTML element doesn't show `dark` class in DevTools
**Check:** Browser console logs, verify `toggleTheme` is being called
**Fix:** Check if useTheme hook is working, verify ThemeProvider is in main.jsx

### Issue 2: Dark class added but Tailwind classes don't apply
**Symptom:** HTML has `class="dark"` but `dark:bg-gray-900` doesn't work
**Possible Causes:**
1. Tailwind CSS not compiled for dark: variants
2. CSS selector specificity issue
3. Tailwind config not correct

**Solutions to try:**
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Restart dev server: `npm run dev`
4. Check if tailwind.config.js has `darkMode: 'class'`

### Issue 3: Only scrollbar changes
**Symptom:** Scrollbar color changes but rest of UI doesn't
**Root Cause:** CSS in index.css (scrollbar) uses `html.dark` selector which works, but Tailwind dark: classes don't
**Likely Cause:** Tailwind CSS utilities for dark mode aren't being generated correctly

**Debug Steps:**
1. Check DevTools Network tab - is CSS being served?
2. Search for `dark\:` in the served CSS file
3. If not found, Tailwind didn't generate the utilities
4. Check browser console for any Tailwind/CSS warnings

## Files Modified for Theme System

- `src/context/ThemeContext.jsx` - State management
- `src/context/ThemeContextObject.js` - Context export
- `src/utils/themeUtils.js` - Utility functions
- `src/hooks/useTheme.js` - Custom hook
- `src/components/ThemeWrapper.jsx` - ConfigProvider wrapper
- `src/components/ThemeToggle.jsx` - UI button
- `src/main.jsx` - Wrap with ThemeProvider
- `src/App.jsx` - Wrap with ThemeWrapper
- `tailwind.config.js` - Dark mode config
- `vite.config.js` - Added React plugin
- All page files - Updated with dark: classes

## Next Steps if Issue Persists

1. Look for CSS errors in DevTools Console
2. Check if Tailwind CSS utilities are being bundled
3. Verify the class selector syntax in generated CSS
4. May need to update Tailwind config for v4.x compatibility
5. Consider using data attributes instead of class selector as fallback

## Testing Commands

```bash
# Start dev server
cd frontend && npm run dev

# Navigate to test page
# http://localhost:5174/theme-test

# Check theme context in console
# Look for logs starting with "ThemeContext" and "ThemeWrapper"
```
