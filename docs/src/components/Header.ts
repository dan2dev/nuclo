import { css, colors, cx, s } from "../styles.ts";
import { fx } from "../styles/effects.ts";
import { animations } from "../styles/animations.ts";
import { setRoute, getCurrentRoute } from "../router.ts";
import { toggleTheme, isDark } from "../theme.ts";
import { MoonIcon, SunIcon } from "./icons.ts";

const NAV_LINKS: { label: string; route: string }[] = [
  { label: "Home",     route: "home" },
  { label: "Docs",     route: "docs" },
  { label: "Examples", route: "examples" },
];

function GitHubIcon() {
  return svgSvg(
    { width: "15", height: "15", viewBox: "0 0 24 24", fill: "currentColor" },
    pathSvg({ d: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" })
  );
}

export function Header({ activeRoute }: { activeRoute?: string } = {}) {
  let menuOpen = false;

  function toggleMenu() {
    menuOpen = !menuOpen;
    update();
  }

  function closeMenu() {
    if (menuOpen) {
      menuOpen = false;
      update();
    }
  }

  function isActive(route: string): boolean {
    const r = activeRoute ?? getCurrentRoute();
    return r === route;
  }

  const base = typeof import.meta !== 'undefined' ? (import.meta.env?.BASE_URL ?? "/") : "/";

  // ── Desktop nav link ─────────────────────────────────────────────────────
  function NavLink(label: string, route: string) {
    return a(
      { href: route === "home" ? base : `${base}${route}` },
      navLinkStyle,
      { class: () => cx(navLinkStyle, isActive(route) ? navLinkActiveStyle : null).className },
      label,
      on("click", (e) => {
        e.preventDefault();
        setRoute(route);
        closeMenu();
      }),
    );
  }

  // ── Mobile nav link (full-width, larger tap target) ───────────────────────
  function MobileNavLink(label: string, route: string) {
    return a(
      { href: route === "home" ? base : `${base}${route}` },
      mobileNavLinkStyle,
      { class: () => cx(mobileNavLinkStyle, isActive(route) ? mobileNavLinkActiveStyle : null).className },
      label,
      on("click", (e) => {
        e.preventDefault();
        setRoute(route);
        closeMenu();
      }),
    );
  }

  // ── Hamburger / X animated icon ───────────────────────────────────────────
  function MenuIcon() {
    return div(
      menuIconStyle,
      div(menuLineStyle, { class: () => cx(menuLineStyle, menuOpen ? menuLineTopOpenStyle : null).className }),
      div(menuLineStyle, { class: () => cx(menuLineStyle, menuOpen ? menuLineMiddleOpenStyle : null).className }),
      div(menuLineStyle, { class: () => cx(menuLineStyle, menuOpen ? menuLineBottomOpenStyle : null).className }),
    );
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const navLinkStyle = css({ display: "inline-flex", alignItems: "center", height: "34px", padding: "0 13px", borderRadius: "6px", fontSize: "0.875rem", fontWeight: "600", color: colors.textDim, transition: "color 0.18s ease, background 0.18s ease", hover: { color: colors.text, backgroundColor: colors.bgSecondary } });
  const navLinkActiveStyle = css({ color: colors.text, backgroundColor: colors.primaryAlpha08 });
  const mobileNavLinkStyle = css({ display: "flex", alignItems: "center", padding: "16px 24px", fontSize: "1rem", fontWeight: "500", color: colors.textDim, transition: "all 0.18s ease", borderBottom: `1px solid ${colors.border}`, hover: { color: colors.text, backgroundColor: colors.bgSecondary } });
  const mobileNavLinkActiveStyle = css({ color: colors.text, fontWeight: "600" });
  const menuIconStyle = css({ display: "flex", flexDirection: "column", gap: "5px", alignItems: "center", justifyContent: "center", width: "20px", height: "20px" });
  const menuLineStyle = css({ display: "block", width: "20px", height: "2px", backgroundColor: colors.textDim, borderRadius: "2px", transition: "all 0.28s cubic-bezier(0.4,0,0.2,1)" });
  const menuLineTopOpenStyle = css({ transform: "translateY(7px) rotate(45deg)" });
  const menuLineMiddleOpenStyle = css({ opacity: "0", transform: "scaleX(0)" });
  const menuLineBottomOpenStyle = css({ transform: "translateY(-7px) rotate(-45deg)" });
  const navStyle = css({ position: "fixed", top: "0", left: "0", right: "0", zIndex: 200, height: "80px", backgroundColor: colors.bgNav, borderBottom: `1px solid ${colors.border}`, boxShadow: "0 1px 0 rgba(255,255,255,0.02)", backdropFilter: "saturate(140%) blur(14px)", animation: `${animations.pageFadeIn} 0.34s ease both`, display: "flex", alignItems: "center" });

  const navInnerStyle = css({ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: "22px" });

  const logoStyle = css({ display: "flex", alignItems: "center", justifySelf: "start", cursor: "pointer", transition: "opacity 0.15s ease", hover: { opacity: "0.8" } });

  const rightGroup = css({ display: "flex", alignItems: "center", gap: "8px", justifySelf: "end" });

  // Desktop nav links — hidden on mobile, flex on medium+
  const desktopNavLinks = css({ display: "none", alignItems: "center", justifySelf: "center", gap: "3px", padding: "4px", border: `1px solid ${colors.border}`, borderRadius: "8px", backgroundColor: colors.bgCard, medium: { display: "flex" } });

  // Desktop GitHub button — hidden on mobile
  const desktopGithub = css({ display: "none", alignItems: "center", gap: "6px", height: "34px", fontSize: "0.8125rem", fontWeight: "600", padding: "0 13px", borderRadius: "6px", border: `1px solid ${colors.border}`, color: colors.textDim, backgroundColor: colors.bgCard, transition: "all 0.18s ease", medium: { display: "flex" },
      hover: { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.bgSecondary } });

  const themeBtn = css({ display: "flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", borderRadius: "6px", border: `1px solid ${colors.border}`, color: colors.textDim, backgroundColor: colors.bgCard, transition: "all 0.18s ease", fontSize: "15px", flexShrink: 0, hover: { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.bgSecondary } });

  // Mobile hamburger button — flex on mobile, hidden on medium+
  const hamburgerBtn = css({ display: "flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", borderRadius: "6px", border: `1px solid ${colors.border}`, color: colors.textDim, backgroundColor: colors.bgCard, transition: "all 0.18s ease", cursor: "pointer", medium: { display: "none" },
      hover: { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.bgSecondary } });

  // Mobile dropdown panel — hidden on medium+ via CSS
  const mobileMenuPanel = css({ position: "fixed", left: "0", right: "0", zIndex: 199, backgroundColor: "var(--c-mobile-menu-bg)", borderBottom: `1px solid ${colors.border}`, overflow: "hidden", transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease", medium: { display: "none" } });
  const mobileMenuPanelOpen = css({ maxHeight: "480px", opacity: "1", pointerEvents: "auto" });
  const mobileMenuPanelClosed = css({ maxHeight: "0", opacity: "0", pointerEvents: "none" });

  // Transparent backdrop to close menu on outside click
  const backdropStyle = css({ position: "fixed", top: "0", left: "0", right: "0", bottom: "0", zIndex: 198, backgroundColor: "rgba(0,0,0,0.35)", transition: "opacity 0.25s ease" });
  const backdropOpenStyle = css({ opacity: "1", pointerEvents: "auto" });
  const backdropClosedStyle = css({ opacity: "0", pointerEvents: "none" });

  return div(
    // ── Navbar ──────────────────────────────────────────────────────────────
    nav(
      navStyle,
      // Gradient hairline along the bottom edge
      div(
        fx.hairline,
        { "aria-hidden": "true" },
        css({ position: "absolute", left: "0", right: "0", bottom: "-1px" }),
      ),
      div(
        s.container,
        css({ width: "100%" }),
        div(
          navInnerStyle,
          // Left: logo
          a(
            { href: base },
            logoStyle,
            on("click", (e) => { e.preventDefault(); setRoute("home"); closeMenu(); }),
            img({
              src: "/nuclo-logo.svg",
              alt: "Nuclo",
              class: fx.brandLogo.className,
            },
            css({ height: "54px", width: "auto", display: "block" })
            ),
          ),
          // Center: route navigation
          div(
            desktopNavLinks,
            ...NAV_LINKS.map(({ label, route }) => NavLink(label, route)),
          ),
          // Right: controls
          div(
            rightGroup,
            // Desktop GitHub (hidden on mobile)
            a(
              { href: "https://github.com/dan2dev/nuclo", target: "_blank", rel: "noopener noreferrer" },
              desktopGithub,
              GitHubIcon(),
              "GitHub",
            ),
            // Theme toggle (always visible)
            button(
              themeBtn,
              { title: "Toggle theme", "aria-label": "Toggle color theme" },
              when(() => isDark(), MoonIcon()).else(SunIcon()),
              on("click", toggleTheme),
            ),
            // Mobile hamburger (hidden on desktop)
            button(
              hamburgerBtn,
              { title: "Toggle menu", "aria-label": "Toggle navigation menu" },
              MenuIcon(),
              on("click", toggleMenu),
            ),
          ),
        ),
      ),
    ),

    // ── Mobile dropdown menu ─────────────────────────────────────────────────
    div(
      mobileMenuPanel,
      css({ top: "80px" }),
      { class: () => cx(mobileMenuPanel, menuOpen ? mobileMenuPanelOpen : mobileMenuPanelClosed).className },
      ...NAV_LINKS.map(({ label, route }) => MobileNavLink(label, route)),
      // GitHub in mobile menu
      a(
        {
          href: "https://github.com/dan2dev/nuclo",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        css({ display: "flex", alignItems: "center", gap: "10px", padding: "16px 24px", fontSize: "1rem", fontWeight: "500", color: colors.textDim, transition: "all 0.18s ease", hover: { color: colors.text, backgroundColor: colors.bgSecondary } }),
        GitHubIcon(),
        "GitHub",
      ),
    ),

    // ── Backdrop (click outside to close) ────────────────────────────────────
    div(
      backdropStyle,
      { class: () => cx(backdropStyle, menuOpen ? backdropOpenStyle : backdropClosedStyle).className },
      on("click", closeMenu),
    ),
  );
}
