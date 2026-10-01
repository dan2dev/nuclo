import { css, colors, cx, s } from "../styles.ts";
import { setRoute, getCurrentRoute } from "../router.ts";
import { toggleTheme, isDark, getThemePreference, setThemePreference, type ThemePreference } from "../theme.ts";
import { docsSection } from "../docs-state.ts";
import { BrandLogo } from "./BrandLogo.ts";
import { GitHubSvg } from "./icons.ts";

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
    pathSvg({ d }),
  );
}

// 44px tap target; the negative margin lines the icon up with the container edge.
const tapBtn = { display: "flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", marginRight: "-12px", borderRadius: "8px", hover: { color: colors.text, backgroundColor: colors.bgSecondary } } as const;

const st = {
  bar: css("components-header-bar", { userSelect: "none", position: "fixed", top: "0", left: "0", right: "0", zIndex: 220, height: "var(--header-h)", backgroundColor: colors.bg, borderBottom: `1px solid ${colors.border}` }),
  row: css("components-header-row", { display: "flex", alignItems: "center", gap: "40px", height: "100%" }),
  logo: css("components-header-logo", { display: "flex", alignItems: "center", flexShrink: 0 }),

  navWrap: css("components-header-navWrap", { display: "none", alignItems: "center", gap: "24px", height: "100%", minWidth: 0, [DESKTOP]: { display: "flex" } }),
  nav: css("components-header-nav", { display: "flex", alignItems: "stretch", gap: "28px", height: "100%" }),
  // The 2px underline sits on the header's bottom border (negative margin).
  navLink: css("components-header-navLink", { display: "flex", alignItems: "center", marginBottom: "-1px", borderBottom: "2px solid transparent", fontSize: "14px", fontWeight: "500", color: colors.textDim, whiteSpace: "nowrap", transition: "color 0.15s ease", hover: { color: colors.text } }),
  navLinkOn: css("components-header-navLinkOn", { color: colors.text, borderBottomColor: colors.primary }),

  crumbDivider: css("components-header-crumbDivider", { display: "none", flexShrink: 0, width: "1px", height: "16px", backgroundColor: colors.borderLight, "@media (min-width: 1100px)": { display: "block" } }),
  crumb: css("components-header-crumb", { display: "none", alignItems: "center", gap: "8px", minWidth: 0, fontSize: "13px", color: colors.textMuted, whiteSpace: "nowrap", "@media (min-width: 1100px)": { display: "flex" } }),
  crumbTitle: css("components-header-crumbTitle", { maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", color: colors.textDim }),

  right: css("components-header-right", { display: "flex", alignItems: "center", gap: "4px", marginLeft: "auto" }),
  iconBtn: css("components-header-iconBtn", { display: "none", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "8px", color: colors.textDim, hover: { color: colors.text, backgroundColor: colors.bgSecondary }, [DESKTOP]: { display: "flex" } }),
  cta: css("components-header-cta", { alignItems: "center", justifyContent: "center", borderRadius: "8px", backgroundColor: colors.primaryDark, color: "#fff", fontWeight: "600", whiteSpace: "nowrap", hover: { filter: "brightness(0.92)" } }),
  ctaBar: css("components-header-ctaBar", { display: "none", height: "36px", padding: "0 14px", marginLeft: "12px", fontSize: "14px", [WIDE]: { display: "inline-flex" } }),
  ctaMenu: css("components-header-ctaMenu", { display: "flex", height: "52px", fontSize: "16px", borderRadius: "12px" }),
  menuBtn: css("components-header-menuBtn", { ...tapBtn, color: colors.text, [DESKTOP]: { display: "none" } }),

  // ── Mobile menu ──
  menu: css("components-header-menu", { position: "fixed", inset: "var(--header-h) 0 0 0", zIndex: 215, display: "flex", flexDirection: "column", backgroundColor: colors.bg }),
  menuList: css("components-header-menuList", { flex: "1 1 auto", minHeight: 0, overflowY: "auto", padding: "12px 0" }),
  menuItem: css("components-header-menuItem", { borderBottom: `1px solid ${colors.border}` }),
  menuRow: css("components-header-menuRow", { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", height: "68px", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.02em", color: colors.text, textAlign: "left" }),
  menuRowOn: css("components-header-menuRowOn", { color: colors.primaryInk }),
  rowIcon: css("components-header-rowIcon", { display: "flex", color: colors.textMuted, transition: "transform 0.2s ease" }),
  srOnly: css("components-header-srOnly", { position: "absolute", width: "1px", height: "1px", overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }),
  menuFoot: css("components-header-menuFoot", { flexShrink: 0, padding: "16px 0 max(16px, env(safe-area-inset-bottom))", borderTop: `1px solid ${colors.border}` }),
  menuFootInner: css("components-header-menuFootInner", { display: "flex", flexDirection: "column", gap: "12px" }),
  themeGroup: css("components-header-themeGroup", { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "4px", padding: "4px", height: "48px", borderRadius: "12px", backgroundColor: colors.bgSecondary }),
  themeOpt: css("components-header-themeOpt", { borderRadius: "8px", fontSize: "14px", fontWeight: "500", color: colors.textDim, transition: "background-color 0.2s ease, color 0.2s ease" }),
  themeOptOn: css("components-header-themeOptOn", { color: colors.text, backgroundColor: colors.bgCard, boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }),
};

export function Header({ activeRoute }: { activeRoute?: string } = {}) {
  let menuOpen = false;
  let menuMounted = false; // stays true while the exit animation plays
  let menuEl: HTMLElement | undefined;

  const base = typeof import.meta !== 'undefined' ? (import.meta.env?.BASE_URL ?? "/") : "/";
  const route = () => activeRoute ?? getCurrentRoute();
  const href = (r: string, hash?: string) => (r === "home" ? base : `${base}${r}`) + (hash ? `#${hash}` : "");

  const motion = (ms: number) => (matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms);
  const SLIDE = (y: string, o: number) => ({ opacity: o, transform: `translateY(${y})` });

  function openMenu() {
    menuOpen = menuMounted = true;
    update();
  }

  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    update();
    if (!menuEl) { menuMounted = false; return update(); }
    menuEl.animate([SLIDE("0", 1), SLIDE("-12px", 0)], { duration: motion(180), easing: "ease-in", fill: "forwards" }).finished
      .catch(() => {})
      .then(() => { if (!menuOpen) { menuMounted = false; update(); } });
  }

  // Same-route hash links just scroll; everything else goes through the router.
  function go(r: string, hash?: string) {
    closeMenu();
    if (hash && r === route()) {
      document.getElementById(hash)?.scrollIntoView({ block: "start" });
      history.replaceState(null, "", `#${hash}`);
    } else {
      setRoute(r, hash);
    }
  }

  function RouteLink({ label, route: r, hash }: NavItem, style: ReturnType<typeof css>, onStyle: ReturnType<typeof css>, trailing = false) {
    const on = () => !hash && route() === r;
    return a(
      {
        href: href(r, hash),
        class: () => cx(style, on() ? onStyle : null).className,
        "aria-current": () => (on() ? "page" : "false"),
        onClick: (e) => { e.preventDefault(); go(r, hash); },
      },
      label,
      ...(trailing ? [span(st.rowIcon, LineIcon("M5 12h14 M13 6l6 6-6 6", 18))] : []),
    );
  }

  function Logo() {
    return a(
      st.logo,
      { href: base, "aria-label": "Nuclo home", onClick: (e) => { e.preventDefault(); go("home"); } },
      BrandLogo(),
    );
  }

  function GetStarted(variant: ReturnType<typeof css>) {
    return a(
      st.cta, variant,
      { href: href("docs", "quick-start"), onClick: (e) => { e.preventDefault(); go("docs", "quick-start"); } },
      "Get started",
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
          el.animate([SLIDE("-12px", 0), SLIDE("0", 1)], { duration: motion(240), easing: "cubic-bezier(0.32, 0.72, 0, 1)" });
          [...el.querySelectorAll("nav > div > div"), el.lastElementChild!].forEach((n, i) =>
            n.animate([SLIDE("14px", 0), SLIDE("0", 1)], { duration: motion(380), delay: motion(60 + i * 45), easing: "cubic-bezier(0.32, 0.72, 0, 1)", fill: "backwards" }));
          const ac = new AbortController();
          document.body.style.overflow = "hidden";
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
            document.body.style.overflow = "";
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
              span({ "aria-hidden": "true" }, "/"),
              span(st.crumbTitle, () => docsSection.title),
            ),
          ),
        ),
        div(
          st.right,
          a(st.iconBtn, { href: GITHUB_URL, target: "_blank", rel: "noopener noreferrer", "aria-label": "Nuclo on GitHub" }, GitHubSvg({ size: 18 })),
          button(
            st.iconBtn,
            { type: "button", "aria-label": "Switch color theme", onClick: toggleTheme },
            when(() => isDark(), LineIcon("M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z", 17))
              .else(LineIcon("M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41", 17)),
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
            when(() => menuOpen, LineIcon("M6 6l12 12 M18 6L6 18")).else(LineIcon("M4 8h16 M4 16h16")),
          ),
        ),
      ),
    ),
    when(() => menuMounted, MobileMenu()),
  );
}
