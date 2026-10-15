import { css, colors, cx, s } from "../styles.ts";
import { router, currentRoute } from "../router.ts";
import { toggleTheme, isDark, getThemePreference, setThemePreference, type ThemePreference } from "../theme.ts";
import { docsSection } from "../docs-state.ts";
import { NucloBrand } from "./NucloBrand.ts";
import { GRADIENT, STROKE } from "./brand-geometry.ts";
import { GitHubSvg } from "./icons.ts";
import { animations } from "../styles/animations.ts";

const GITHUB_URL = "https://github.com/dan2dev/nuclo";
const DESKTOP = "@media (min-width: 768px)";
const WIDE = "@media (min-width: 1024px)";

type NavItem = { label: string; route: string; hash?: string };

const NAV_LINKS: NavItem[] = [
  { label: "Home",     route: "home" },
  { label: "Docs",     route: "docs" },
  { label: "Examples", route: "examples" },
];

const THEMES: [ThemePreference, string][] = [["light", "Light"], ["dark", "Dark"], ["system", "System"]];

// Single-path stroked icon (menu, close, chevron, external arrow).
function LineIcon(d: string, size = 20) {
  return svgSvg(
    { width: String(size), height: String(size), viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    pathSvg({ d, pathLength: "1" }),
  );
}

// The logo's ease (0.5 - cos(πx) / 2), as a bezier
const EASE = "cubic-bezier(0.37, 0, 0.63, 1)";
const A = animations;
const motion = (animation: string) => ({ animation, "@media (prefers-reduced-motion: reduce)": { animation: "none" } });
const ring = { outline: `2px solid ${colors.primary}`, outlineOffset: "3px" } as const;
// A square hit area for an icon. The negative margin lines the icon up with the container edge.
const iconBtn = { display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", color: colors.textDim, transition: `color 0.2s ${EASE}, background-color 0.2s ${EASE}, transform 0.2s ${EASE}`, hover: { color: colors.text, backgroundColor: colors.bgSecondary }, active: { transform: "scale(0.92)" }, focusVisible: ring } as const;
// The menu rows' delays, as --d: the pen reaches them one after the other
const delays = (n: number, from: number, step: number) =>
  Object.fromEntries(Array.from({ length: n }, (_, i) => [`& > :nth-child(${i + 1})`, { raw: { "--d": `${(from + i * step).toFixed(2)}s` } }]));

const st = {
  // The bar is translucent and blurs the page behind it, so the brand sits on the content rather than on a slab.
  bar: css("components-header-bar", { userSelect: "none", position: "fixed", top: "0", left: "0", right: "0", zIndex: 220, height: "var(--header-h)", backgroundColor: colors.bgNav, backdropFilter: "saturate(180%) blur(14px)", raw: { "-webkit-backdrop-filter": "saturate(180%) blur(14px)" }, borderBottom: `1px solid ${colors.border}` }),
  row: css("components-header-row", { display: "flex", alignItems: "center", gap: "28px", height: "100%", [WIDE]: { gap: "36px" } }),
  // The lockup, still. Its wordmark's baseline sits on the nav's text line.
  logo: css("components-header-logo", { display: "flex", alignItems: "center", flexShrink: 0, padding: "4px 0", borderRadius: "6px", focusVisible: ring, "& > svg": { height: "24px", width: "auto" }, [DESKTOP]: { "& > svg": { height: "27px" } } }),

  navWrap: css("components-header-navWrap", { display: "none", alignItems: "center", gap: "20px", height: "100%", minWidth: 0, [DESKTOP]: { display: "flex" } }),
  nav: css("components-header-nav", { display: "flex", alignItems: "stretch", gap: "26px", height: "100%" }),
  // A link's line is drawn from the left on hover, in the stroke; the current page's stays, in the primary.
  // A route change draws the new line and retracts the old one.
  navLink: css("components-header-navLink", { position: "relative", display: "flex", alignItems: "center", padding: "0 2px", fontSize: "14px", fontWeight: "500", letterSpacing: "0.01em", color: colors.textDim, whiteSpace: "nowrap", transition: `color 0.2s ${EASE}`,
    after: { content: '""', position: "absolute", left: "0", right: "0", bottom: "-1px", height: "2px", borderRadius: "2px 2px 0 0", backgroundColor: STROKE, transformOrigin: "left", transform: "scaleX(0)", opacity: "0", transition: `transform 0.4s ${EASE}, opacity 0.25s ${EASE}, background-color 0.3s ${EASE}` },
    hover: { color: colors.text, after: { transform: "scaleX(1)", opacity: "1" } }, focusVisible: { ...ring, outlineOffset: "-6px", borderRadius: "8px" } }),
  navLinkOn: css("components-header-navLinkOn", { color: colors.text, after: { transform: "scaleX(1)", opacity: "1", backgroundColor: colors.primary } }),

  crumbDivider: css("components-header-crumbDivider", { display: "none", flexShrink: 0, width: "1px", height: "18px", backgroundColor: colors.borderLight, "@media (min-width: 1100px)": { display: "block" } }),
  crumb: css("components-header-crumb", { display: "none", alignItems: "center", gap: "8px", minWidth: 0, fontSize: "13px", color: colors.textMuted, whiteSpace: "nowrap", "@media (min-width: 1100px)": { display: "flex" } }),
  crumbSep: css("components-header-crumbSep", { color: colors.border, fontSize: "15px" }),
  crumbTitle: css("components-header-crumbTitle", { maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", color: colors.textDim, fontWeight: "500" }),

  right: css("components-header-right", { display: "flex", alignItems: "center", gap: "4px", marginLeft: "auto" }),
  iconBtn: css("components-header-iconBtn", { ...iconBtn, display: "none", width: "36px", height: "36px", [DESKTOP]: { display: "flex" } }),
  // A swapped theme icon's stroke is drawn end to end (not the first one: the header enters still)
  icon: css("components-header-icon", { display: "flex" }),
  iconIn: css("components-header-iconIn", { "& path": { ...motion(`${A.strokeDraw} 0.5s ${EASE}`), raw: { "stroke-dasharray": "1" } } }),
  // The call to action wears the mark's gradient. It lifts on hover, and its arrow leads the way
  cta: css("components-header-cta", { alignItems: "center", justifyContent: "center", gap: "6px", borderRadius: "10px", backgroundImage: `linear-gradient(180deg, ${GRADIENT.from}, ${GRADIENT.to})`, color: "#fff", fontWeight: "600", whiteSpace: "nowrap", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 20px -12px var(--c-primary-glow)", transition: `transform 0.25s ${EASE}, box-shadow 0.25s ${EASE}, filter 0.25s ${EASE}`, hover: { transform: "translateY(-1px)", filter: "brightness(1.06)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 12px 26px -10px var(--c-primary-glow)", "& > svg": { transform: "translateX(2px)" } }, active: { transform: "translateY(0) scale(0.98)" }, focusVisible: ring, "& > svg": { transition: `transform 0.25s ${EASE}` } }),
  ctaBar: css("components-header-ctaBar", { display: "none", height: "36px", padding: "0 12px 0 15px", marginLeft: "10px", fontSize: "14px", [WIDE]: { display: "inline-flex" } }),
  ctaMenu: css("components-header-ctaMenu", { display: "flex", height: "52px", fontSize: "16px", borderRadius: "12px" }),
  menuBtn: css("components-header-menuBtn", { ...iconBtn, width: "44px", height: "44px", marginRight: "-12px", color: colors.text, [DESKTOP]: { display: "none" } }),
  // Two bars that fold into a cross while the menu is open
  burger: css("components-header-burger", { position: "relative", width: "20px", height: "14px", "& > span": { position: "absolute", left: "0", width: "100%", height: "2px", borderRadius: "2px", backgroundColor: "currentColor", transition: `top 0.25s ${EASE}, transform 0.3s ${EASE}` }, "& > span:first-child": { top: "0" }, "& > span:last-child": { top: "12px" }, '&[data-open="true"] > span': { top: "6px" }, '&[data-open="true"] > span:first-child': { transform: "rotate(45deg)" }, '&[data-open="true"] > span:last-child': { transform: "rotate(-45deg)" } }),

  // ── Mobile menu ──
  menu: css("components-header-menu", { position: "fixed", inset: "var(--header-h) 0 0 0", zIndex: 215, display: "flex", flexDirection: "column", backgroundColor: colors.bg }),
  menuList: css("components-header-menuList", { flex: "1 1 auto", minHeight: 0, overflowY: "auto", padding: "12px 0", "& > div": delays(4, 0.05, 0.1) }),
  // Each row: its divider is drawn, then its label inks in
  menuItem: css("components-header-menuItem", { after: { content: '""', display: "block", height: "1px", backgroundColor: colors.border, transformOrigin: "left", ...motion(`${A.draw} 0.5s ${EASE} var(--d, 0s) backwards`) } }),
  menuRow: css("components-header-menuRow", { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", height: "68px", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.02em", color: colors.text, textAlign: "left", transition: `color 0.2s ${EASE}`, ...motion(`${A.ink} 0.4s ${EASE} calc(var(--d, 0s) + 0.25s) backwards`), hover: { "& > span:last-child": { transform: "translateX(4px)", color: colors.text } } }),
  menuRowOn: css("components-header-menuRowOn", { color: colors.primaryInk }),
  rowIcon: css("components-header-rowIcon", { display: "flex", color: colors.textMuted, transition: `transform 0.25s ${EASE}, color 0.18s ease` }),
  srOnly: css("components-header-srOnly", { position: "absolute", width: "1px", height: "1px", overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }),
  menuFoot: css("components-header-menuFoot", { flexShrink: 0, padding: "16px 0 max(16px, env(safe-area-inset-bottom))", borderTop: `1px solid ${colors.border}`, ...motion(`${A.ink} 0.4s ${EASE} 0.55s backwards`) }),
  menuFootInner: css("components-header-menuFootInner", { display: "flex", flexDirection: "column", gap: "12px" }),
  themeGroup: css("components-header-themeGroup", { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "4px", padding: "4px", height: "48px", borderRadius: "12px", backgroundColor: colors.bgSecondary }),
  themeOpt: css("components-header-themeOpt", { borderRadius: "8px", fontSize: "14px", fontWeight: "500", color: colors.textDim, transition: `background-color 0.25s ${EASE}, color 0.25s ${EASE}, box-shadow 0.25s ${EASE}` }),
  themeOptOn: css("components-header-themeOptOn", { color: colors.text, backgroundColor: colors.bgCard, boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }),
};

export function Header() {
  let themeSwapped = false; // after the first toggle the theme icon draws itself in
  let menuOpen = false;
  let menuMounted = false; // stays true while the exit animation plays
  let menuEl: HTMLElement | undefined;

  const route = currentRoute;
  const href = (r: string, hash?: string) => router.href(r === "home" ? "/" : `/${r}`) + (hash ? `#${hash}` : "");

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

  function RouteLink({ label, route: r, hash }: NavItem, style: ReturnType<typeof css>, onStyle: ReturnType<typeof css>, trailing = false) {
    const on = () => !hash && route() === r;
    return a(
      {
        href: href(r, hash),
        class: () => cx(style, on() ? onStyle : null).className,
        "aria-current": () => (on() ? "page" : "false"),
        // Not prevented: the router navigates, a same-page #hash is the browser's.
        onClick: closeMenu,
      },
      label,
      ...(trailing ? [span(st.rowIcon, LineIcon("M5 12h14 M13 6l6 6-6 6", 18))] : []),
    );
  }

  function Logo() {
    return a(
      st.logo,
      { href: href("home"), "aria-label": "Nuclo home", onClick: closeMenu },
      NucloBrand({ height: 27 }),
    );
  }

  const ThemeIcon = () => ({ class: () => cx(st.icon, themeSwapped ? st.iconIn : null).className });

  function GetStarted(variant: ReturnType<typeof css>) {
    return a(
      st.cta, variant,
      { href: href("docs", "quick-start"), onClick: closeMenu },
      "Get started",
      ...(variant === st.ctaBar ? [LineIcon("M5 12h14 M13 6l6 6-6 6", 15)] : []),
    );
  }

  // ── Mobile menu (only rendered while open) ────────────────────────────────
  function MobileMenu() {
    return div(
      st.menu,
      {
        id: "site-menu",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Menu",
        // Open/close side effects live on the overlay's own lifecycle.
        onMount: (el) => {
          menuEl = el;
          // The rows draw and ink themselves (CSS); the panel just appears under them
          el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: motion(160), easing: EASE });
          const ac = new AbortController();
          document.documentElement.style.overflow = "hidden";
          document.addEventListener("keydown", (e) => {
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
      nav(
        st.menuList,
        { "aria-label": "Main" },
        div(
          s.container,
          div(st.menuItem, RouteLink(NAV_LINKS[0], st.menuRow, st.menuRowOn, true)),
          div(st.menuItem, RouteLink(NAV_LINKS[1], st.menuRow, st.menuRowOn, true)),
          div(st.menuItem, RouteLink(NAV_LINKS[2], st.menuRow, st.menuRowOn, true)),
          div(
            st.menuItem,
            a(
              st.menuRow,
              { href: GITHUB_URL, target: "_blank", rel: "noopener noreferrer" },
              span("GitHub", span(st.srOnly, " (opens in a new tab)")),
              span(st.rowIcon, LineIcon("M7 17L17 7 M8 7h9v9", 16)),
            ),
          ),
        ),
      ),
      div(
        st.menuFoot,
        div(
          s.container, st.menuFootInner,
          div(
            st.themeGroup,
            { role: "radiogroup", "aria-label": "Theme" },
            ...THEMES.map(([pref, label]) => button(
              {
                type: "button",
                role: "radio",
                class: () => cx(st.themeOpt, getThemePreference() === pref ? st.themeOptOn : null).className,
                "aria-checked": () => String(getThemePreference() === pref),
                onClick: () => setThemePreference(pref),
              },
              label,
            )),
          ),
          GetStarted(st.ctaMenu),
        ),
      ),
    );
  }

  return div(
    header(
      st.bar,
      div(
        s.container, st.row,
        Logo(),
        div(
          st.navWrap,
          nav(st.nav, { "aria-label": "Main" }, ...NAV_LINKS.map((l) => RouteLink(l, st.navLink, st.navLinkOn))),
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
        div(
          st.right,
          a(st.iconBtn, { href: GITHUB_URL, target: "_blank", rel: "noopener noreferrer", "aria-label": "Nuclo on GitHub" }, GitHubSvg({ size: 18 })),
          button(
            st.iconBtn,
            { type: "button", "aria-label": "Switch color theme", onClick: () => { themeSwapped = true; toggleTheme(); } },
            when(() => isDark(), span(ThemeIcon(), LineIcon("M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z", 17)))
              .else(span(ThemeIcon(), LineIcon("M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41", 17))),
          ),
          GetStarted(st.ctaBar),
          button(
            st.menuBtn,
            {
              id: "site-menu-button",
              type: "button",
              "aria-label": () => (menuOpen ? "Close menu" : "Open menu"),
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
  );
}
