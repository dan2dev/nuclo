/**
 * i18n - isomorphic.
 *
 * The locale is the first URL segment: /en, /pt-br/docs, /es/examples. The site's text
 * lives in src/i18n/<locale>/: ui.ts (the chrome: header, footer, app shell, SEO),
 * home.ts, docs.ts and examples.ts. English is the source, imported where it is used;
 * another locale is one lazily imported chunk (<locale>/index.ts) that a page's route
 * load() fetches before the page is built, on the server and in the browser alike.
 *
 * Every page applies its locale (applyLocale) at the top of its build, and App does the
 * same for the chrome, so a render reads one consistent `t`. Switching is a navigation
 * to the same path under the other locale: the router rebuilds the page, and
 * router.ts calls forceUpdate() once so the chrome outside the outlet follows.
 */
import * as enUi from "./en/ui.ts";

export type Locale = "en" | "pt-br" | "es" | "fr" | "it" | "de" | "ja" | "zh" | "ko" | "ar" | "ru" | "hi";
export const DEFAULT_LOCALE: Locale = "en";
/** Each locale: its name in its own language, its BCP 47 tag (html lang, hreflang), its Open Graph locale and its text direction. */
export const LOCALES: Record<Locale, { name: string; lang: string; og: string; dir: "ltr" | "rtl" }> = {
  en: { name: "English", lang: "en", og: "en_US", dir: "ltr" },
  "pt-br": { name: "Português", lang: "pt-BR", og: "pt_BR", dir: "ltr" },
  es: { name: "Español", lang: "es", og: "es_ES", dir: "ltr" },
  fr: { name: "Français", lang: "fr", og: "fr_FR", dir: "ltr" },
  it: { name: "Italiano", lang: "it", og: "it_IT", dir: "ltr" },
  de: { name: "Deutsch", lang: "de", og: "de_DE", dir: "ltr" },
  ja: { name: "日本語", lang: "ja", og: "ja_JP", dir: "ltr" },
  zh: { name: "中文", lang: "zh-CN", og: "zh_CN", dir: "ltr" },
  ko: { name: "한국어", lang: "ko", og: "ko_KR", dir: "ltr" },
  ar: { name: "العربية", lang: "ar", og: "ar_AR", dir: "rtl" },
  ru: { name: "Русский", lang: "ru", og: "ru_RU", dir: "ltr" },
  hi: { name: "हिन्दी", lang: "hi", og: "hi_IN", dir: "ltr" },
};
export const LOCALE_CODES = Object.keys(LOCALES) as Locale[];

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

const loaders: Record<Exclude<Locale, "en">, () => Promise<{ default: LocaleBundle }>> = {
  "pt-br": () => import("./pt-br/index.ts"),
  es: () => import("./es/index.ts"),
  fr: () => import("./fr/index.ts"),
  it: () => import("./it/index.ts"),
  de: () => import("./de/index.ts"),
  ja: () => import("./ja/index.ts"),
  zh: () => import("./zh/index.ts"),
  ko: () => import("./ko/index.ts"),
  ar: () => import("./ar/index.ts"),
  ru: () => import("./ru/index.ts"),
  hi: () => import("./hi/index.ts"),
};
const bundles: Partial<Record<Locale, LocaleBundle>> = {};

export const i18n = {
  locale: DEFAULT_LOCALE as Locale,
  /** True from a switch until its navigation lands: the app shows its page loader. */
  loading: false,
};

/** The current locale's chrome text. Read it when a tree is built, never at module level. */
export let t: UiMessages = enUi;

/** The current locale's page content, null for English: each page then uses its own en/ module. */
export const bundle = (): LocaleBundle | null => bundles[i18n.locale] ?? null;

export const isLocale = (code: unknown): code is Locale => typeof code === "string" && Object.hasOwn(LOCALES, code);

/** The locale of a route's params, English when the route has none (the standalone apps). */
export const localeOf = (params: Record<string, string>): Locale | null =>
  params.locale === undefined ? DEFAULT_LOCALE : isLocale(params.locale) ? params.locale : null;

/** A page's route load(): fetches the locale's chunk once. null for an unknown locale, which the server answers with a 404. */
export async function loadLocale(params: Record<string, string>): Promise<Locale | null> {
  const code = localeOf(params);
  if (code === null) return null;
  if (code !== "en") bundles[code] ??= (await loaders[code]()).default;
  return code;
}

/** Makes `code` the locale every build after this reads. Synchronous, so a server render is one request's. */
export function applyLocale(code: Locale | null): Locale {
  const locale = code ?? DEFAULT_LOCALE;
  i18n.locale = locale;
  t = bundles[locale]?.ui ?? enUi;
  return locale;
}

/** The locale that shares a URL's prefix, from its raw path. */
export const localeOfPath = (pathname: string): Locale | null => {
  const seg = pathname.split("/")[1];
  return isLocale(seg) ? seg : null;
};

/** A section path under a locale: localePath("/docs") is "/en/docs", localePath("/") is "/en". */
export const localePath = (path: string, locale: Locale = i18n.locale): string =>
  `/${locale}${path === "/" ? "" : path}`;

/** The same page under another locale: "/en/docs#x" with "es" is "/es/docs#x". */
export const swapLocale = (href: string, locale: Locale): string =>
  href.replace(/^\/[^/?#]+/, `/${locale}`);
