import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, ThemeMode, ThemeColors } from './tokens';

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  colors: COLORS.light,
  setMode: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem('theme_mode').then((v) => {
      if (v === 'dark' || v === 'nature') setModeState(v);
    });
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem('theme_mode', m);
  };

  return (
    <ThemeContext.Provider value={{ mode, colors: COLORS[mode], setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
