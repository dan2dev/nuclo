/**
 * i18n - isomorphic.
 *
 * The site's text lives in src/i18n/<locale>/: ui.ts (the chrome: header, footer,
 * app shell, SEO), home.ts, docs.ts and examples.ts. English is the source, imported
 * where it is used; another locale is one lazily imported chunk (<locale>/index.ts),
 * fetched the first time the reader picks it and never before.
 *
 * Labels are static values in the trees (h1(t.nav.home)), so switching the locale
 * is a forceUpdate(): every root rendered with hydrate(App) is built again and its
 * live DOM patched in place. The server always renders English.
 */
import * as enUi from "./en/ui.ts";

export type Locale = "en" | "pt" | "es";
export const LOCALES: Record<Locale, string> = { en: "English", pt: "Português", es: "Español" };

/** An English module's shape with its strings widened: a translation has the same keys with other words. */
type Text<T> = T extends string ? string : T extends Function ? T : T extends readonly (infer U)[] ? Text<U>[] : T extends object ? { [K in keyof T]: Text<T[K]> } : T;

export type UiMessages = Text<typeof enUi>;

/** One locale's whole text, the shape of <locale>/index.ts's default export. */
export interface LocaleBundle {
  ui: UiMessages;
  home: Text<typeof import("./en/home.ts")>;
  docs: Text<typeof import("./en/docs.ts")>;
  examples: Text<typeof import("./en/examples.ts")>;
}

const STORAGE_KEY = "nuclo-locale";
const loaders: Record<Exclude<Locale, "en">, () => Promise<{ default: LocaleBundle }>> = {
  pt: () => import("./pt/index.ts"),
  es: () => import("./es/index.ts"),
};
const bundles: Partial<Record<Locale, LocaleBundle>> = {};

export const i18n = {
  locale: "en" as Locale,
  /** True from the pick until the locale's chunk is loaded and applied: the app shows its page loader. */
  loading: false,
  /** Runs after a switch is applied (router.ts refreshes the page meta and the reveals). */
  onChange: () => {},
};

/** The current locale's chrome text. Read it when a tree is built, never at module level. */
export let t: UiMessages = enUi;

/** The current locale's page content, null for English: each page then uses its own en/ module. */
export const bundle = (): LocaleBundle | null => bundles[i18n.locale] ?? null;

export const isLocale = (code: unknown): code is Locale => typeof code === "string" && code in LOCALES;

export async function setLocale(code: Locale): Promise<void> {
  if (code === i18n.locale || i18n.loading) return;
  i18n.loading = true;
  update(); // the page loader comes on
  try {
    if (code !== "en") bundles[code] ??= (await loaders[code]()).default;
  } catch (error) {
    console.error(`i18n: could not load "${code}"`, error);
    i18n.loading = false;
    update();
    return;
  }
  i18n.locale = code;
  t = bundles[code]?.ui ?? enUi;
  document.documentElement.lang = code;
  try { localStorage.setItem(STORAGE_KEY, code); } catch {}
  forceUpdate(); // every static label, in every root, rebuilt in place
  i18n.loading = false;
  update();
  i18n.onChange();
}

/** Browser only, after hydrate(): applies the locale the reader picked last time. */
export function initLocale(): void {
  let saved: string | null = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch {}
  if (isLocale(saved) && saved !== "en") void setLocale(saved);
}
