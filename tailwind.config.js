/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#0B7285',
          50: '#E6F6F9',
          100: '#C2E9F0',
          200: '#8AD1DE',
          300: '#53B9CC',
          400: '#29A1B9',
          500: '#0B7285',
          600: '#0A6777',
          700: '#095568',
          800: '#07445A',
          900: '#06334C',
          dark: '#1ABED0',
        },
        secondary: {
          DEFAULT: '#0F766E',
          dark: '#14B8A6',
        },
        danger: {
          DEFAULT: '#BE123C',
          dark: '#F43F5E',
        },
        warning: {
          DEFAULT: '#B45309',
          dark: '#F59E0B',
        },
        info: {
          DEFAULT: '#0369A1',
          dark: '#0EA5E9',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      boxShadow: {
        subtle: '0 2px 4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
} 