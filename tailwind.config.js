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
          canvas: '#07090E',
          card: '#0E111A',
          elevated: '#151926',
          active: '#1D2336',
        },
        sovereign: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          subtle: 'rgba(37, 99, 235, 0.12)',
        },
        hairline: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          subtle: 'rgba(255, 255, 255, 0.04)',
          hover: 'rgba(255, 255, 255, 0.16)',
        },
      },
      borderColor: {
        hairline: 'rgba(255, 255, 255, 0.08)',
        'hairline-subtle': 'rgba(255, 255, 255, 0.04)',
        'hairline-hover': 'rgba(255, 255, 255, 0.16)',
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

