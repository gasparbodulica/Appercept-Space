import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Antigravity — Appercept Space',
  description: 'Appercept workspace manager — clients, projects, tasks, meetings and more.',
};

// Render at the device's real width on phones/tablets instead of a zoomed-out
// desktop layout — the essential first step for mobile.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
