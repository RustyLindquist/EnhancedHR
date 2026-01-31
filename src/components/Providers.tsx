'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <NavigationProvider>
        {children}
      </NavigationProvider>
    </ThemeProvider>
  );
}
