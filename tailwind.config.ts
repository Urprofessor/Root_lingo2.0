import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Apple system font stack
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'Menlo',
          'Monaco',
          '"Cascadia Code"',
          '"Roboto Mono"',
          'monospace',
        ],
      },
      colors: {
        // 品牌色 — Apple 系统绿
        brand: {
          50: '#e8faef',
          100: '#c8f4d7',
          200: '#9eecb8',
          300: '#6ee098',
          400: '#3fd178',
          500: '#34C759', // 主色 — Apple System Green
          600: '#28a745',
          700: '#1e8235',
          800: '#176629',
          900: '#0f4a1d',
        },
        // 中性色 — 偏 Apple 的灰阶
        ink: {
          50: '#fafafa',
          100: '#f5f5f7',  // Apple 标志性浅灰背景
          200: '#e8e8ed',
          300: '#d2d2d7',
          400: '#a1a1a6',
          500: '#86868b',
          600: '#6e6e73',
          700: '#48484a',
          800: '#2c2c2e',
          900: '#1d1d1f',  // Apple 标志性深色
        },
      },
      borderRadius: {
        '4xl': '28px',
        '5xl': '36px',
      },
      boxShadow: {
        // Apple 风格的多层柔和阴影
        'apple-sm': '0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.02)',
        'apple': '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03)',
        'apple-lg': '0 12px 28px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
        'apple-xl': '0 24px 48px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.05)',
        'glow-brand': '0 0 0 4px rgba(52,199,89,0.15)',
      },
      backdropBlur: {
        'apple': '20px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
