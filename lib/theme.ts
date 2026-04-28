import { useState, useEffect } from "react";

export type ThemeKey = "prediq" | "wallst";

export interface Theme {
  key: ThemeKey;
  bg: string;
  panel: string;
  panelAlt: string;
  border: string;
  borderLight: string;
  accent: string;      // green / gold
  accentBuy: string;
  accentSell: string;
  accentHold: string;
  header: string;
  text: string;
  muted: string;
  mutedDark: string;
  label: string;
  emoji: string;
}

export const THEMES: Record<ThemeKey, Theme> = {
  prediq: {
    key: "prediq",
    bg: "#020408",
    panel: "#050d1a",
    panelAlt: "#071220",
    border: "#0d2035",
    borderLight: "#1a3a5c",
    accent: "#00ff88",
    accentBuy: "#00ff88",
    accentSell: "#ff4466",
    accentHold: "#ffd166",
    header: "#00ff88",
    text: "#e0e8f0",
    muted: "#3a6080",
    mutedDark: "#1a3a5c",
    label: "🟢 PREDIQ",
    emoji: "🟢",
  },
  wallst: {
    key: "wallst",
    bg: "#0a0f2e",
    panel: "#0d1542",
    panelAlt: "#111a50",
    border: "#2a3a8f",
    borderLight: "#3a4ab0",
    accent: "#ffd700",
    accentBuy: "#00c853",
    accentSell: "#ff1744",
    accentHold: "#ffd700",
    header: "#4d79ff",
    text: "#e8eaf6",
    muted: "#5c6bc0",
    mutedDark: "#2a3a8f",
    label: "🔵 WALL ST",
    emoji: "🔵",
  },
};

const STORAGE_KEY = "prediq_theme";

export function useTheme(): [Theme, () => void] {
  const [themeKey, setThemeKey] = useState<ThemeKey>("prediq");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeKey) || "prediq";
    setThemeKey(stored);

    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setThemeKey(e.newValue as ThemeKey);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const toggle = () => {
    const next: ThemeKey = themeKey === "prediq" ? "wallst" : "prediq";
    localStorage.setItem(STORAGE_KEY, next);
    setThemeKey(next);
    // Broadcast to other tabs/pages
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: next }));
  };

  return [THEMES[themeKey], toggle];
}
