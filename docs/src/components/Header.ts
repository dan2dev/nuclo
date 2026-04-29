import { cn, colors, s } from "../styles.ts";
import { setRoute, getCurrentRoute } from "../router.ts";
import { toggleTheme, isDark } from "../theme.ts";

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
  function closeMobileMenu() {
    update();
  }

  function isActive(route: string): boolean {
    const r = activeRoute ?? getCurrentRoute();
    return r === route;
  }

  const base = typeof import.meta !== 'undefined' ? (import.meta.env?.BASE_URL ?? "/") : "/";

  function NavLink(label: string, route: string) {
    return a(
      { href: route === "home" ? base : `${base}${route}` },
      cn(
        display("inline-flex").alignItems("center").padding("6px 13px")
          .borderRadius("6px").fontSize("0.875rem").fontWeight("500")
          .color(colors.textDim).transition("color 0.18s ease, background 0.18s ease"),
        { hover: color(colors.text).backgroundColor(colors.bgSecondary) }
      ),
      { style: () => ({ color: isActive(route) ? "var(--c-text)" : undefined }) },
      label,
      on("click", (e) => {
        e.preventDefault();
        setRoute(route);
        closeMobileMenu();
      }),
    );
  }

  const navInnerStyle = cn(
    display("grid")
      .gridTemplateColumns("1fr auto 1fr")
      .alignItems("center")
  );

  const logoStyle = cn(
    display("flex").alignItems("center")
      .justifySelf("center").cursor("pointer")
      .transition("opacity 0.15s ease"),
    { hover: opacity("0.8") }
  );

  const rightGroup = cn(
    display("flex").alignItems("center").gap("4px").justifySelf("end")
  );

  const navLinksGroup = cn(display("flex").alignItems("center").gap("2px"));

  const githubBtn = cn(
    display("flex").alignItems("center").gap("6px")
      .fontSize("0.8125rem").fontWeight("500")
      .padding("6px 14px").borderRadius("6px")
      .border(`1px solid ${colors.border}`)
      .color(colors.textDim).transition("all 0.18s ease"),
    { hover: color(colors.text).borderColor(colors.borderLight) }
  );

  const themeBtn = cn(
    display("flex").alignItems("center").justifyContent("center")
      .width("34px").height("34px").borderRadius("6px")
      .border(`1px solid ${colors.border}`)
      .color(colors.textDim).transition("all 0.18s ease").fontSize("15px").flexShrink("0"),
    { hover: color(colors.text).borderColor(colors.borderLight).backgroundColor(colors.bgSecondary) }
  );

  const navStyle = cn(
    position("fixed").top("0").left("0").right("0")
      .zIndex(200).height("80px")
      .backgroundColor(colors.bgNav)
      .borderBottom(`1px solid ${colors.border}`)
      .display("flex").alignItems("center")
  );

  return nav(
    navStyle,
    div(
      s.container,
      cn(width("100%")),
      div(
        navInnerStyle,
        // Left: empty
        div(),
        // Center: logo
        a(
          { href: base },
          logoStyle,
          on("click", (e) => { e.preventDefault(); setRoute("home"); }),
          img({
            src: "/nuclo-logo.svg",
            alt: "Nuclo",
            class: "brand-logo",
          },
          cn(height("64px").width("auto").display("block"))
          ),
        ),
        // Right: nav links + github + theme toggle
        div(
          rightGroup,
          div(
            navLinksGroup,
            ...NAV_LINKS.map(({ label, route }) => NavLink(label, route)),
          ),
          a(
            { href: "https://github.com/dan2dev/nuclo", target: "_blank", rel: "noopener noreferrer" },
            githubBtn,
            GitHubIcon(),
            "GitHub",
          ),
          button(
            themeBtn,
            { title: "Toggle theme" },
            when(() => isDark(), "🌙").else("☀️"),
            on("click", toggleTheme),
          ),
        ),
      ),
    ),
  );
}
