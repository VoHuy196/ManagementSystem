import React, { useMemo, useEffect } from 'react';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import { useTheme } from '../hooks/useTheme';
import { THEME_OPTIONS } from '../utils/themeUtils';
import { getAntdThemeConfig } from '../theme/themeConfig';

// Initialize dayjs locale
dayjs.locale('en');

/**
 * Theme wrapper component for ConfigProvider
 */
const ThemeWrapper = ({ children }) => {
  const { currentTheme } = useTheme();
  const isDark = currentTheme === THEME_OPTIONS.DARK;

  // Apply dark class to html element and update body attributes
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    if (isDark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    
    htmlElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const themeConfig = useMemo(
    () => getAntdThemeConfig(isDark),
    [isDark]
  );

  return (
    <ConfigProvider theme={themeConfig} locale={enUS}>
      {children}
    </ConfigProvider>
  );
};

export default ThemeWrapper;
