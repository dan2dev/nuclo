import { css, colors, cx, s, CAN_HOVER } from "../styles.ts";
import { href as sectionHref, currentRoute, switchLocale } from "../router.ts";
import { toggleTheme, isDark } from "../theme.ts";
import { docsSection } from "../docs-state.ts";
import { NucloBrand } from "./NucloBrand.ts";
import { GRADIENT, box, brandBox, brandIcon } from "./brand-geometry.ts";
import { GitHubSvg } from "./icons.ts";
import { animations } from "../styles/animations.ts";
import { LOCALES, LOCALE_CODES, i18n, loadLocale, type Locale, t } from "../i18n/index.ts";

const GITHUB_URL = "https://github.com/dan2dev/nuclo";
const DESKTOP = "@media (min-width: 768px)";

type NavItem = { label: "home" | "docs" | "examples"; route: string; hash?: string }; // label: the key in t.nav

const NAV_LINKS: NavItem[] = [
  { label: "home",     route: "home" },
  { label: "docs",     route: "docs" },
  { label: "examples", route: "examples" },
];

const ARROW = "M5 12h14 M13 6l6 6-6 6";
const OUT = "M7 17L17 7 M8 7h9v9";
const MOON = "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z";
const SUN = "M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41";

// Single-path stroked icon (menu, close, chevron, external arrow).
function LineIcon(d: string, size = 20) {
  return svgSvg(
    { width: String(size), height: String(size), viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    pathSvg({ d, pathLength: "1" }),
  );
}

// The logo's ease (0.5 - cos(πx) / 2), as a bezier
const EASE = "cubic-bezier(0.37, 0, 0.63, 1)";
// The nav handle's: quick to leave, settling softly on the next page
const SLIDE = "cubic-bezier(0.22, 1, 0.36, 1)";
// The current page's plate: solid deep orange, dark enough for white text (about 5:1), lit along its top edge
const plateOn = { backgroundColor: colors.primaryDark, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16), 0 6px 16px -8px ${colors.primaryGlow}` } as const;
const A = animations;
const motion = (animation: string) => ({ animation, "@media (prefers-reduced-motion: reduce)": { animation: "none" } });
const ring = { outline: `2px solid ${colors.primary}`, outlineOffset: "3px" } as const;
// Past this much scroll the word is un-drawn; its space stays, so nothing slides. On docs pages the word is
// un-drawn at once and the logo closes on its icon, then the crumb fades in: the lockup is clipped to the icon's width
const iconBox = box([brandIcon.shape]);
const ICON_FRAC = (iconBox[0] + iconBox[2] - brandBox[0]) / brandBox[2];
const LOCKUP_W = brandBox[2] / brandBox[3];
const WORD_SCROLL = 96;
// A square hit area for an icon. The negative margin lines the icon up with the container edge.
const iconBtn = { display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", color: colors.textDim, transition: `color 0.2s ${EASE}, background-color 0.2s ${EASE}, transform 0.2s ${EASE}`, [CAN_HOVER]: { hover: { color: colors.text, backgroundColor: colors.border } }, active: { transform: "scale(0.92)" }, focusVisible: ring } as const;
// The menu tiles' delays, as --d: they rise one after the other
const delays = (n: number, from: number, step: number) =>
  Object.fromEntries(Array.from({ length: n }, (_, i) => [`& > :nth-child(${i + 1})`, { raw: { "--d": `${(from + i * step).toFixed(2)}s` } }]));

const st = {
  // The bar is opaque, almost black on a dark page. Its rule is always drawn, so on a dark page the header
  // still reads as its own band with everything centred in it, and the first block sits a gutter below it.
  bar: css("components-header-bar", { userSelect: "none", position: "fixed", top: "0", left: "0", right: "0", zIndex: 220, height: "var(--header-h)", backgroundColor: colors.bgNav, boxShadow: `inset 0 -1px 0 ${colors.border}` }),
  // Three zones in the wide frame: the brand (and on docs pages, where you are), the nav dead centre, the actions.
  // The side columns share what is left equally, so the nav stays put while the logo's word comes and goes
  row: css("components-header-row", { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)", alignItems: "center", columnGap: "24px", height: "100%" }),
  brand: css("components-header-brand", { gridColumn: "1", display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }),
  // The lockup, drawn once as the page loads, like the footer's. Once the page scrolls the pen un-draws
  // the word, and once it is gone the link closes on the icon (keeping its "Nuclo home" label); back at
  // the top it opens and the word is drawn again.
  logo: css("components-header-logo", { display: "flex", alignItems: "center", flexShrink: 0, overflow: "hidden", padding: "7px 9px", margin: "0 -9px", borderRadius: "6px", focusVisible: ring,
    raw: { "--logo-h": "30px" },
    // The lockup's ink sits low in its box: the l's ascender tops it, while the icon's lobe and the word's body
    // rest on the baseline. Lifted by 3% of its height it sits optically centred in the bar, between the icon's
    // middle and the word's. The lift holds while the word comes and goes, so the icon never moves up or down
    "& > svg": { height: "var(--logo-h)", width: "auto", transform: "translateY(calc(var(--logo-h) * -0.03))" },
    '&[data-docs="on"] > svg[data-word="off"]': { clipPath: `inset(0 ${(100 * (1 - ICON_FRAC)).toFixed(2)}% 0 0)`, marginRight: `calc(var(--logo-h) * ${(LOCKUP_W * (ICON_FRAC - 1)).toFixed(4)})` },
    [DESKTOP]: { raw: { "--logo-h": "36px" }, padding: "4px 9px" } }),

  // A three-way toggle: the links sit in a track as tall as the bar's buttons (its corners follow the pills' at its
  // 4px inset), and the current page sits on a handle that slides between them, taking each label's width.
  // Until the nav has measured the handle (and without JS) the current link wears the plate itself.
  nav: css("components-header-nav", { position: "relative", gridColumn: "2", display: "none", alignItems: "center", gap: "2px", padding: "4px", borderRadius: "14px", backgroundColor: colors.bgNavTrack, boxShadow: `inset 0 0 0 1px ${colors.border}`, [DESKTOP]: { display: "flex" },
    '&[data-ready] > a[aria-current="page"]': { backgroundColor: "transparent", boxShadow: "none" },
    "&[data-ready] > span": { opacity: "1", transition: `transform 0.45s ${SLIDE}, width 0.45s ${SLIDE}, opacity 0.2s ${EASE}, filter 0.2s ${EASE}` },
    '&[data-ready][data-at="-1"] > span': { opacity: "0" },
    '&:has(> a[aria-current="page"]:hover) > span': { filter: "brightness(1.1)" },
    "@media (prefers-reduced-motion: reduce)": { "&[data-ready][data-at] > span": { transition: "none" } } }),
  handle: css("components-header-handle", { position: "absolute", top: "4px", left: "0", height: "28px", width: "var(--w, 0px)", transform: "translateX(var(--x, 0px))", borderRadius: "10px", ...plateOn, opacity: "0", pointerEvents: "none" }),
  // A link is a pill above the handle. Hover lays a solid grey plate under it; the current page sits on the solid
  // orange handle, so the bar's bottom edge is left to the reading line.
  navLink: css("components-header-navLink", { position: "relative", display: "flex", alignItems: "center", height: "28px", padding: "0 14px", borderRadius: "10px", fontSize: "14px", fontWeight: "500", letterSpacing: "0.01em", color: colors.textDim, whiteSpace: "nowrap", transition: `color 0.2s ${EASE}, background-color 0.2s ${EASE}, box-shadow 0.2s ${EASE}, transform 0.2s ${EASE}`,
    hover: { color: colors.text, backgroundColor: colors.bgLight }, active: { transform: "scale(0.96)" }, focusVisible: { ...ring, outlineOffset: "1px" } }),
  navLinkOn: css("components-header-navLinkOn", { color: colors.primaryText, ...plateOn, hover: { color: colors.primaryText, ...plateOn } }),

  crumbDivider: css("components-header-crumbDivider", { display: "none", flexShrink: 0, width: "1px", height: "18px", backgroundColor: colors.borderLight, "@media (min-width: 1100px)": { display: "block" } }),
  crumb: css("components-header-crumb", { display: "none", alignItems: "center", gap: "8px", minWidth: 0, fontSize: "13px", color: colors.textMuted, whiteSpace: "nowrap", "@media (min-width: 1100px)": { display: "flex" } }),
  crumbSep: css("components-header-crumbSep", { color: colors.border, fontSize: "15px" }),
  crumbTitle: css("components-header-crumbTitle", { maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", color: colors.textDim, fontWeight: "500" }),

  right: css("components-header-right", { gridColumn: "3", justifySelf: "end", display: "flex", alignItems: "center", gap: "4px" }),
  iconBtn: css("components-header-iconBtn", { ...iconBtn, display: "none", width: "36px", height: "36px", [DESKTOP]: { display: "flex" } }),
  locale: css("components-header-locale", { display: "flex", alignItems: "center", gap: "8px", height: "44px", padding: "0 10px", borderRadius: "10px", fontSize: "13px", color: colors.textDim, cursor: "pointer", [CAN_HOVER]: { hover: { color: colors.text, backgroundColor: colors.border } }, focusVisible: ring, [DESKTOP]: { height: "36px" } }),
  languageDialog: css("components-header-languageDialog", { width: "min(700px, calc(100vw - 32px))", maxHeight: "calc(100dvh - 32px)", margin: "auto", padding: "0", border: `1px solid ${colors.borderLight}`, borderRadius: "24px", backgroundColor: colors.bgCard, color: colors.text, boxShadow: "0 32px 120px #0008", overflowY: "auto",
    "&::backdrop": { backgroundColor: "rgba(0,0,0,0.65)", raw: { "backdrop-filter": "blur(10px)" }, ...motion(`${A.ink} 0.2s ease`) },
    "&[open]": { ...motion(`${A.modalIn} 0.3s ${SLIDE}`) },
    "@media (max-width: 480px)": { borderRadius: "20px" } }),
  languageHead: css("components-header-languageHead", { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "28px", borderBottom: `1px solid ${colors.border}`, "& h2": { fontSize: "28px", letterSpacing: "-0.04em", margin: "4px 0 0" }, "& small": { color: colors.primary, fontSize: "12px", letterSpacing: "0.12em" }, "@media (max-width: 480px)": { padding: "20px" } }),
  languageClose: css("components-header-languageClose", { ...iconBtn, width: "40px", height: "40px", flexShrink: 0 }),
  languageGrid: css("components-header-languageGrid", { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", padding: "24px", "@media (max-width: 600px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px", padding: "16px" } }),
  languageOption: css("components-header-languageOption", { display: "flex", flexDirection: "column", alignItems: "stretch", gap: "16px", padding: "16px", minWidth: 0, borderRadius: "14px", border: `1px solid ${colors.border}`, backgroundColor: colors.bgSecondary, color: colors.text, textAlign: "start", cursor: "pointer", transition: "border-color 0.2s, transform 0.2s, background-color 0.2s", ...motion(`${A.riseIn} 0.35s ${SLIDE} backwards`),
    "& > span": { display: "flex", justifyContent: "space-between", alignItems: "center", color: colors.textMuted, fontSize: "11px", letterSpacing: "0.08em" }, "& strong": { fontSize: "17px", fontWeight: "500" },
    '&[aria-pressed="true"]': { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
    '&[data-loading="true"] svg': { ...motion(`${A.spin} 0.8s linear infinite`) },
    hover: { borderColor: colors.primary, transform: "translateY(-2px)" }, focusVisible: ring,
    "&:disabled": { cursor: "wait" }, "@media (prefers-reduced-motion: reduce)": { transition: "none" } }),
  // A swapped theme icon's stroke is drawn end to end (not the first one: the header enters still)
  icon: css("components-header-icon", { display: "flex" }),
  iconIn: css("components-header-iconIn", { "& path": { ...motion(`${A.strokeDraw} 0.5s ${EASE}`), raw: { "stroke-dasharray": "1" } } }),
  // The call to action wears the mark's gradient. It lifts on hover, and its arrow leads the way
  cta: css("components-header-cta", { alignItems: "center", justifyContent: "center", gap: "6px", borderRadius: "10px", backgroundImage: `linear-gradient(180deg, ${GRADIENT.from}, ${GRADIENT.to})`, color: "#fff", fontWeight: "600", whiteSpace: "nowrap", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 20px -12px var(--c-primary-glow)", transition: `transform 0.25s ${EASE}, box-shadow 0.25s ${EASE}, filter 0.25s ${EASE}`, hover: { transform: "translateY(-1px)", filter: "brightness(1.06)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 12px 26px -10px var(--c-primary-glow)", "& > svg": { transform: "translateX(2px)" } }, active: { transform: "translateY(0) scale(0.98)" }, focusVisible: ring, "& > svg": { transition: `transform 0.25s ${EASE}` } }),
  menuBtn: css("components-header-menuBtn", { ...iconBtn, width: "44px", height: "44px", marginRight: "-12px", color: colors.text, [DESKTOP]: { display: "none" } }),
  // Two bars that fold into a cross while the menu is open
  burger: css("components-header-burger", { position: "relative", width: "20px", height: "14px", "& > span": { position: "absolute", left: "0", width: "100%", height: "2px", borderRadius: "2px", backgroundColor: "currentColor", transition: `top 0.25s ${EASE}, transform 0.3s ${EASE}` }, "& > span:first-child": { top: "0" }, "& > span:last-child": { top: "12px" }, '&[data-open="true"] > span': { top: "6px" }, '&[data-open="true"] > span:first-child': { transform: "rotate(45deg)" }, '&[data-open="true"] > span:last-child': { transform: "rotate(-45deg)" } }),

  // ── Mobile menu: a card that drops from the bar over the dimmed page ──
  menu: css("components-header-menu", { position: "fixed", inset: "var(--header-h) 0 0 0", zIndex: 215, padding: "8px 10px", backgroundColor: "rgba(0,0,0,0.4)", raw: { "backdrop-filter": "blur(4px)" }, ...motion(`${A.ink} 0.2s ${EASE}`) }),
  // Like the language dialog: a card on the page, its links in a grid of tiles
  menuPanel: css("components-header-menuPanel", { display: "flex", flexDirection: "column", gap: "10px", maxHeight: "100%", overflowY: "auto", padding: "10px", border: `1px solid ${colors.borderLight}`, borderRadius: "24px", backgroundColor: colors.bgCard, boxShadow: "0 32px 80px -24px #0008", transformOrigin: "top right", raw: { "overscroll-behavior": "contain" }, ...motion(`${A.dropIn} 0.3s ${SLIDE}`) }),
  menuGrid: css("components-header-menuGrid", { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px", ...delays(4, 0.04, 0.04) }),
  // A tile: its number and arrow in mono on top, the page's name below. The current page wears the bar's plate
  menuTile: css("components-header-menuTile", { display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "22px", minWidth: 0, padding: "14px 12px 14px 14px", borderRadius: "16px", border: `1px solid ${colors.border}`, backgroundColor: colors.bgSecondary, color: colors.text, transition: `border-color 0.2s ${EASE}, transform 0.2s ${EASE}`, ...motion(`${A.riseIn} 0.35s ${SLIDE} var(--d, 0s) backwards`),
    "& > span": { display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "ui-monospace, monospace", fontSize: "11px", letterSpacing: "0.08em", color: colors.textMuted },
    // A word too long for a narrow phone's tile (Documentazione at 360px) breaks with a hyphen
    "& > strong": { fontSize: "clamp(16px, 4.8vw, 19px)", fontWeight: "600", letterSpacing: "-0.02em", lineHeight: "1.2", overflowWrap: "break-word", raw: { hyphens: "auto", "-webkit-hyphens": "auto" } },
    '&[aria-current="page"]': { ...plateOn, borderColor: "transparent", color: colors.primaryText, "& > span": { color: "rgba(255,255,255,0.78)" } },
    active: { transform: "scale(0.97)" }, focusVisible: ring, [CAN_HOVER]: { hover: { borderColor: colors.primary } } }),
  srOnly: css("components-header-srOnly", { position: "absolute", width: "1px", height: "1px", overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }),
  menuFoot: css("components-header-menuFoot", { display: "flex", gap: "8px", ...motion(`${A.ink} 0.3s ${EASE} 0.2s backwards`) }),
  menuTheme: css("components-header-menuTheme", { ...iconBtn, flexShrink: 0, width: "52px", height: "52px", borderRadius: "16px", border: `1px solid ${colors.border}`, backgroundColor: colors.bgSecondary, color: colors.text }),
  ctaMenu: css("components-header-ctaMenu", { display: "flex", flex: "1", height: "52px", fontSize: "16px", borderRadius: "16px" }),
};

// The nav's handle follows the current page: read on every update, measured only when it changes or the nav resizes.
// Module state, not Header()'s: a locale switch builds Header() again over the same nav element.
let navEl: HTMLElement | undefined;
let handleAt = -2;
// The lockup, built once: a locale switch rebuilds Header() over the same svg, and this instance's drawing carries on.
const brand = NucloBrand({ height: 36, animate: true, hideWordAfter: WORD_SCROLL, hideWord: () => currentRoute() === "docs" });

let languageEl: HTMLDialogElement | undefined;
let languageTrigger: HTMLElement | undefined;
let pendingLocale: Locale | null = null;

export function Header() {
  let themeSwapped = false; // after the first toggle the theme icon draws itself in
  let menuOpen = false;
  let menuMounted = false; // stays true while the exit animation plays
  let menuEl: HTMLElement | undefined;

  const route = currentRoute;

  const currentLink = () => NAV_LINKS.findIndex((l) => !l.hash && route() === l.route);
  function placeHandle() {
    const link = navEl?.querySelectorAll<HTMLElement>(":scope > a")[handleAt];
    if (!navEl || !link) return;
    navEl.style.setProperty("--x", `${link.offsetLeft}px`);
    navEl.style.setProperty("--w", `${link.offsetWidth}px`);
  }
  const href = (r: string, hash?: string) => sectionHref(r === "home" ? "/" : `/${r}`) + (hash ? `#${hash}` : "");

  const motion = (ms: number) => (matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms);

  function openMenu() {
    menuOpen = menuMounted = true;
    update();
  }

  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    update();
    if (!menuEl) { menuMounted = false; return update(); }
    menuEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: motion(160), easing: EASE, fill: "forwards" }).finished
      .catch(() => {})
      .then(() => { if (!menuOpen) { menuMounted = false; update(); } });
  }

  // Its label, unless content is given
  function RouteLink({ label, route: r, hash }: NavItem, style: ReturnType<typeof css>, onStyle: ReturnType<typeof css> | null, ...content: NodeModLike<"a">[]) {
    const on = () => !hash && route() === r;
    return a(
      {
        href: href(r, hash),
        class: () => cx(style, on() ? onStyle : null).className,
        "aria-current": () => (on() ? "page" : "false"),
        // Not prevented: the router navigates, a same-page #hash is the browser's.
        onClick: closeMenu,
      },
      ...(content.length ? content : [t.nav[label]]),
    );
  }

  function Logo() {
    return a(
      st.logo,
      { href: href("home"), "aria-label": t.nav.nucloHome, onClick: closeMenu, "data-docs": () => {
        const docs = route() === "docs";
        queueMicrotask(() => document.querySelector(".components-header-logo > svg")?.dispatchEvent(new Event("wordcheck")));
        return docs ? "on" : "off";
      } },
      brand,
    );
  }

  const ThemeIcon = () => ({ class: () => cx(st.icon, themeSwapped ? st.iconIn : null).className });

  function ThemeToggle(style: ReturnType<typeof css>, size = 17) {
    return button(
      style,
      { type: "button", "aria-label": t.nav.switchTheme, onClick: () => { themeSwapped = true; toggleTheme(); } },
      when(() => isDark(), span(ThemeIcon(), LineIcon(MOON, size))).else(span(ThemeIcon(), LineIcon(SUN, size))),
    );
  }

  // A menu tile's top line: its number and where it goes
  const TileHead = (i: number, d: string) => span(String(i + 1).padStart(2, "0"), LineIcon(d, 15));

  function GetStarted(variant: ReturnType<typeof css>) {
    return a(
      st.cta, variant,
      { href: href("docs", "quick-start"), onClick: closeMenu },
      t.nav.getStarted,
    );
  }


  function LanguageButton() {
    return button(
      st.locale,
      { type: "button", "aria-label": t.nav.language, "aria-haspopup": "dialog", onClick: (e) => {
        languageTrigger = e.currentTarget;
        languageEl?.showModal();
      } },
      LineIcon("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M3 12h18 M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18", 17),
      () => LOCALES[i18n.locale].name,
    );
  }

  async function chooseLanguage(code: Locale) {
    if (pendingLocale) return;
    if (code === i18n.locale) { languageEl?.close(); return; }
    pendingLocale = code;
    update();
    try {
      await loadLocale({ locale: code });
      if (languageEl) await languageEl.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.97)" }], { duration: motion(180), easing: EASE }).finished;
      languageEl?.close();
      closeMenu();
      switchLocale(code);
    } catch {
      // A normal navigation lets the page loader handle a failed translation fetch.
      languageEl?.close();
      window.location.assign(window.location.href.replace(`/${i18n.locale}`, `/${code}`));
    } finally {
      pendingLocale = null;
      update();
    }
  }

  function LanguageModal() {
    return dialog(
      st.languageDialog,
      { "aria-labelledby": "language-title", "aria-busy": () => String(pendingLocale !== null),
        onClick: (e) => { if (e.target === e.currentTarget) {
          const rect = e.currentTarget.getBoundingClientRect();
          if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) e.currentTarget.close();
        } },
        onClose: () => languageTrigger?.isConnected && languageTrigger.focus(),
        onMount: (el) => { languageEl = el; return () => { languageEl = undefined; }; },
      },
      div(st.languageHead,
        div(small(`NUCLO / ${LOCALE_CODES.length}`), h2({ id: "language-title" }, t.nav.language)),
        button(st.languageClose, { type: "button", "aria-label": t.nav.closeMenu, onClick: () => languageEl?.close() }, LineIcon("M6 6l12 12 M6 18L18 6")),
      ),
      div(st.languageGrid,
        ...LOCALE_CODES.map((code, index) => button(
          st.languageOption,
          { type: "button", lang: LOCALES[code].lang, dir: LOCALES[code].dir,
            style: { animationDelay: `${index * 20}ms` },
            "aria-pressed": () => String(code === i18n.locale),
            "data-loading": () => String(code === pendingLocale),
            disabled: () => pendingLocale !== null,
            onClick: () => void chooseLanguage(code),
          },
          span(LOCALES[code].lang.toUpperCase(),
            when(() => pendingLocale === code, LineIcon("M21 12a9 9 0 1 1-9-9", 16))
              .else(when(() => code === i18n.locale, LineIcon("M5 12l4 4L19 6", 16)).else(LineIcon("M7 17L17 7 M7 7h10v10", 16))),
          ),
          strong(LOCALES[code].name),
        )),
      ),
    );
  }

  // ── Mobile menu (only rendered while open): a card dropped from the bar. A tap on the dimmed page closes it ──
  function MobileMenu() {
    return div(
      st.menu,
      {
        onClick: (e) => { if (e.target === e.currentTarget) closeMenu(); },
        // Open/close side effects live on the overlay's own lifecycle.
        onMount: (el) => {
          menuEl = el;
          const ac = new AbortController();
          document.documentElement.style.overflow = "hidden";
          document.addEventListener("keydown", (e) => {
            if (languageEl?.open) return;
            if (e.key === "Escape") return closeMenu();
            if (e.key !== "Tab") return;
            // Keep focus inside the dialog.
            const items = [document.getElementById("site-menu-button")!, ...el.querySelectorAll<HTMLElement>("a, button")];
            const first = items[0], last = items[items.length - 1];
            if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
              e.preventDefault();
              (e.shiftKey ? last : first).focus();
            }
          }, { signal: ac.signal });
          window.matchMedia("(min-width: 768px)").addEventListener("change", (e) => { if (e.matches) closeMenu(); }, { signal: ac.signal });
          window.addEventListener("popstate", closeMenu, { signal: ac.signal });
          return () => {
            if (menuEl === el) menuEl = undefined;
            ac.abort();
            document.documentElement.style.overflow = "";
            document.getElementById("site-menu-button")?.focus();
          };
        },
      },
      div(
        st.menuPanel,
        { id: "site-menu", role: "dialog", "aria-modal": "true", "aria-label": t.nav.menu },
        nav(
          st.menuGrid,
          { "aria-label": t.nav.main },
          ...NAV_LINKS.map((l, i) => RouteLink(l, st.menuTile, null, TileHead(i, ARROW), strong(t.nav[l.label]))),
          a(
            st.menuTile,
            { href: GITHUB_URL, target: "_blank", rel: "noopener noreferrer" },
            TileHead(NAV_LINKS.length, OUT),
            strong("GitHub", span(st.srOnly, t.nav.opensInNewTab)),
          ),
        ),
        div(st.menuFoot, ThemeToggle(st.menuTheme, 20), GetStarted(st.ctaMenu)),
      ),
    );
  }

  return div(
    header(
      st.bar,
      div(
        s.container, st.row,
        div(
          st.brand,
          Logo(),
          when(() => route() === "docs" && docsSection.title !== "",
            span(st.crumbDivider, { "aria-hidden": "true" }),
            div(
              st.crumb,
              span(() => docsSection.group),
              span(st.crumbSep, { "aria-hidden": "true" }, "/"),
              span(st.crumbTitle, () => docsSection.title),
            ),
          ),
        ),
        nav(
          st.nav,
          {
            "aria-label": t.nav.main,
            // The index of the current page's link, -1 for none. When it changes the handle moves there
            "data-at": () => {
              const i = currentLink();
              if (i !== handleAt) { handleAt = i; placeHandle(); }
              return String(i);
            },
            onMount: (el: HTMLElement) => {
              navEl = el;
              placeHandle();
              void el.offsetWidth; // placed before the transitions are on, so the handle appears where it belongs
              el.setAttribute("data-ready", "");
              const ro = new ResizeObserver(placeHandle); // e.g. the nav shown again past the mobile breakpoint
              ro.observe(el);
              return () => { ro.disconnect(); navEl = undefined; };
            },
          },
          span(st.handle, { "aria-hidden": "true" }),
          ...NAV_LINKS.map((l) => RouteLink(l, st.navLink, st.navLinkOn)),
        ),
        div(
          st.right,
          LanguageButton(),
          a(st.iconBtn, { href: GITHUB_URL, target: "_blank", rel: "noopener noreferrer", "aria-label": t.nav.nucloOnGitHub }, GitHubSvg({ size: 18 })),
          ThemeToggle(st.iconBtn),
          button(
            st.menuBtn,
            {
              id: "site-menu-button",
              type: "button",
              "aria-label": () => (menuOpen ? t.nav.closeMenu : t.nav.openMenu),
              "aria-expanded": () => String(menuOpen),
              "aria-controls": "site-menu",
              onClick: () => (menuOpen ? closeMenu() : openMenu()),
            },
            span(st.burger, { "aria-hidden": "true", "data-open": () => String(menuOpen) }, span(), span()),
          ),
        ),
      ),
    ),
    when(() => menuMounted, MobileMenu()),
    LanguageModal(),
  );
}
