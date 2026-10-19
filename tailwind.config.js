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
      },
      borderColor: {
        hairline: 'var(--border-subtle)',
        'hairline-subtle': 'var(--border-subtle)',
        'hairline-hover': 'var(--accent-primary)',
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
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

