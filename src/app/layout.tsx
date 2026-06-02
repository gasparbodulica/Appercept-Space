import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Antigravity — Appercept Space',
  description: 'Appercept workspace manager — clients, projects, tasks, meetings and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ background: 'var(--color-bg-base)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}>
        {children}
      </body>
    </html>
  );
}
