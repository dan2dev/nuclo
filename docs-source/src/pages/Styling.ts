import "nuclo";
import { cn, colors } from "../styles.ts";
import { DocsHero, DocsPageFrame, DocsSectionHeader, type DocsTocItem } from "../components/DocsPage.ts";
import { CodeBlock } from "../components/CodeBlock.ts";
import { ArrowRightIcon } from "../components/icons.ts";
import { stylingCode } from "../content/styling.ts";
import { setRoute, type Route } from "../router.ts";

const tocItems: DocsTocItem[] = [
  { id: "overview", label: "Overview" },
  { id: "create-style-queries", label: "createStyleQueries()" },
  { id: "style-builder", label: "StyleBuilder" },
  { id: "style-helpers", label: "Style Helpers" },
  { id: "responsive", label: "Responsive" },
  { id: "pseudo-classes", label: "Pseudo-classes" },
];

const st = {
  sectionCard: cn(
    display("flex")
      .flexDirection("column")
      .gap("20px")
      .padding("28px 24px")
      .backgroundColor(colors.bgCard)
      .border(`1px solid ${colors.border}`)
      .borderRadius("12px"),
    { medium: padding("28px 32px") }
  ),

  split: cn(
    display("grid")
      .gap("0")
      .border(`1px solid ${colors.border}`)
      .borderRadius("12px")
      .overflow("hidden"),
    { large: gridTemplateColumns("minmax(0, 1fr) 320px") }
  ),

  previewPanel: cn(
    display("flex")
      .flexDirection("column")
      .justifyContent("center")
      .gap("16px")
      .padding("28px 24px")
      .backgroundColor(colors.bgSecondary)
      .borderTop(`1px solid ${colors.border}`),
    { large: borderTop("none").borderLeft(`1px solid ${colors.border}`) }
  ),

  previewLabel: cn(
    fontSize("11px")
      .fontWeight("600")
      .letterSpacing("0.08em")
      .textTransform("uppercase")
      .color(colors.textDim)
  ),

  previewButton: cn(
    display("inline-flex")
      .alignItems("center")
      .justifyContent("center")
      .padding("12px 24px")
      .borderRadius("8px")
      .backgroundColor("#3B82F6")
      .color("#FFFFFF")
      .fontSize("14px")
      .fontWeight("600")
      .cursor("pointer")
      .transition("transform 0.2s, opacity 0.2s"),
    { hover: opacity("0.92").transform("translateY(-1px)") }
  ),

  generatedClass: cn(
    fontSize("11px")
      .fontFamily("'JetBrains Mono', 'Courier New', monospace")
      .color(colors.textDim)
  ),

  signatureCard: cn(
    padding("18px 24px")
      .borderRadius("10px")
      .backgroundColor("#161B27")
      .border("1px solid #252A38")
      .fontFamily("'JetBrains Mono', 'Courier New', monospace")
      .fontSize("15px")
      .lineHeight("1.5")
      .color("#A8B4C8")
  ),

  chainDiagram: cn(
    display("flex")
      .alignItems("center")
      .gap("8px")
      .flexWrap("wrap")
      .padding("24px")
      .borderRadius("12px")
      .backgroundColor(colors.bgSecondary)
      .border(`1px solid ${colors.border}`)
  ),

  chainTokenPrimary: cn(
    fontFamily("'JetBrains Mono', 'Courier New', monospace")
      .fontSize("14px")
      .color(colors.primary)
  ),

  chainToken: cn(
    fontFamily("'JetBrains Mono', 'Courier New', monospace")
      .fontSize("14px")
      .color(colors.text)
  ),

  chainClass: cn(
    display("inline-flex")
      .alignItems("center")
      .padding("8px 16px")
      .borderRadius("6px")
      .backgroundColor(colors.primaryAlpha08)
      .fontFamily("'JetBrains Mono', 'Courier New', monospace")
      .fontSize("14px")
      .fontWeight("700")
      .color(colors.primary)
  ),

  helpersGrid: cn(
    display("grid").gap("16px"),
    { medium: gridTemplateColumns("repeat(2, minmax(0, 1fr))") }
  ),

  helperCard: cn(
    display("flex")
      .flexDirection("column")
      .gap("12px")
      .padding("20px")
      .backgroundColor(colors.bgCard)
      .border(`1px solid ${colors.border}`)
      .borderRadius("12px")
  ),

  helperTitle: cn(fontSize("13px").fontWeight("700").color(colors.text)),
  helperBody: cn(
    fontSize("12px")
      .lineHeight("1.8")
      .fontFamily("'JetBrains Mono', 'Courier New', monospace")
      .color(colors.primary)
  ),

  nextWrap: cn(display("flex").flexDirection("column").gap("20px").paddingTop("8px")),
  nextTitle: cn(fontSize("26px").fontWeight("700").letterSpacing("-0.02em").color(colors.text)),
  nextGrid: cn(
    display("grid").gap("16px"),
    { medium: gridTemplateColumns("repeat(2, minmax(0, 1fr))"), large: gridTemplateColumns("repeat(3, minmax(0, 1fr))") }
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

function SignatureCard(signature: string) {
  const [name, rest] = signature.split("(");
  return div(
    st.signatureCard,
    span(cn(color("#6DBF2F").fontWeight("700")), name),
    span("("),
    span(cn(color("#E8C77A")), rest ?? "")
  );
}

function OverviewSection() {
  return section(
    { id: "overview" },
    st.sectionCard,
    DocsSectionHeader(
      "01",
      "Overview",
      "Nuclo's styling system generates atomic CSS classes from TypeScript. Write styles as method chains, get a stable class name, and apply it like any other attribute."
    ),
    div(
      st.split,
      CodeBlock(stylingCode.overviewQuickExample.code, stylingCode.overviewQuickExample.lang, {
        label: "button-style.ts",
        variant: "docs",
      }),
      div(
        st.previewPanel,
        span(st.previewLabel, "Live preview"),
        button(st.previewButton, "Click me"),
        span(st.generatedClass, "→ Generated class: n3a7f2b1")
      )
    )
  );
}

function CreateStyleQueriesSection() {
  return section(
    { id: "create-style-queries" },
    st.sectionCard,
    DocsSectionHeader(
      "02",
      "createStyleQueries()",
      "Creates a style factory bound to a set of named breakpoints. Returns a cn() function you call with one or more StyleBuilder expressions.",
      true
    ),
    SignatureCard("createStyleQueries(breakpoints): CnFn"),
    CodeBlock(stylingCode.styleQueriesSetup.code, stylingCode.styleQueriesSetup.lang, {
      label: "setup.ts",
      variant: "docs",
    })
  );
}

function StyleBuilderSection() {
  return section(
    { id: "style-builder" },
    st.sectionCard,
    DocsSectionHeader(
      "03",
      "StyleBuilder",
      "All style helpers return a StyleBuilder. Every method adds a CSS property and returns the same builder, so you can chain freely. Call cn() to get a stable class name."
    ),
    div(
      st.chainDiagram,
      span(st.chainTokenPrimary, "bg('white')"),
      span(st.chainToken, ".padding('1rem')"),
      span(st.chainToken, ".borderRadius('8px')"),
      span(st.chainToken, ".fontWeight('600')"),
      span(cn(color(colors.border).fontSize("18px").padding("0 8px")), "→"),
      span(st.chainClass, "n3a7f2b1")
    ),
    CodeBlock(stylingCode.styleBuilderUsage.code, stylingCode.styleBuilderUsage.lang, {
      label: "card.ts",
      variant: "docs",
    })
  );
}

function StyleHelpersSection() {
  return section(
    { id: "style-helpers" },
    st.sectionCard,
    DocsSectionHeader(
      "04",
      "Style Helpers",
      "Over 80 helper functions covering every common CSS property. Each one returns a StyleBuilder, so you can start a chain from any helper."
    ),
    div(
      st.helpersGrid,
      div(
        st.helperCard,
        h3(st.helperTitle, "Layout & Spacing"),
        p(st.helperBody, "display · position · width · height · margin · padding · gap · zIndex · overflow · boxSizing")
      ),
      div(
        st.helperCard,
        h3(st.helperTitle, "Typography"),
        p(st.helperBody, "fontSize · fontWeight · fontFamily · lineHeight · letterSpacing · textAlign · textTransform · textDecoration")
      ),
      div(
        st.helperCard,
        h3(st.helperTitle, "Visual"),
        p(st.helperBody, "bg · color · border · borderRadius · boxShadow · opacity · outline · backgroundImage · gradient")
      ),
      div(
        st.helperCard,
        h3(st.helperTitle, "Interaction"),
        p(st.helperBody, "cursor · pointerEvents · userSelect · transition · transform · animation · willChange")
      )
    )
  );
}

function ResponsiveSection() {
  return section(
    { id: "responsive" },
    st.sectionCard,
    DocsSectionHeader(
      "05",
      "Responsive",
      "Pass a second argument object to cn() with breakpoint keys matching those you declared in createStyleQueries(). Styles merge at each breakpoint."
    ),
    CodeBlock(stylingCode.styleQueriesDefaults.code, stylingCode.styleQueriesDefaults.lang, {
      label: "grid.ts",
      variant: "docs",
    })
  );
}

function PseudoClassesSection() {
  return section(
    { id: "pseudo-classes" },
    st.sectionCard,
    DocsSectionHeader(
      "06",
      "Pseudo-classes",
      "Use the same breakpoint object to apply styles on hover, focus, active, and other pseudo-states. The keys can be any valid CSS pseudo-class or selector."
    ),
    CodeBlock(stylingCode.styleQueriesPseudoClasses.code, stylingCode.styleQueriesPseudoClasses.lang, {
      label: "interactive-card.ts",
      variant: "docs",
    })
  );
}

function NextCard(route: Route, title: string, description: string) {
  return a(
    { href: route === "home" ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}${route}` },
    st.nextCard,
    div(
      cn(display("flex").alignItems("center").justifyContent("space-between").gap("12px")),
      h3(cn(fontSize("16px").fontWeight("600").color(colors.text)), title),
      span(cn(color(colors.border)), ArrowRightIcon())
    ),
    p(cn(fontSize("13px").lineHeight("1.55").color(colors.textDim)), description),
    on("click", (e) => {
      e.preventDefault();
      setRoute(route);
    })
  );
}

export function StylingPage() {
  return DocsPageFrame({
    hero: DocsHero({
      badge: "Styling",
      breadcrumb: "Styling",
      title: "Styling System",
      subtitle: "Build fully-typed CSS from TypeScript using composable helper functions, the StyleBuilder chain, responsive breakpoints, and pseudo-class support.",
      meta: "~10 min read",
      updated: "Last updated: March 2026",
      sourceHref: "https://github.com/dan2dev/nuclo/blob/main/docs-source/src/pages/Styling.ts",
    }),
    tocItems,
    children: [
      OverviewSection(),
      CreateStyleQueriesSection(),
      StyleBuilderSection(),
      StyleHelpersSection(),
      ResponsiveSection(),
      PseudoClassesSection(),
      div(
        st.nextWrap,
        h2(st.nextTitle, "What to explore next"),
        div(
          st.nextGrid,
          NextCard("getting-started", "Getting Started", "Return to the first-page walkthrough and install Nuclo from scratch."),
          NextCard("core-api", "Core API", "Pair the styling helpers with update(), when(), and list()."),
          NextCard("examples", "Examples", "See responsive and animated styles inside runnable demos.")
        )
      ),
    ],
  });
}
