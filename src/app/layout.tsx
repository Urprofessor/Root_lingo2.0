import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ROOT LINGO — AI Translation Studio',
  description:
    'Apple-style AI multi-model translation workspace. Browser-first, local-first. Your content never leaves your browser.',
  icons: {
    icon: [
      { url: '/brand/logo.png', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#34C759',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
