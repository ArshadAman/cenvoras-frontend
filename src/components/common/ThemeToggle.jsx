import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';

/**
 * Animated Theme Toggle Component
 * Seamlessly transitions between Light and Dark themes.
 * Styled strictly within the 8-color design system.
 */
export default function ThemeToggle({ className = '', showLabel = false }) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`group relative inline-flex items-center gap-2 rounded-full p-1 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
      }}
    >
      {/* Sliding Track & Thumb Container */}
      <div className="relative flex h-7 w-14 items-center justify-between px-1.5 select-none">
        {/* Sun Icon (Left) */}
        <SunIcon
          className={`h-4 w-4 transition-colors duration-200 ${
            !isDark ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-muted)]'
          }`}
        />

        {/* Moon Icon (Right) */}
        <MoonIcon
          className={`h-4 w-4 transition-colors duration-200 ${
            isDark ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-muted)]'
          }`}
        />

        {/* Sliding Thumb */}
        <span
          className={`absolute top-0.5 bottom-0.5 flex w-6 items-center justify-center rounded-full shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isDark ? 'translate-x-7' : 'translate-x-0'
          }`}
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--text-on-accent)',
          }}
        >
          {isDark ? (
            <MoonIcon className="h-3.5 w-3.5 stroke-[2.5]" />
          ) : (
            <SunIcon className="h-3.5 w-3.5 stroke-[2.5]" />
          )}
        </span>
      </div>

      {showLabel && (
        <span className="text-xs font-semibold pr-2 select-none" style={{ color: 'var(--text-primary)' }}>
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
