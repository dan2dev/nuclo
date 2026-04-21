import { cn, colors } from "../styles.ts";
import { setRoute, getCurrentRoute, type Route } from "../router.ts";
import { MenuIcon, XIcon, SunIcon, MoonIcon } from "./icons.ts";
import { toggleTheme, isDark } from "../theme.ts";

const navLinks: { label: string; route: Route }[] = [
  { label: "Getting Started", route: "getting-started" },
  { label: "API",             route: "core-api" },
  { label: "Styling",         route: "styling" },
  { label: "Examples",        route: "examples" },
];

function GitHubButton() {
  return a(
    {
      href: "https://github.com/dan2dev/nuclo",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    cn(
      display("flex")
        .alignItems("center")
        .padding("8px 16px")
        .borderRadius("8px")
        .backgroundColor(colors.bgIcon)
        .border(`1px solid ${colors.border}`)
        .fontSize("13px")
        .fontWeight("600")
        .color(colors.primary)
        .cursor("pointer")
        .transition("all 0.15s")
        .gap("4px"),
      { hover: backgroundColor(colors.primaryAlpha08).borderColor(colors.borderPrimary) }
    ),
    "GitHub ↗",
  );
}

function ThemeToggle() {
  return button(
    cn(
      display("flex")
        .alignItems("center")
        .justifyContent("center")
        .width("36px")
        .height("36px")
        .borderRadius("8px")
        .backgroundColor("transparent")
        .border(`1px solid ${colors.border}`)
        .color(colors.textMuted)
        .cursor("pointer")
        .transition("all 0.15s"),
      { hover: color(colors.primary).borderColor(colors.borderPrimary).backgroundColor(colors.primaryAlpha08) }
    ),
    { ariaLabel: "Toggle theme" },
    when(() => isDark(), SunIcon()).else(MoonIcon()),
    on("click", toggleTheme)
  );
}

/**
 * activeRoute: explicit value used during SSR (avoids reading global state).
 * On the client it is undefined, so getCurrentRoute() is called reactively.
 */
export function Header({ activeRoute }: { activeRoute?: string } = {}) {
  let mobileMenuOpen = false;

  function closeMobileMenu() {
    mobileMenuOpen = false;
    update();
  }

  function NavLink(label: string, route: Route) {
    const isActive = () => {
      const r = activeRoute ?? getCurrentRoute();
      if (route === "examples") return r === "examples" || r.startsWith("examples/");
      return r === route;
    };

    const base = import.meta.env.BASE_URL || "/";
    return a(
      { href: route === "home" ? base : `${base}${route}` },
      cn(
        display("flex")
          .alignItems("center")
          .padding("8px 16px")
          .borderRadius("8px")
          .fontSize("14px")
          .fontWeight("500")
          .color(colors.textMuted)
          .cursor("pointer")
          .transition("all 0.15s"),
        { hover: backgroundColor(colors.primaryAlpha08).color(colors.primary) }
      ),
      { style: () => ({ color: isActive() ? "var(--c-primary)" : undefined }) },
      label,
      on("click", (e) => {
        e.preventDefault();
        setRoute(route);
        closeMobileMenu();
      }),
    );
  }

  function Brand() {
    const base = import.meta.env.BASE_URL || "/";
    return a(
      { href: base },
      cn(
        display("flex")
          .alignItems("center")
          .gap("8px")
          .cursor("pointer")
          .transition("opacity 0.15s"),
        { hover: opacity("0.8") }
      ),
      img(
        { src: "/nuclo-logo.svg", alt: "Nuclo", class: "brand-logo" },
        cn(height("80px").width("auto").flexShrink("0").display("block")),
      ),
      on("click", (e) => {
        e.preventDefault();
        setRoute("home");
        closeMobileMenu();
      })
    );
  }

  function MobileMenuButton() {
    return button(
      cn(
        display("flex")
          .alignItems("center")
          .justifyContent("center")
          .width("40px")
          .height("40px")
          .borderRadius("8px")
          .backgroundColor("transparent")
          .border("none")
          .color(colors.text)
          .cursor("pointer")
          .transition("all 0.15s"),
        { medium: display("none") }
      ),
      { ariaLabel: () => mobileMenuOpen ? "Close navigation menu" : "Open navigation menu" },
      when(() => mobileMenuOpen, XIcon()).else(MenuIcon()),
      on("click", () => { mobileMenuOpen = !mobileMenuOpen; update(); })
    );
  }

  function MobileMenu() {
    return when(
      () => mobileMenuOpen,
      div(
        cn(
          position("fixed")
            .top("96px")
            .left("0")
            .right("0")
            .borderBottom(`1px solid ${colors.border}`)
            .padding("12px 24px 20px")
            .zIndex(99)
            .display("flex")
            .flexDirection("column")
            .gap("4px")
        ),
        { style: { backdropFilter: "blur(16px)", background: "var(--c-mobile-menu-bg)" } },
        ...navLinks.map((link) => NavLink(link.label, link.route)),
        div(
          cn(marginTop("12px").paddingTop("12px").borderTop(`1px solid ${colors.border}`)),
          GitHubButton()
        )
      )
    );
  }

  return div(
    header(
      cn(
        position("fixed")
          .top("0")
          .left("0")
          .right("0")
          .zIndex(100)
          .borderBottom(`1px solid ${colors.border}`)
      ),
      { style: { backdropFilter: "blur(16px)", background: "var(--c-header-bg)" } },
      div(
        cn(
          display("flex")
            .alignItems("center")
            .justifyContent("space-between")
            .maxWidth("1440px")
            .margin("0 auto")
            .padding("0 24px")
            .height("96px"),
          { medium: padding("0 48px") }
        ),
        Brand(),
        nav(
          cn(display("none").alignItems("center").gap("4px"), { medium: display("flex") }),
          ...navLinks.map((link) => NavLink(link.label, link.route))
        ),
        div(
          cn(display("flex").alignItems("center").gap("8px")),
          div(cn(display("none"), { medium: display("flex") }), GitHubButton()),
          ThemeToggle(),
          MobileMenuButton()
        )
      )
    ),
    MobileMenu()
  );
}
