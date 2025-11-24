import "nuclo";
import { cn, colors } from "../styles.ts";
import { setRoute, getCurrentRoute, type Route } from "../router.ts";
import { NucloLogo, GitHubIcon, MenuIcon, XIcon } from "./icons.ts";

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
  { label: "Core API", route: "core-api" },
  { label: "Tag Builders", route: "tag-builders" },
  { label: "Styling", route: "styling" },
  { label: "Pitfalls", route: "pitfalls" },
  { label: "Examples", route: "examples" },
];

function NavLink(label: string, route: Route) {
  const isActive = () => getCurrentRoute() === route || getCurrentRoute().startsWith(route + "-");

  return a(
    { href: `#${route}` },
    cn(
      display("flex")
        .alignItems("center")
        .padding("8px 14px")
        .borderRadius("8px")
        .fontSize("14px")
        .fontWeight("500")
        .transition("all 0.2s")
        .cursor("pointer")
    ),
    {
      style: () => ({
        color: isActive() ? colors.primary : colors.textMuted,
        backgroundColor: isActive() ? "rgba(132, 204, 22, 0.1)" : "transparent",
      }),
    },
    label,
    on("click", (e) => {
      e.preventDefault();
      setRoute(route);
      closeMobileMenu();
    }),
    on("mouseenter", (e) => {
      if (!isActive()) {
        (e.target as HTMLElement).style.color = colors.primary;
        (e.target as HTMLElement).style.backgroundColor = "rgba(132, 204, 22, 0.05)";
      }
    }),
    on("mouseleave", (e) => {
      if (!isActive()) {
        (e.target as HTMLElement).style.color = colors.textMuted;
        (e.target as HTMLElement).style.backgroundColor = "transparent";
      }
    })
  );
}

function Brand() {
  return a(
    { href: "/nuclo/" },
    cn(
      display("flex")
        .alignItems("center")
        .gap("10px")
        .fontSize("18px")
        .fontWeight("700")
        .color(colors.primary)
        .transition("opacity 0.2s")
        .cursor("pointer")
    ),
    NucloLogo(28),
    span("Nuclo"),
    on("click", (e) => {
      e.preventDefault();
      setRoute("home");
      closeMobileMenu();
    }),
    on("mouseenter", (e) => {
      (e.currentTarget as HTMLElement).style.opacity = "0.8";
    }),
    on("mouseleave", (e) => {
      (e.currentTarget as HTMLElement).style.opacity = "1";
    })
  );
}

function GitHubLink() {
  return a(
    {
      href: "https://github.com/dan2dev/nuclo",
      target: "_blank",
      rel: "noopener noreferrer",
      ariaLabel: "GitHub"
    },
    cn(
      display("flex")
        .alignItems("center")
        .justifyContent("center")
        .width("36px")
        .height("36px")
        .borderRadius("8px")
        .transition("all 0.2s")
    ),
    {
      style: {
        color: colors.textMuted,
        backgroundColor: "transparent",
      },
    },
    GitHubIcon(),
    on("mouseenter", (e) => {
      (e.currentTarget as HTMLElement).style.color = colors.primary;
      (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(132, 204, 22, 0.1)";
    }),
    on("mouseleave", (e) => {
      (e.currentTarget as HTMLElement).style.color = colors.textMuted;
      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
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
        .transition("all 0.2s"),
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
          .backgroundColor(colors.bg)
          .borderBottom(`1px solid ${colors.border}`)
          .padding("16px 24px")
          .zIndex(99)
          .display("flex")
          .flexDirection("column")
          .gap("8px")
      ),
      { style: { backdropFilter: "blur(12px)", background: "rgba(10, 15, 26, 0.95)" } },
      ...navLinks.map((link) => NavLink(link.label, link.route)),
      div(
        cn(display("flex").alignItems("center").gap("8px").padding("8px 14px")),
        GitHubLink(),
        span(cn(color(colors.textMuted).fontSize("14px")), "GitHub")
      )
    )
  );
}

export function Header() {
  const headerStyle = cn(
    position("fixed")
      .top("0")
      .left("0")
      .right("0")
      .zIndex(100)
      .borderBottom(`1px solid ${colors.border}`)
  );

  const headerInner = cn(
    display("flex")
      .alignItems("center")
      .justifyContent("space-between")
      .maxWidth("1400px")
      .margin("0 auto")
      .padding("12px 24px"),
    { medium: padding("16px 48px") }
  );

  const desktopNav = cn(
    display("none")
      .alignItems("center")
      .gap("4px"),
    { medium: display("flex") }
  );

  const rightSection = cn(
    display("flex")
      .alignItems("center")
      .gap("8px")
  );

  return div(
    header(
      headerStyle,
      { style: { backdropFilter: "blur(12px)", background: "rgba(10, 15, 26, 0.85)" } },
      div(
        headerInner,
        Brand(),
        nav(
          desktopNav,
          ...navLinks.map((link) => NavLink(link.label, link.route))
        ),
        div(
          rightSection,
          div(cn(display("none"), { medium: display("flex") }), GitHubLink()),
          MobileMenuButton()
        )
      )
    ),
    MobileMenu()
  );
}
