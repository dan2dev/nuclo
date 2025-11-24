import "nuclo";
import { cn, s, colors } from "../styles.ts";
import { getCurrentRoute, setRoute, type Route } from "../router.ts";
import { GitHubIcon, MenuIcon, XIcon } from "./icons.ts";

let mobileMenuOpen = false;

function toggleMobileMenu() {
  mobileMenuOpen = !mobileMenuOpen;
  update();
}

export function closeMobileMenu() {
  mobileMenuOpen = false;
  update();
}

function NavLink(label: string, route: Route) {
  const isActive = () => getCurrentRoute() === route;
  const base = display("flex")
    .alignItems("center")
    .padding("8px 12px")
    .borderRadius("8px")
    .transition("all 0.2s")
    .position("relative");
  const indicator = position("absolute")
    .left("0")
    .top("50%")
    .transform("translateY(-50%)")
    .width("3px")
    .height("60%")
    .backgroundColor(colors.primary)
    .borderRadius("0 2px 2px 0");

  return a(
    { href: route === "home" ? import.meta.env.BASE_URL : `#${route}` },
    s.navLink,
    cn(base),
    {
      style: () => ({
        color: isActive() ? colors.primary : colors.textMuted,
        backgroundColor: isActive() ? "rgba(132, 204, 22, 0.1)" : "transparent",
        fontWeight: isActive() ? "600" : "500",
      }),
    },
    label,
    isActive() ? span(cn(indicator)) : null,
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

export function Navbar() {
  // const mobileMenuButtonStyle = display("flex")
  //   .alignItems("center")
  //   .justifyContent("center")
  //   .width("40px")
  //   .height("40px")
  //   .borderRadius("8px")
  //   .backgroundColor("transparent")
  //   .border(`1px solid ${colors.border}`)
  //   .color(colors.text)
  //   .cursor("pointer")
  //   .transition("all 0.2s");

  // const mobileNavStyle = position("fixed")
  //   .top("80px")
  //   .left("0")
  //   .right("0")
  //   .backgroundColor(colors.bg)
  //   .borderTop(`1px solid ${colors.border}`)
  //   .padding("20px 24px")
  //   .zIndex(99)
  //   .display("flex")
  //   .flexDirection("column")
  //   .gap("8px")
  //   .boxShadow("0 10px 40px rgba(0,0,0,0.3)");

  return nav(
    // s.nav,
    // Desktop navigation
    div(
      // cn(display("none"), { medium: display("flex") }),
      // cn(alignItems("center").gap("8px")),
      NavLink("Getting Started", "getting-started"),
      NavLink("API", "api"),
      NavLink("Styling", "styling"),
      NavLink("Examples", "examples"),
      a(
        {
          href: "https://github.com/dan2dev/nuclo",
          target: "_blank",
          rel: "noopener noreferrer",
          ariaLabel: "GitHub"
        },
        s.navLink,
        cn(display("flex").alignItems("center").justifyContent("center").width("40px").height("40px").borderRadius("8px").transition("all 0.2s")),
        {
          style: {
            color: colors.textMuted,
            backgroundColor: "transparent",
          },
        },
        GitHubIcon(),
        on("mouseenter", (e) => {
          (e.target as HTMLElement).style.color = colors.primary;
          (e.target as HTMLElement).style.backgroundColor = "rgba(132, 204, 22, 0.1)";
        }),
        on("mouseleave", (e) => {
          (e.target as HTMLElement).style.color = colors.textMuted;
          (e.target as HTMLElement).style.backgroundColor = "transparent";
        })
      )
    ),
    // Mobile menu button
    button(
      // cn(mobileMenuButtonStyle),
      cn(display("flex")),
      () => mobileMenuOpen ? XIcon() : MenuIcon(),
      on("click", toggleMobileMenu),
      on("mouseenter", (e) => {
        (e.target as HTMLElement).style.borderColor = colors.primary;
        (e.target as HTMLElement).style.color = colors.primary;
      }),
      on("mouseleave", (e) => {
        (e.target as HTMLElement).style.borderColor = colors.border;
        (e.target as HTMLElement).style.color = colors.text;
      })
    ),
    // Mobile navigation menu
    when(
      () => mobileMenuOpen,
      div(
        // cn(mobileNavStyle),
        NavLink("Getting Started", "getting-started"),
        NavLink("API", "api"),
        NavLink("Styling", "styling"),
        NavLink("Examples", "examples"),
        a(
          {
            href: "https://github.com/dan2dev/nuclo",
            target: "_blank",
            rel: "noopener noreferrer",
          },
          s.navLink,
          cn(display("flex").alignItems("center").gap("8px").padding("8px 12px").borderRadius("8px").transition("all 0.2s")),
          {
            style: {
              color: colors.textMuted,
            },
          },
          GitHubIcon(),
          "GitHub",
          on("click", closeMobileMenu),
          on("mouseenter", (e) => {
            (e.target as HTMLElement).style.color = colors.primary;
            (e.target as HTMLElement).style.backgroundColor = "rgba(132, 204, 22, 0.1)";
          }),
          on("mouseleave", (e) => {
            (e.target as HTMLElement).style.color = colors.textMuted;
            (e.target as HTMLElement).style.backgroundColor = "transparent";
          })
        )
      )
    )
  );
}
