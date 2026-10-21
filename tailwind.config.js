/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable dark mode via class
  theme: {
    extend: {
      colors: {
        obsidian: {
          canvas: 'var(--bg-primary)',
          card: 'var(--bg-surface)',
          elevated: 'var(--bg-surface)',
          active: 'var(--bg-primary)',
        },
        sovereign: {
          DEFAULT: 'var(--accent-primary)',
          hover: 'var(--accent-primary)',
          subtle: 'var(--accent-secondary)',
        },
        hairline: {
          DEFAULT: 'var(--border-subtle)',
          subtle: 'var(--border-subtle)',
          hover: 'var(--accent-primary)',
        },
        cenvora: {
          canvas: 'var(--bg-primary)',
          surface: 'var(--bg-surface)',
          accent: 'var(--accent-primary)',
          'accent-secondary': 'var(--accent-secondary)',
          text: 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-muted': 'var(--text-muted)',
          border: 'var(--border-default)',
        },
        action: {
          primary: 'var(--action-primary)',
          'primary-hover': 'var(--action-primary-hover)',
          'primary-text': 'var(--action-primary-text)',
        },
        info: {
          secondary: 'var(--info-secondary)',
        },
        metric: {
          cyan: 'var(--metric-cyan)',
        },
        badge: {
          highlight: 'var(--badge-highlight)',
        },
        // Universal Token Aliases - Guarantees Zero Rogue Rainbow Colors and Fixes Invisible White Text
        emerald: {
          DEFAULT: 'var(--status-success)',
          300: 'var(--status-success)',
          400: 'var(--status-success)',
          500: 'var(--status-success)',
          600: 'var(--status-success)',
        },
        green: {
          DEFAULT: 'var(--status-success)',
          300: 'var(--status-success)',
          400: 'var(--status-success)',
          500: 'var(--status-success)',
          600: 'var(--status-success)',
        },
        amber: {
          DEFAULT: 'var(--status-warning)',
          300: 'var(--status-warning)',
          400: 'var(--status-warning)',
          500: 'var(--status-warning)',
          600: 'var(--status-warning)',
        },
        yellow: {
          DEFAULT: 'var(--status-warning)',
          300: 'var(--status-warning)',
          400: 'var(--status-warning)',
          500: 'var(--status-warning)',
          600: 'var(--status-warning)',
        },
        orange: {
          DEFAULT: 'var(--status-warning)',
          300: 'var(--status-warning)',
          400: 'var(--status-warning)',
          500: 'var(--status-warning)',
          600: 'var(--status-warning)',
        },
        rose: {
          DEFAULT: 'var(--status-danger)',
          300: 'var(--status-danger)',
          400: 'var(--status-danger)',
          500: 'var(--status-danger)',
          600: 'var(--status-danger)',
        },
        red: {
          DEFAULT: 'var(--status-danger)',
          300: 'var(--status-danger)',
          400: 'var(--status-danger)',
          500: 'var(--status-danger)',
          600: 'var(--status-danger)',
        },
        cyan: {
          DEFAULT: 'var(--accent-primary)',
          300: 'var(--accent-primary)',
          400: 'var(--accent-primary)',
          500: 'var(--accent-primary)',
          600: 'var(--accent-primary)',
        },
        blue: {
          DEFAULT: 'var(--accent-primary)',
          300: 'var(--accent-primary)',
          400: 'var(--accent-primary)',
          500: 'var(--accent-primary)',
          600: 'var(--accent-primary)',
        },
        purple: {
          DEFAULT: 'var(--accent-primary)',
          300: 'var(--accent-primary)',
          400: 'var(--accent-primary)',
          500: 'var(--accent-primary)',
          600: 'var(--accent-primary)',
        },
        sky: {
          DEFAULT: 'var(--accent-primary)',
          300: 'var(--accent-primary)',
          400: 'var(--accent-primary)',
          500: 'var(--accent-primary)',
          600: 'var(--accent-primary)',
        },
        indigo: {
          DEFAULT: 'var(--accent-primary)',
          300: 'var(--accent-primary)',
          400: 'var(--accent-primary)',
          500: 'var(--accent-primary)',
          600: 'var(--accent-primary)',
        },
      },
      borderColor: {
        DEFAULT: 'var(--border-subtle)',
        hairline: 'var(--border-subtle)',
        'hairline-subtle': 'var(--border-subtle)',
        'hairline-hover': 'var(--accent-primary)',
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        display: ['3rem', { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '700' }],      // 48px
        h1: ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],           // 36px
        h2: ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.015em', fontWeight: '600' }],        // 28px
        h3: ['1.375rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],          // 22px
        h4: ['1.1875rem', { lineHeight: '1.35', letterSpacing: '-0.005em', fontWeight: '600' }],       // 19px
        'body-lg': ['1.125rem', { lineHeight: '1.55', letterSpacing: '0', fontWeight: '400' }],       // 18px
        body: ['1rem', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],                   // 16px
        'body-sm': ['0.875rem', { lineHeight: '1.45', letterSpacing: '0', fontWeight: '400' }],       // 14px
        caption: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }],        // 12px (strict minimum)
        label: ['0.875rem', { lineHeight: '1.3', letterSpacing: '0.01em', fontWeight: '500' }],         // 14px
        btn: ['0.9375rem', { lineHeight: '1.25', letterSpacing: '0.01em', fontWeight: '600' }],        // 15px
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.25s ease-out',
        marquee: 'marquee 28s linear infinite',
      },
    },
  },
  plugins: [],
}

