import React from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import palette from './palette.json';

export default function AppTheme({ children, mode = 'light' }) {
  const isDark = mode === 'dark';
  const p = isDark ? palette.dark : palette.light;

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: p.primary,
          colorBgLayout: p.surface,
          colorText: p.onSurface,
          colorBgContainer: isDark ? '#242628' : '#fff',
          borderRadius: 10,
        },
        components: {
          Button: { fontWeight: 600, controlHeight: 36 },
          Layout: { bodyBg: p.surface, siderBg: isDark ? '#1f2123' : '#fff' },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
