import "nuclo";
import { cn, colors } from "../styles.ts";
import { CodeBlock, InlineCode } from "../components/CodeBlock.ts";
import { ArrowRightIcon } from "../components/icons.ts";
import { gettingStartedCode } from "../content/gettingStarted.ts";
import { setRoute, type Route } from "../router.ts";

type TocItem = {
  id: string;
  label: string;
};

type CalloutTone = "info" | "success";

const tocItems: TocItem[] = [
  { id: "installation", label: "Installation" },
  { id: "first-app", label: "Your First App" },
  { id: "update", label: "Understanding update()" },
  { id: "dynamic", label: "Dynamic Functions" },
  { id: "events", label: "Event Handling" },
  { id: "next-steps", label: "Next Steps" },
];

let activeSection = tocItems[0].id;
let sectionObserver: IntersectionObserver | null = null;

const gs = {
  page: cn(
    width("100%")
      .maxWidth("1440px")
      .margin("0 auto")
      .backgroundColor(colors.bg)
  ),

  hero: cn(
    backgroundColor(colors.bgCard)
      .borderBottom(`1px solid ${colors.border}`)
      .padding("40px 24px 36px"),
    {
      medium: padding("56px 48px 42px"),
      large: padding("56px 80px 48px"),
    }
  ),

  breadcrumb: cn(
    display("flex")
      .alignItems("center")
      .gap("6px")
      .fontSize("13px")
      .marginBottom("14px")
      .flexWrap("wrap")
  ),

  heroMeta: cn(
    display("flex")
      .alignItems("center")
      .gap("12px")
      .flexWrap("wrap")
      .marginBottom("12px")
  ),

  heroBadge: cn(
    display("inline-flex")
      .alignItems("center")
      .gap("6px")
      .padding("5px 14px")
      .borderRadius("999px")
      .fontSize("12px")
      .fontWeight("600")
      .color(colors.primary)
      .backgroundColor(colors.primaryAlpha08)
      .border(`1px solid ${colors.borderPrimary}`)
  ),

  heroTitle: cn(
    fontSize("40px")
      .fontWeight("800")
      .letterSpacing("-0.04em")
      .lineHeight("1.05")
      .color(colors.text)
      .marginBottom("16px"),
    {
      medium: fontSize("48px"),
      large: fontSize("56px"),
    }
  ),

  heroSubtitle: cn(
    fontSize("17px")
      .lineHeight("1.65")
      .color(colors.textMuted)
      .maxWidth("680px")
      .marginBottom("18px"),
    { medium: fontSize("18px") }
  ),

  heroFooter: cn(
    display("flex")
      .alignItems("center")
      .gap("12px")
      .flexWrap("wrap")
      .fontSize("12px")
  ),

  mobileToc: cn(
    display("flex")
      .gap("8px")
      .overflowX("auto")
      .padding("14px 24px 18px")
      .borderBottom(`1px solid ${colors.border}`)
      .backgroundColor(colors.bg),
    {
      medium: padding("14px 48px 18px"),
      large: display("none"),
    }
  ),

  contentArea: cn(display("flex").width("100%")),

  sidebar: cn(
    display("none")
      .width("260px")
      .flexShrink("0")
      .padding("48px 20px 80px 48px")
      .backgroundColor(colors.bgSecondary)
      .borderRight(`1px solid ${colors.border}`),
    { large: display("block") }
  ),

  sidebarSticky: cn(
    position("sticky")
      .top("96px")
      .display("flex")
      .flexDirection("column")
      .gap("2px")
      .maxHeight("calc(100vh - 128px)")
      .overflowY("auto")
  ),

  main: cn(
    display("flex")
      .flexDirection("column")
      .gap("56px")
      .minWidth("0")
      .padding("40px 24px 72px"),
    {
      medium: padding("48px 48px 80px"),
      large: padding("48px 80px 80px 48px"),
    }
  ),

  section: cn(display("flex").flexDirection("column").gap("20px")),

  sectionIntro: cn(display("flex").flexDirection("column").gap("6px")),

  sectionIndex: cn(
    fontSize("12px")
      .fontWeight("700")
      .letterSpacing("0.14em")
      .textTransform("uppercase")
      .color(colors.primary)
  ),

  sectionTitle: cn(
    fontSize("28px")
      .fontWeight("700")
      .letterSpacing("-0.03em")
      .lineHeight("1.15")
      .color(colors.text),
    { medium: fontSize("32px") }
  ),

  sectionDescription: cn(
    fontSize("15px")
      .lineHeight("1.65")
      .color(colors.textMuted)
      .maxWidth("680px")
  ),

  card: cn(
    backgroundColor(colors.bgCard)
      .border(`1px solid ${colors.border}`)
      .borderRadius("12px")
      .overflow("hidden")
  ),

  cardHeader: cn(
    display("flex")
      .alignItems("center")
      .gap("14px")
      .padding("18px 24px 16px")
      .borderBottom(`1px solid ${colors.border}`)
  ),

  stepBadge: cn(
    display("inline-flex")
      .alignItems("center")
      .justifyContent("center")
      .width("28px")
      .height("28px")
      .borderRadius("999px")
      .backgroundColor(colors.primary)
      .color(colors.primaryText)
      .fontSize("13px")
      .fontWeight("700")
      .flexShrink("0")
  ),

  cardTitle: cn(fontSize("15px").fontWeight("600").color(colors.text)),
  bodyText: cn(fontSize("14px").lineHeight("1.65").color(colors.textMuted)),
  bodyTextLarge: cn(fontSize("15px").lineHeight("1.65").color(colors.textMuted)),

  cardBody: cn(display("flex").flexDirection("column").gap("12px").padding("16px 24px 20px")),

  bulletList: cn(display("flex").flexDirection("column").gap("10px")),
  bulletItem: cn(display("flex").gap("12px").alignItems("flex-start")),
  bulletDot: cn(
    width("6px")
      .height("6px")
      .borderRadius("999px")
      .backgroundColor(colors.primary)
      .marginTop("8px")
      .flexShrink("0")
  ),

  whyGrid: cn(
    display("grid").gap("12px"),
    {
      medium: gridTemplateColumns("repeat(2, minmax(0, 1fr))"),
      large: gridTemplateColumns("repeat(4, minmax(0, 1fr))"),
    }
  ),

  whyCard: cn(
    backgroundColor(colors.bgCard)
      .border(`1px solid ${colors.border}`)
      .borderRadius("10px")
      .padding("16px 18px")
      .display("flex")
      .flexDirection("column")
      .gap("6px")
  ),

  compactGrid: cn(
    display("grid").gap("16px"),
    {
      medium: gridTemplateColumns("repeat(2, minmax(0, 1fr))"),
      large: gridTemplateColumns("repeat(3, minmax(0, 1fr))"),
    }
  ),

  compactCard: cn(
    backgroundColor(colors.bgCard)
      .border(`1px solid ${colors.border}`)
      .borderRadius("12px")
      .padding("18px 20px")
      .display("flex")
      .flexDirection("column")
      .gap("10px")
  ),

  divider: cn(width("100%").height("1px").backgroundColor(colors.border)),

  nextGrid: cn(
    display("grid").gap("16px"),
    {
      medium: gridTemplateColumns("repeat(2, minmax(0, 1fr))"),
      large: gridTemplateColumns("repeat(3, minmax(0, 1fr))"),
    }
  ),

  nextCard: cn(
    display("flex")
      .flexDirection("column")
      .gap("12px")
      .padding("20px 22px")
      .backgroundColor(colors.bgCard)
      .border(`1px solid ${colors.border}`)
      .borderRadius("12px")
      .cursor("pointer")
      .transition("transform 0.2s, border-color 0.2s, box-shadow 0.2s"),
    {
      hover: borderColor(colors.borderPrimary)
        .transform("translateY(-2px)")
        .boxShadow(`0 18px 36px ${colors.primaryGlow}`)
    }
  ),
};

