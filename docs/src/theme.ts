import "nuclo";

export type Theme = "dark" | "light";

let currentTheme: Theme = "dark";

export function getTheme(): Theme {
  return currentTheme;
}

export function isDark(): boolean {
  return currentTheme === "dark";
}

export function setTheme(theme: Theme) {
  currentTheme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("nuclo-theme", theme);
  } catch {}
  update();
}

export function toggleTheme() {
  setTheme(currentTheme === "dark" ? "light" : "dark");
}

export function initTheme() {
  let saved: Theme | null = null;
  try {
    saved = localStorage.getItem("nuclo-theme") as Theme | null;
  } catch {}
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  currentTheme = saved ?? (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", currentTheme);
}
