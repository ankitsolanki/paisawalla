import React, { createContext, useContext } from 'react';
import { themes, tokens } from './tokens';

const ThemeContext = createContext({
  theme: 'light',
  tokens,
  colors: themes.light,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children, theme = 'light' }) => {
  const themeColors = themes[theme] || themes.light;

  const value = {
    theme,
    tokens,
    colors: themeColors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

