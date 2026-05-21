import { theme } from 'antd';

/**
 * Ant Design theme configuration
 */
export const getAntdThemeConfig = (isDark) => {
  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
      colorBgContainer: isDark ? '#141414' : '#ffffff',
      colorBorder: isDark ? '#303030' : '#d9d9d9',
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
      Layout: {
        colorBgHeader: isDark ? '#001529' : '#ffffff',
        colorBgBody: isDark ? '#000000' : '#f0f2f5',
      }
    },
  };
};
