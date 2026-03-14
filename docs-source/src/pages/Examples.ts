import "nuclo";
import { cn, colors } from "../styles.ts";
import { d } from "../components/DocsPage.ts";
import { setRoute, type Route } from "../router.ts";

type ExampleCardConfig = {
  route: Route;
  meta: string;
  icon: string;
  title: string;
  description: string;
  dark?: boolean;
  height: number;
};

const e = {
  page: d.page,

  hero: cn(
    backgroundColor(colors.bgCard)
      .borderBottom(`1px solid ${colors.border}`)
      .padding("48px 24px 44px"),
    {
      medium: padding("56px 48px 52px"),
      large: padding("64px 80px 60px"),
    }
  ),

  breadcrumb: d.breadcrumb,
  heroMeta: d.heroMeta,
  heroBadge: d.heroBadge,
  heroTitle: d.heroTitle,
  heroSubtitle: d.heroSubtitle,

  content: cn(
    display("flex")
      .flexDirection("column")
      .gap("20px")
      .padding("40px 24px 80px"),
    {
      medium: padding("48px 48px 80px"),
      large: padding("56px 80px 80px"),
    }
  ),

  rowFeaturedLeft: cn(
    display("grid").gap("20px"),
    { large: gridTemplateColumns("minmax(0, 2fr) minmax(0, 1fr)") }
  ),

  rowThree: cn(
    display("grid").gap("20px"),
    {
      medium: gridTemplateColumns("repeat(2, minmax(0, 1fr))"),
      large: gridTemplateColumns("repeat(3, minmax(0, 1fr))"),
    }
  ),

  rowFeaturedRight: cn(
    display("grid").gap("20px"),
    { large: gridTemplateColumns("minmax(0, 1fr) minmax(0, 2fr)") }
  ),

  cardLight: cn(
    display("flex")
      .flexDirection("column")
      .justifyContent("space-between")
      .gap("18px")
      .padding("28px")
      .borderRadius("20px")
      .backgroundColor(colors.bgCard)
      .border(`1px solid ${colors.border}`)
      .cursor("pointer")
      .transition("transform 0.2s, border-color 0.2s, box-shadow 0.2s"),
    {
      hover: borderColor(colors.borderPrimary)
        .transform("translateY(-2px)")
        .boxShadow(`0 18px 36px ${colors.primaryGlow}`)
    }
  ),

  cardDark: cn(
    display("flex")
      .flexDirection("column")
      .justifyContent("space-between")
      .gap("18px")
      .padding("32px")
      .borderRadius("20px")
      .backgroundColor("#0e0e0e")
      .cursor("pointer")
      .transition("transform 0.2s, box-shadow 0.2s"),
    { hover: transform("translateY(-2px)").boxShadow("0 24px 48px rgba(0,0,0,0.28)") }
  ),

  metaRow: cn(display("flex").alignItems("center").gap("8px")),
  dotLight: cn(width("8px").height("8px").borderRadius("4px").backgroundColor(colors.primary)),
  dotDark: cn(width("8px").height("8px").borderRadius("4px").backgroundColor("#D5FF40")),

  metaTextLight: cn(fontSize("11px").fontWeight("600").color(colors.textDim)),
  metaTextDark: cn(fontSize("11px").fontWeight("600").color("#888888")),

  iconLight: cn(
    display("inline-flex")
      .alignItems("center")
      .justifyContent("center")
      .width("48px")
      .height("48px")
      .borderRadius("12px")
      .backgroundColor(colors.bgSecondary)
      .fontSize("20px")
      .fontWeight("700")
      .color(colors.primary)
  ),

  iconDark: cn(
    display("inline-flex")
      .alignItems("center")
      .justifyContent("center")
      .width("56px")
      .height("56px")
      .borderRadius("14px")
      .backgroundColor("#1a1a1a")
      .fontSize("22px")
      .fontWeight("700")
      .color("#D5FF40")
  ),

  titleLight: cn(fontSize("20px").fontWeight("700").letterSpacing("-0.02em").color(colors.text)),
  titleDark: cn(fontSize("28px").fontWeight("800").letterSpacing("-0.03em").color("#FFFFFF")),

  bodyLight: cn(fontSize("13px").lineHeight("1.55").color(colors.textMuted)),
  bodyDark: cn(fontSize("14px").lineHeight("1.55").color("#C0C2B8")),

  ctaLight: cn(fontSize("13px").fontWeight("600").color(colors.primary)),
  ctaDark: cn(fontSize("13px").fontWeight("600").color("#D5FF40")),
};