function routeHref(route: Route) {
  const base = import.meta.env.BASE_URL || "/";
  return route === "home" ? base : `${base}${route}`;
}

function scrollToSection(id: string) {
  const element = document.getElementById(id);
  if (!element) return;

  const headerOffset = 88;
  const offsetTop = element.getBoundingClientRect().top + window.scrollY - headerOffset;
  window.scrollTo({ top: offsetTop, behavior: "smooth" });
  activeSection = id;
  update();
}

function setupScrollTracking() {
  setTimeout(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    sectionObserver?.disconnect();

    sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        activeSection = visible.target.id;
        update();
      },
      {
        rootMargin: "-112px 0px -62%",
        threshold: [0, 0.2, 0.45],
      }
    );

    tocItems.forEach((item) => {
      const section = document.getElementById(item.id);
      if (section) {
        sectionObserver?.observe(section);
      }
    });
  }, 0);
}

function TocLink(item: TocItem, mobile = false) {
  const isActive = activeSection === item.id;

  return a(
    { href: `#${item.id}` },
    cn(
      display("inline-flex")
        .alignItems("center")
        .gap("8px")
        .padding(mobile ? "8px 12px" : "8px 12px")
        .borderRadius("6px")
        .fontSize("13px")
        .color(isActive ? colors.primary : colors.textMuted)
        .backgroundColor(isActive ? colors.primaryAlpha08 : "transparent")
        .fontWeight(isActive ? "600" : "400")
        .transition("all 0.2s")
        .whiteSpace("nowrap"),
      { hover: color(colors.primary).backgroundColor(colors.primaryAlpha08) }
    ),
    isActive
      ? span(
          cn(
            width("5px")
              .height("5px")
              .borderRadius("999px")
              .backgroundColor(colors.primary)
              .flexShrink("0")
          )
        )
      : null,
    item.label,
    on("click", (e) => {
      e.preventDefault();
      scrollToSection(item.id);
    })
  );
}

