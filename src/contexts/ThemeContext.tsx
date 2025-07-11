import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (userRole?: string) => void;
  canToggleTheme: (userRole?: string) => boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode; userRole?: string }> = ({ children, userRole }) => {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState<Theme>(() => {
    // If user is admin, force light theme
    if (userRole === 'admin') {
      return 'light';
    }
    
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) return savedTheme;
    
    // Check for system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  // Force light theme for admins when role changes
  useEffect(() => {
    if (userRole === 'admin' && theme !== 'light') {
      setTheme('light');
    }
  }, [userRole, theme]);

  // Update document with theme class and save to localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove both classes and add the current one
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = (userRole?: string) => {
    // Admins are restricted to light theme only
    if (userRole === 'admin') {
      setTheme('light');
      return;
    }
    
    // Students can toggle between light and dark
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const canToggleTheme = (userRole?: string) => {
    // Only students can toggle themes; admins are restricted to light theme
    return userRole !== 'admin';
  };

  const value = { theme, toggleTheme, canToggleTheme };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};