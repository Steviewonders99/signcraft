'use client';

import { useEffect } from 'react';
import { setAccent, setTheme } from '@/lib/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load from localStorage first (instant), then sync from server
    const storedAccent = localStorage.getItem('sc-accent');
    const storedTheme = localStorage.getItem('sc-theme') as 'light' | 'dark' | null;

    if (storedAccent) setAccent(storedAccent);
    if (storedTheme) setTheme(storedTheme);

    // Fetch profile preferences from server
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.accent_color) {
          setAccent(data.accent_color);
          localStorage.setItem('sc-accent', data.accent_color);
        }
        if (data.theme) {
          setTheme(data.theme);
          localStorage.setItem('sc-theme', data.theme);
        }
      })
      .catch(() => {});
  }, []);

  return <>{children}</>;
}
