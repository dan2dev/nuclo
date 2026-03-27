import "nuclo";
import { cn, colors } from "../styles.ts";
import { setRoute, getCurrentRoute, type Route } from "../router.ts";
import { MenuIcon, XIcon, SunIcon, MoonIcon } from "./icons.ts";
import { toggleTheme, isDark } from "../theme.ts";

let mobileMenuOpen = false;

function toggleMobileMenu() {
  mobileMenuOpen = !mobileMenuOpen;
  update();
}

function closeMobileMenu() {
  mobileMenuOpen = false;
  update();
}

const navLinks: { label: string; route: Route }[] = [
  { label: "Getting Started", route: "getting-started" },
  { label: "API",             route: "core-api" },
  { label: "Styling",         route: "styling" },
  { label: "Examples",        route: "examples" },
];

function NavLink(label: string, route: Route) {
  const isActive = () => {
    const r = getCurrentRoute();
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
  return a(
    { href: import.meta.env.BASE_URL || "/" },
    cn(
      display("flex")
        .alignItems("center")
        .gap("8px")
        .cursor("pointer")
        .transition("opacity 0.15s"),
      { hover: opacity("0.8") }
    ),
    // dot
    div(
      cn(
        width("10px")
          .height("10px")
          .borderRadius("50%")
          .backgroundColor(colors.primary)
          .flexShrink("0"),
      ),
    ),
    span(
      cn(fontSize("20px").fontWeight("700").color(colors.text)),
      "nuclo"
    ),
    span(
      cn(fontSize("14px").color(colors.textMuted)),
      "/ docs"
    ),
    on("click", (e) => {
      e.preventDefault();
      setRoute("home");
      closeMobileMenu();
    })
  );
}

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
      {
        hover: backgroundColor(colors.primaryAlpha08)
          .borderColor(colors.borderPrimary)
      }
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
      {
        hover: color(colors.primary)
          .borderColor(colors.borderPrimary)
          .backgroundColor(colors.primaryAlpha08)
      }
    ),
    { ariaLabel: "Toggle theme" },
    when(() => isDark(), SunIcon()).else(MoonIcon()),
    on("click", toggleTheme)
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
    when(() => mobileMenuOpen, XIcon()).else(MenuIcon()),
    on("click", toggleMobileMenu)
  );
}

function MobileMenu() {
  return when(
    () => mobileMenuOpen,
    div(
      cn(
        position("fixed")
          .top("64px")
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

export function Header() {
  const headerWrap = cn(
    position("fixed")
      .top("0")
      .left("0")
      .right("0")
      .zIndex(100)
      .borderBottom(`1px solid ${colors.border}`)
  );

  const inner = cn(
    display("flex")
      .alignItems("center")
      .justifyContent("space-between")
      .maxWidth("1440px")
      .margin("0 auto")
      .padding("0 24px")
      .height("64px"),
    { medium: padding("0 48px") }
  );

  const desktopNav = cn(
    display("none").alignItems("center").gap("4px"),
    { medium: display("flex") }
  );

  const rightSection = cn(
    display("flex").alignItems("center").gap("8px")
  );

  return div(
    header(
      headerWrap,
      { style: { backdropFilter: "blur(16px)", background: "var(--c-header-bg)" } },
      div(
        inner,
        Brand(),
        nav(
          desktopNav,
          ...navLinks.map((link) => NavLink(link.label, link.route))
        ),
        div(
          rightSection,
          div(cn(display("none"), { medium: display("flex") }), GitHubButton()),
          ThemeToggle(),
          MobileMenuButton()
        )
      )
    ),
    MobileMenu()
  );
}
