'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { BackgroundTheme } from '@/types';
import { BACKGROUND_THEMES } from '@/constants';

const THEME_STORAGE_KEY = 'enhancedhr-theme';

interface ThemeContextType {
  currentTheme: BackgroundTheme;
  setTheme: (theme: BackgroundTheme) => void;
  themes: BackgroundTheme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(BACKGROUND_THEMES[0]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedThemeId) {
      const savedTheme = BACKGROUND_THEMES.find(t => t.id === savedThemeId);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
    }
    setIsHydrated(true);
  }, []);

  const setTheme = useCallback((theme: BackgroundTheme) => {
    setCurrentTheme(theme);
    // Persist to localStorage (only for preset themes, not custom uploads)
    if (theme.type === 'preset') {
      localStorage.setItem(THEME_STORAGE_KEY, theme.id);
    }
  }, []);

  // Don't render children until hydrated to prevent flash
  if (!isHydrated) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes: BACKGROUND_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
