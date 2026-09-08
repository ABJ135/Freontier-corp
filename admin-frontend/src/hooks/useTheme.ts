import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * Module-level store — the single source of truth for theme state.
 * Every component that calls useTheme() reads/writes this same value
 * instead of holding its own independent copy, so there's no risk of
 * two instances disagreeing and overwriting each other.
 */
let currentTheme: Theme = getInitialTheme();
const listeners = new Set<() => void>();

// Apply immediately on module load (before any component even mounts),
// so the correct class is on <html> as early as possible.
if (typeof window !== "undefined") {
  applyTheme(currentTheme);
}

function setGlobalTheme(next: Theme) {
  if (next === currentTheme) return;
  currentTheme = next;
  applyTheme(next);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentTheme;
}

/**
 * Applies the current theme as a `dark` class on <html> (Tailwind's
 * class-based dark mode) and persists the choice to localStorage.
 *
 * Backed by a shared module-level store (via useSyncExternalStore) so
 * every component calling this hook stays in sync — no per-instance
 * state to drift out of sync with another instance elsewhere in the tree.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setTheme = useCallback((next: Theme) => setGlobalTheme(next), []);

  const toggleTheme = useCallback(
    () => setGlobalTheme(currentTheme === "dark" ? "light" : "dark"),
    [],
  );

  return { theme, setTheme, toggleTheme };
}