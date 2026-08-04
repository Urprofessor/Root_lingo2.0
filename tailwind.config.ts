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
        // 中性色 — 偏 Apple 的灰阶。用 CSS 变量驱动,便于整体明暗切换
        // (变量定义见 globals.css :root / .app-dark)。
        ink: {
          50: 'rgb(var(--ink-50) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
        },
        // white 同样变量化:.app-dark 里翻成暗色表面(登录页在作用域外仍是纯白)
        white: 'rgb(var(--white) / <alpha-value>)',
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
