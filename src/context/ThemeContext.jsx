import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('cenvora_theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'dark';
    }
  });

  const applyThemeToDOM = useCallback((newTheme, animate = false) => {
    const root = document.documentElement;
    
    if (animate) {
      root.classList.add('theme-transitioning');
    }

    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      root.style.backgroundColor = '#222831';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      root.style.backgroundColor = '#F5F5F0';
    }

    if (animate) {
      const timeoutId = setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, 620);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  // Initial sync on mount without animation
  useEffect(() => {
    applyThemeToDOM(theme, false);
  }, []);

  // Listen to OS preference changes if no manual preference is stored
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      try {
        const saved = localStorage.getItem('cenvora_theme');
        if (!saved) {
          const systemTheme = e.matches ? 'dark' : 'light';
          setThemeState(systemTheme);
          applyThemeToDOM(systemTheme, true);
        }
      } catch {}
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [applyThemeToDOM]);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('cenvora_theme', newTheme);
    } catch {}
    applyThemeToDOM(newTheme, true);
  }, [applyThemeToDOM]);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
