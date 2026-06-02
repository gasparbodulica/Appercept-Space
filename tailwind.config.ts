import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          base: '#0a0a0f',
          surface: '#111118',
          elevated: '#16161f',
          hover: '#1c1c28',
          active: '#222233',
          input: '#181824',
        },
        border: {
          subtle: 'rgba(99, 120, 255, 0.08)',
          default: 'rgba(99, 120, 255, 0.15)',
          strong: 'rgba(99, 120, 255, 0.28)',
        },
        text: {
          primary: '#f0f0ff',
          secondary: '#9898b8',
          muted: '#4a4a6a',
          inverse: '#0a0a0f',
        },
        accent: {
          DEFAULT: '#4f6fff',
          bright: '#6b87ff',
          dim: '#2a3d99',
          glow: 'rgba(79, 111, 255, 0.18)',
          subtle: 'rgba(79, 111, 255, 0.10)',
        },
        brand: {
          green: '#3ecf8e',
          amber: '#f5a623',
          red: '#ff5c5c',
          purple: '#a78bfa',
          teal: '#2dd4bf',
          pink: '#f472b6',
          orange: '#fb923c',
          gray: '#6b7280',
        },
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        full: '9999px',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateX(30px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        pop: {
          from: { transform: 'scale(0.7)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        slideIn: 'slideIn 200ms ease-out',
        pop: 'pop 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        shimmer: 'shimmer 1.4s infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