function routeHref(route: Route) {
  return route === "home"
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}${route}`;
}

function Breadcrumb() {
  return div(
    e.breadcrumb,
    a(
      { href: routeHref("home") },
      cn(color(colors.textDim).transition("color 0.2s")),
      { hover: color(colors.textMuted) },
      "Docs",
      on("click", (evt) => {
        evt.preventDefault();
        setRoute("home");
      })
    ),
    span(cn(color(colors.border)), "›"),
    span(cn(color(colors.primary).fontWeight("600")), "Examples")
  );
}

function Hero() {
  return section(
    e.hero,
    Breadcrumb(),
    div(
      e.heroMeta,
      span(
        e.heroBadge,
        span(
          cn(
            width("6px")
              .height("6px")
              .borderRadius("999px")
              .backgroundColor(colors.primary)
          )
        ),
        "10 examples"
      ),
      span(cn(fontSize("13px").color(colors.textDim)), "Interactive & runnable")
    ),
    h1(e.heroTitle, "Examples"),
    p(
      e.heroSubtitle,
      "Ten interactive examples — from a state counter to async data-fetching and client-side routing. All runnable in the browser."
    )
  );
}

function ExampleCard(card: ExampleCardConfig) {
  const dark = card.dark ?? false;

  return a(
    { href: routeHref(card.route) },
    dark ? e.cardDark : e.cardLight,
    { style: { minHeight: `${card.height}px` } },
    div(
      cn(display("flex").flexDirection("column").gap("14px")),
      div(
        e.metaRow,
        span(dark ? e.dotDark : e.dotLight),
        span(dark ? e.metaTextDark : e.metaTextLight, card.meta)
      ),
      span(dark ? e.iconDark : e.iconLight, card.icon),
      h2(dark ? e.titleDark : e.titleLight, card.title),
      p(dark ? e.bodyDark : e.bodyLight, card.description)
    ),
    span(dark ? e.ctaDark : e.ctaLight, "View Example →"),
    on("click", (evt) => {
      evt.preventDefault();
      setRoute(card.route);
    })
  );
}

export function ExamplesPage() {
  return div(
    e.page,
    Hero(),
    main(
      e.content,
      div(
        e.rowFeaturedLeft,
        ExampleCard({
          route: "example-counter",
          meta: "State · Beginner",
          icon: "+",
          title: "Counter",
          description: "Classic reactive counter with increment, decrement and reset. The hello world of state-driven UI.",
          dark: true,
          height: 340,
        }),
        ExampleCard({
          route: "example-todo",
          meta: "Lists · Beginner",
          icon: "✓",
          title: "Todo List",
          description: "Full todo app with add, toggle, delete and filter — powered by list() and when().",
          height: 340,
        })
      ),
      div(
        e.rowThree,
        ExampleCard({
          route: "example-subtasks",
          meta: "Nested lists",
          icon: "≡",
          title: "Subtasks",
          description: "Nested list with expandable sub-items. Shows how lists can be composed inside each other.",
          height: 260,
        }),
        ExampleCard({
          route: "example-search",
          meta: "Filtering",
          icon: "◎",
          title: "Live Search",
          description: "Filter a list in real-time as the user types. Combines on('input') with list() provider filtering.",
          height: 260,
        }),
        ExampleCard({
          route: "example-async",
          meta: "Async loading",
          icon: "↻",
          title: "Async Data",
          description: "Fetch from an API and render loading, error and success states using when() chains.",
          height: 260,
        })
      ),
      div(
        e.rowFeaturedRight,
        ExampleCard({
          route: "example-forms",
          meta: "Input · Intermediate",
          icon: "⊡",
          title: "Forms",
          description: "Controlled form with validation, error display and submit handling — no libraries required.",
          height: 300,
        }),
        ExampleCard({
          route: "example-nested",
          meta: "Composition · Intermediate",
          icon: "⊕",
          title: "Nested Components",
          description: "Compose components with shared state passed through closures. Clean architecture, no prop-drilling.",
          dark: true,
          height: 300,
        })
      ),
      div(
        e.rowThree,
        ExampleCard({
          route: "example-animations",
          meta: "Motion",
          icon: "✦",
          title: "Animations",
          description: "CSS transitions triggered by state changes — fade in, slide and pulse effects without a library.",
          height: 260,
        }),
        ExampleCard({
          route: "example-routing",
          meta: "Navigation",
          icon: "→",
          title: "Routing",
          description: "Client-side routing with history API. Render different views based on the current URL path.",
          height: 260,
        }),
        ExampleCard({
          route: "example-styled-card",
          meta: "CSS-in-JS",
          icon: "◈",
          title: "Styled Card",
          description: "Full styling showcase — shadows, gradients, hover states and responsive breakpoints in one component.",
          height: 260,
        })
      )
    )
  );
}
