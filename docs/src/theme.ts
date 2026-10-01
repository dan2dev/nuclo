export type Theme = "dark" | "light";
export type ThemePreference = Theme | "system";

let currentTheme: Theme = "light";
let preference: ThemePreference = "system";

export function getTheme(): Theme {
  return currentTheme;
}

export function isDark(): boolean {
  return currentTheme === "dark";
}

export function getThemePreference(): ThemePreference {
  return preference;
}

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  currentTheme = theme;
  document.documentElement.setAttribute("data-theme", theme);
}

export function setThemePreference(pref: ThemePreference) {
  preference = pref;
  try {
    if (pref === "system") localStorage.removeItem("nuclo-theme");
    else localStorage.setItem("nuclo-theme", pref);
  } catch {}
  applyTheme(pref === "system" ? systemTheme() : pref);
  update();
}

export function toggleTheme() {
  setThemePreference(currentTheme === "dark" ? "light" : "dark");
}

export function initTheme() {
  let saved: Theme | null = null;
  try {
    saved = localStorage.getItem("nuclo-theme") as Theme | null;
  } catch {}
  preference = saved ?? "system";
  applyTheme(saved ?? systemTheme());
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (preference !== "system") return;
    applyTheme(systemTheme());
    update();
  });
}
