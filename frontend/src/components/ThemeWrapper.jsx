import React, { useMemo, useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';
import { useTheme } from '../hooks/useTheme';
import { THEME_OPTIONS } from '../utils/themeUtils';

/**
 * Ant Design theme configuration
 */
const getAntdThemeConfig = (isDark) => {
  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
      colorBgContainer: isDark ? '#141414' : '#ffffff',
      colorBorder: isDark ? '#434343' : '#d9d9d9',
    },
    components: {
      Button: {
        controlHeight: 36,
        borderRadius: 6,
      },
      Input: {
        controlHeight: 36,
        borderRadius: 6,
      },
      Select: {
        controlHeight: 36,
        borderRadius: 6,
      },
      DatePicker: {
        controlHeight: 36,
        borderRadius: 6,
      },
    },
  };
};

/**
 * Theme wrapper component for ConfigProvider
 */
const ThemeWrapper = ({ children }) => {
  const { currentTheme } = useTheme();
  const isDark = currentTheme === THEME_OPTIONS.DARK;

  // Apply dark class to html element and update body attributes
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    console.log('ThemeWrapper - isDark:', isDark, 'currentTheme:', currentTheme);
    
    if (isDark) {
      htmlElement.classList.add('dark');
      console.log('Added dark class to html');
    } else {
      htmlElement.classList.remove('dark');
      console.log('Removed dark class from html');
    }
    
    // Also set data attribute for other uses
    htmlElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    // Log the current class list
    console.log('HTML classes:', htmlElement.className);
    console.log('HTML data-theme:', htmlElement.getAttribute('data-theme'));
  }, [isDark]);

  const themeConfig = useMemo(
    () => getAntdThemeConfig(isDark),
    [isDark]
  );

  return (
    <ConfigProvider theme={themeConfig}>
      {children}
    </ConfigProvider>
  );
};

export default ThemeWrapper;

