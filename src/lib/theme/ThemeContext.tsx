'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
  mounted: false,
});

function applyThemeToDom(newTheme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', newTheme);
  if (newTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', newTheme === 'dark' ? '#070710' : '#f8fafc');
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Synchronize with DOM and localStorage on client mount
  useEffect(() => {
    let activeTheme: Theme = 'dark';
    try {
      const saved = localStorage.getItem('neet_theme') as Theme | null;
      const domTheme = document.documentElement.getAttribute('data-theme') as Theme | null;
      if (saved === 'light' || saved === 'dark') {
        activeTheme = saved;
      } else if (domTheme === 'light' || domTheme === 'dark') {
        activeTheme = domTheme;
      }
    } catch {
      // ignore
    }

    setThemeState(activeTheme);
    applyThemeToDom(activeTheme);
    setMounted(true);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'neet_theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setThemeState(e.newValue);
        applyThemeToDom(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeToDom(newTheme);
    try {
      localStorage.setItem('neet_theme', newTheme);
    } catch (e) {
      console.warn('Could not save theme to localStorage', e);
    }
  };

  const toggleTheme = () => {
    // Read directly from DOM attribute to guarantee accurate toggle even before React state flush
    const currentDom = typeof document !== 'undefined'
      ? (document.documentElement.getAttribute('data-theme') as Theme | null)
      : null;
    const current = currentDom || theme;
    const nextTheme: Theme = current === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

