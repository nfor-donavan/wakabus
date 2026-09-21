import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "wakabus_theme";

const LIGHT = {
  mode: "light",
  bg: "#F4F6FB",
  card: "#FFFFFF",
  text: "#1C2333",
  muted: "#6B7280",
  border: "#E2E6EF",
  navy: "#0B2E8A",
  navyDark: "#071F5E",
  gold: "#F5A623",
  danger: "#D64545",
  success: "#1F9D55",
};

const DARK = {
  mode: "dark",
  bg: "#10131C",
  card: "#171C29",
  text: "#E7EAF1",
  muted: "#97A1B5",
  border: "#2A3143",
  navy: "#3457C9",
  navyDark: "#0A1830",
  gold: "#F5A623",
  danger: "#E56B6B",
  success: "#3ECB79",
};

const ThemeContext = createContext({ theme: LIGHT, toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  // Starts from the phone's own system setting, then a manual toggle
  // overrides it and is remembered from then on.
  const [mode, setMode] = useState(Appearance.getColorScheme() === "dark" ? "dark" : "light");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === "light" || saved === "dark") setMode(saved);
      })
      .catch(() => {});
  }, []);

  function toggleTheme() {
    setMode((current) => {
      const next = current === "light" ? "dark" : "light";
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }

  const theme = mode === "dark" ? DARK : LIGHT;

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