function DocsBreadcrumb() {
  return div(
    gs.breadcrumb,
    a(
      { href: routeHref("home") },
      cn(color(colors.textDim).transition("color 0.2s")),
      { hover: color(colors.textMuted) },
      "Docs",
      on("click", (e) => {
        e.preventDefault();
        setRoute("home");
      })
    ),
    span(cn(color(colors.border)), "›"),
    span(cn(color(colors.primary).fontWeight("600")), "Getting Started")
  );
}

function DocsHero() {
  return section(
    gs.hero,
    DocsBreadcrumb(),
    div(
      gs.heroMeta,
      span(
        gs.heroBadge,
        span(
          cn(
            width("6px")
              .height("6px")
              .borderRadius("999px")
              .backgroundColor(colors.primary)
          )
        ),
        "Quick Start"
      ),
      span(cn(fontSize("13px").color(colors.textDim)), "~5 min read")
    ),
    h1(gs.heroTitle, "Getting Started"),
    p(
      gs.heroSubtitle,
      "Install Nuclo, wire up TypeScript, and build your first imperative UI with explicit update() calls."
    ),
    div(
      gs.heroFooter,
      span(cn(color(colors.textDim)), "Last updated: March 2026"),
      span(cn(color(colors.border)), "·"),
      a(
        {
          href: "https://github.com/dan2dev/nuclo/blob/main/docs-source/src/pages/GettingStarted.ts",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        cn(color(colors.primary).transition("opacity 0.2s")),
        { hover: opacity("0.72") },
        "View source on GitHub ↗"
      )
    )
  );
}

function SectionHeader(index: string, title: string, description: string) {
  return div(
    gs.sectionIntro,
    span(gs.sectionIndex, index),
    h2(gs.sectionTitle, title),
    p(gs.sectionDescription, description)
  );
}

function StepCard(step: number, title: string, ...content: unknown[]) {
  return article(
    gs.card,
    div(
      gs.cardHeader,
      span(gs.stepBadge, String(step)),
      h3(gs.cardTitle, title)
    ),
    div(gs.cardBody, ...(content as HTMLElement[]))
  );
}

function Bullet(...content: unknown[]) {
  return div(
    gs.bulletItem,
    span(gs.bulletDot),
    p(gs.bodyText, ...(content as HTMLElement[]))
  );
}

function Callout(tone: CalloutTone, icon: string, ...content: unknown[]) {
  const tones = {
    info: {
      background: "rgba(59, 95, 204, 0.10)",
      border: "rgba(59, 95, 204, 0.24)",
      iconBackground: "#3B5FCC",
      iconColor: "#FFFFFF",
      textColor: "#C7D7FF",
    },
    success: {
      background: colors.primaryAlpha08,
      border: colors.borderPrimary,
      iconBackground: colors.primary,
      iconColor: colors.primaryText,
      textColor: colors.primary,
    },
  } satisfies Record<CalloutTone, {
    background: string;
    border: string;
    iconBackground: string;
    iconColor: string;
    textColor: string;
  }>;

  const cfg = tones[tone];

  return div(
    cn(
      display("flex")
        .alignItems("flex-start")
        .gap("10px")
        .padding("14px 16px")
        .borderRadius("10px")
    ),
    {
      style: {
        backgroundColor: cfg.background,
        border: `1px solid ${cfg.border}`,
      },
    },
    span(
      cn(
        display("inline-flex")
          .alignItems("center")
          .justifyContent("center")
          .width("20px")
          .height("20px")
          .borderRadius("999px")
          .fontSize("11px")
          .fontWeight("700")
          .flexShrink("0")
      ),
      {
        style: {
          backgroundColor: cfg.iconBackground,
          color: cfg.iconColor,
        },
      },
      icon
    ),
    p(
      cn(fontSize("13px").lineHeight("1.55")),
      { style: { color: cfg.textColor } },
      ...(content as HTMLElement[])
    )
  );
}

function CompactSnippetCard(title: string, code: string, description: string) {
  return div(
    gs.compactCard,
    h3(gs.cardTitle, title),
    CodeBlock(code, "typescript", {
      compact: true,
      showCopy: false,
    }),
    p(cn(fontSize("13px").lineHeight("1.55").color(colors.textDim)), description)
  );
}

function RouteCard(
  route: Route,
  icon: string,
  iconBackground: string,
  iconColor: string,
  title: string,
  description: string
) {
  return a(
    { href: routeHref(route) },
    gs.nextCard,
    div(
      cn(display("flex").alignItems("center").justifyContent("space-between").gap("12px")),
      span(
        cn(
          display("inline-flex")
            .alignItems("center")
            .justifyContent("center")
            .width("36px")
            .height("36px")
            .borderRadius("10px")
            .fontSize("13px")
            .fontWeight("700")
            .flexShrink("0")
        ),
        {
          style: {
            backgroundColor: iconBackground,
            color: iconColor,
          },
        },
        icon
      ),
      span(cn(color(colors.border)), ArrowRightIcon())
    ),
    h3(cn(fontSize("16px").fontWeight("600").color(colors.text)), title),
    p(cn(fontSize("13px").lineHeight("1.55").color(colors.textDim)), description),
    on("click", (e) => {
      e.preventDefault();
      setRoute(route);
    })
  );
}

function Sidebar() {
  return aside(
    gs.sidebar,
    div(
      gs.sidebarSticky,
      span(
        cn(
          fontSize("11px")
            .fontWeight("700")
            .letterSpacing("0.12em")
            .textTransform("uppercase")
            .color(colors.textDim)
            .marginBottom("8px")
        ),
        "On this page"
      ),
      ...tocItems.map((item) => TocLink(item))
    )
  );
}

function MobileToc() {
  return div(gs.mobileToc, ...tocItems.map((item) => TocLink(item, true)));
}

export function GettingStartedPage() {
  activeSection = tocItems[0].id;
  setupScrollTracking();

  return div(
    gs.page,
    DocsHero(),
    MobileToc(),
    div(
      gs.contentArea,
      Sidebar(),
      main(
        gs.main,
        section(
          { id: "installation" },
          gs.section,
          SectionHeader("01", "Installation", "Get up and running with Nuclo in three steps."),
          StepCard(
            1,
            "Install via npm",
            CodeBlock(gettingStartedCode.installNpm.code, gettingStartedCode.installNpm.lang, {
              label: "bash",
            })
          ),
          StepCard(
            2,
            "Enable TypeScript types",
            p(gs.bodyText, "Add Nuclo's built-in types for all 140+ tag builders:"),
            CodeBlock(gettingStartedCode.tsconfigTypes.code, gettingStartedCode.tsconfigTypes.lang, {
              label: "tsconfig.json",
            }),
            Callout(
              "success",
              "✓",
              "Or use a per-file reference: ",
              InlineCode(gettingStartedCode.typesReference.code)
            )
          ),
          StepCard(
            3,
            "Import and use",
            p(gs.bodyText, "One import registers all global builders — no destructuring needed:"),
            CodeBlock(gettingStartedCode.denoUsage.code, gettingStartedCode.denoUsage.lang, {
              label: "typescript",
            })
          ),
          Callout(
            "info",
            "i",
            "Deno? Import directly: ",
            InlineCode("import 'npm:nuclo'"),
            " or pin it via ",
            InlineCode("deno.json"),
            " imports."
          )
        ),

        section(
          { id: "first-app" },
          gs.section,
          SectionHeader(
            "02",
            "Your First App",
            "A counter that demonstrates state, events, and explicit update()."
          ),
          p(
            gs.bodyTextLarge,
            "Mutate plain JavaScript variables, then call ",
            InlineCode("update()"),
            " once to sync all dynamic bindings:"
          ),
          CodeBlock(gettingStartedCode.firstApp.code, gettingStartedCode.firstApp.lang, {
            label: "counter.ts",
          }),
          div(
            cn(display("flex").flexDirection("column").gap("8px")),
            h3(cn(fontSize("18px").fontWeight("600").color(colors.text)), "How it works"),
            div(
              gs.bulletList,
              Bullet(
                InlineCode("import 'nuclo'"),
                " registers all 140+ global tag builders — no destructuring, no tree-shaking concerns."
              ),
              Bullet("State is just plain JS variables — no hooks, proxies, or stores needed."),
              Bullet(
                InlineCode("() => value"),
                " zero-arg functions become dynamic bindings, re-evaluated on every ",
                InlineCode("update()"),
                "."
              ),
              Bullet(
                InlineCode("on(event, handler)"),
                " attaches DOM listeners and returns a modifier any tag builder accepts."
              ),
              Bullet(
                InlineCode("render(element, container)"),
                " mounts once — all subsequent updates run through ",
                InlineCode("update()"),
                "."
              )
            )
          )
        ),

        section(
          { id: "update" },
          gs.section,
          SectionHeader(
            "03",
            "Understanding update()",
            "The heartbeat of every Nuclo app. Mutate state freely, call it once, and every dynamic binding re-runs."
          ),
          h3(cn(fontSize("18px").fontWeight("600").color(colors.text)), "Batching multiple mutations"),
          CodeBlock(gettingStartedCode.batchUpdates.code, gettingStartedCode.batchUpdates.lang, {
            label: "typescript",
          }),
          h3(cn(fontSize("18px").fontWeight("600").color(colors.text)), "Why explicit updates?"),
          div(
            gs.whyGrid,
            div(
              gs.whyCard,
              h4(cn(fontSize("14px").fontWeight("600").color(colors.text)), "Performance"),
              p(cn(fontSize("13px").lineHeight("1.55").color(colors.textDim)), "Batch many mutations into one DOM pass.")
            ),
            div(
              gs.whyCard,
              h4(cn(fontSize("14px").fontWeight("600").color(colors.text)), "Control"),
              p(cn(fontSize("13px").lineHeight("1.55").color(colors.textDim)), "You decide exactly when the UI updates.")
            ),
            div(
              gs.whyCard,
              h4(cn(fontSize("14px").fontWeight("600").color(colors.text)), "Debuggable"),
              p(cn(fontSize("13px").lineHeight("1.55").color(colors.textDim)), "Set a breakpoint on update() to trace every change.")
            ),
            div(
              gs.whyCard,
              h4(cn(fontSize("14px").fontWeight("600").color(colors.text)), "Predictable"),
              p(cn(fontSize("13px").lineHeight("1.55").color(colors.textDim)), "No hidden re-renders, watchers, or dependency tracking.")
            )
          )
        ),

        section(
          { id: "dynamic" },
          gs.section,
          SectionHeader(
            "04",
            "Dynamic Functions",
            "Any zero-arg function passed as a child or attribute becomes a live binding that re-evaluates on update()."
          ),
          div(
            gs.compactGrid,
            CompactSnippetCard(
              "Text content",
              gettingStartedCode.dynamicText.code,
              "The arrow function re-runs when you call update()."
            ),
            CompactSnippetCard(
              "Attributes",
              gettingStartedCode.dynamicAttributes.code,
              "Any attribute value can be a function."
            ),
            CompactSnippetCard(
              "Style properties",
              gettingStartedCode.dynamicStyleProperties.code,
              "Individual style properties bind independently."
            )
          )
        ),

        section(
          { id: "events" },
          gs.section,
          SectionHeader(
            "05",
            "Event Handling",
            "The on() helper returns a modifier accepted by any tag builder, keeping your event logic co-located with the element."
          ),
          p(gs.bodyTextLarge, "Attach a single listener:"),
          CodeBlock(gettingStartedCode.eventBasic.code, gettingStartedCode.eventBasic.lang, {
            label: "typescript",
          }),
          p(gs.bodyTextLarge, "Stack multiple listeners on one element:"),
          CodeBlock(gettingStartedCode.eventMultiple.code, gettingStartedCode.eventMultiple.lang, {
            label: "typescript",
          }),
          Callout(
            "success",
            "✓",
            "You can also pass standard ",
            InlineCode("addEventListener"),
            " options as a third argument: ",
            InlineCode("on('click', handler, { once: true })"),
            "."
          )
        ),

        section(
          { id: "next-steps" },
          gs.section,
          div(gs.divider),
          SectionHeader(
            "06",
            "What's Next?",
            "You've got the essentials — explore what makes Nuclo powerful on larger projects."
          ),
          div(
            gs.nextGrid,
            RouteCard(
              "core-api",
              "{ }",
              "rgba(74, 122, 0, 0.12)",
              colors.primary,
              "API Reference",
              "All 140+ tag builders, modifiers, and the render() function."
            ),
            RouteCard(
              "examples",
              "▶",
              "rgba(224, 122, 0, 0.12)",
              "#E07A00",
              "Examples",
              "Todo, routing, async data fetching, and more real-world patterns."
            ),
            RouteCard(
              "styling",
              "✦",
              "rgba(68, 85, 204, 0.12)",
              "#4455CC",
              "Styling Guide",
              "CSS-in-JS, class utilities, theming, and dynamic style patterns."
            )
          )
        )
      )
    )
  );
}
