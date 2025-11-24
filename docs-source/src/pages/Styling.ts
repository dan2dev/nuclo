import "nuclo";
import { cn, s, colors } from "../styles.ts";
import { CodeBlock, InlineCode } from "../components/CodeBlock.ts";
import { stylingCode } from "../content/styling.ts";

export function StylingPage() {
  // Live demo: Overview quick example
  function OverviewDemo() {
    const btn = cn(
      backgroundColor(colors.primary)
        .color(colors.bg)
        .padding("12px 20px")
        .border("none")
        .borderRadius("10px")
        .fontWeight("700")
        .cursor("pointer")
        .transition("all 0.2s"),
      {
        hover: backgroundColor(colors.primaryHover).transform("translateY(-2px)").boxShadow(`0 0 24px ${colors.primaryGlow}`)
      }
    );
    return div(
      s.demoPanel,
      div(s.demoPanelHeader, "Live: Overview button"),
      div(
        s.demoPanelContent,
        button(
          btn,
          { style: s.btnPrimaryStyle },
          "Click me"
        )
      )
    );
  }

  // Live demo: StyleBuilder chaining and class reuse
  function StyleBuilderDemo() {
    let rounded = true;
    const base = backgroundColor(colors.bgCard)
      .color(colors.text)
      .padding("20px")
      .transition("all 0.2s");

    function cardStyle() {
      const styled = base
        .borderRadius(rounded ? "14px" : "0px")
        .boxShadow(rounded ? "0 10px 30px rgba(0,0,0,0.25)" : "none")
        .border(`1px solid ${colors.border}`);
      return cn(styled);
    }

    return div(
      s.demoPanel,
      div(s.demoPanelHeader, "Live: StyleBuilder chaining"),
      div(
        s.demoPanelContent,
        div(
          () => cardStyle(),
          h3(cn(fontSize("16px").fontWeight("700")), "Chained styles"),
          p(cn(color(colors.textMuted)), "Toggle props built via chained helpers."),
          div(
            cn(display("flex").gap("8px").marginTop("8px")),
            button(
              s.btnSecondary,
              rounded ? "Make Square" : "Make Rounded",
              on("click", () => {
                rounded = !rounded;
                update();
              })
            )
          )
        )
      )
    );
  }

  // Live demo: Style queries with simulated breakpoints
  function QueriesDemo() {
    type Bp = "mobile" | "medium" | "large";
    let bp: Bp = "mobile";
    const card = cn(
      backgroundColor(colors.bgCard)
        .border(`1px solid ${colors.border}`)
        .borderRadius("12px")
        .transition("all 0.2s"),
      {
        medium: padding("24px"),
        large: padding("32px")
      }
    );
    function maxWidthFor(bp: Bp) {
      return bp === "mobile" ? "100%" : bp === "medium" ? "420px" : "640px";
    }
    function sizeLabel(bp: Bp) {
      return bp === "mobile" ? "<480px" : bp === "medium" ? "≥768px" : "≥1024px";
    }
    return div(
      s.demoPanel,
      div(s.demoPanelHeader, "Live: Style queries"),
      div(
        s.demoPanelContent,
        div(
          cn(display("flex").gap("8px").marginBottom("12px").flexWrap("wrap")),
          button(
            s.btnSecondary,
            "Mobile",
            on("click", () => {
              bp = "mobile";
              update();
            })
          ),
          button(
            s.btnSecondary,
            "Medium",
            on("click", () => {
              bp = "medium";
              update();
            })
          ),
          button(
            s.btnSecondary,
            "Large",
            on("click", () => {
              bp = "large";
              update();
            })
          )
        ),
        div(
          cn(marginTop("4px")),
          div(
            () => card,
            { style: () => ({ maxWidth: maxWidthFor(bp), width: "100%", padding: bp === "mobile" ? "16px" : undefined, boxSizing: "border-box" as const }) },
            h3(cn(fontSize("16px").fontWeight("700")), () => `Breakpoint: ${sizeLabel(bp)}`),
            p(cn(color(colors.textMuted)), "Padding increases on medium and large breakpoints.")
          )
        )
      )
    );
  }

  // Live demo: Layout helpers
  function LayoutDemo() {
    let useGrid = false;
    const card = cn(
      backgroundColor(colors.bgLight)
        .border(`1px solid ${colors.border}`)
        .borderRadius("10px")
        .padding("12px")
    );
    function container() {
      return useGrid
        ? cn(display("grid").gap("12px"), { medium: gridTemplateColumns("repeat(3, 1fr)") })
        : cn(display("flex").gap("12px").flexWrap("wrap"));
    }
    return div(
      s.demoPanel,
      div(s.demoPanelHeader, "Live: Layout helpers"),
      div(
        s.demoPanelContent,
        button(
          s.btnSecondary,
          () => (useGrid ? "Use Flex" : "Use Grid"),
          on("click", () => {
            useGrid = !useGrid;
            update();
          })
        ),
        div(
          cn(marginTop("12px")),
          div(
            () => container(),
            ...[1, 2, 3, 4, 5, 6].map((i) => div(card, `Item ${i}`))
          )
        )
      )
    );
  }

  // Live demo: Style helpers basic usage (simple card)
  function StyleHelpersBasicDemo() {
    const card = cn(
      backgroundColor(colors.bgCard)
        .padding("24px")
        .borderRadius("12px")
        .boxShadow("0 4px 12px rgba(0,0,0,0.15)")
        .border(`1px solid ${colors.border}`)
    );
    return div(
      s.demoPanel,
      div(s.demoPanelHeader, "Live: Basic usage"),
      div(
        s.demoPanelContent,
        div(card, "Card content")
      )
    );
  }

  // Live demo: Typography
  function TypographyDemo() {
    const heading = cn(fontSize("28px").fontWeight("800").letterSpacing("-0.02em"));
    const sub = cn(color(colors.textMuted).fontSize("16px"));
    return div(
      s.demoPanel,
      div(s.demoPanelHeader, "Live: Typography"),
      div(
        s.demoPanelContent,
        h1(heading, "Elegant Heading"),
        p(sub, "Subtle body copy with readable line-height and contrast.")
      )
    );
  }

  // Live demo: Colors & Backgrounds
  function ColorsDemo() {
    const swatch = (bgCss: string, label: string) =>
      div(
        cn(display("flex").alignItems("center").gap("12px")),
        div(cn(width("36px").height("24px").borderRadius("6px").border(`1px solid ${colors.border}`)), { style: { background: bgCss } }),
        span(cn(color(colors.textMuted)), label)
      );
    return div(
      s.demoPanel,
      div(s.demoPanelHeader, "Live: Colors"),
      div(
        s.demoPanelContent,
        swatch(colors.primary, "Primary"),
        swatch("linear-gradient(135deg, #667eea 0%, #764ba2 100%)", "Gradient"),
        swatch(colors.bgLight, "Background")
      )
    );
  }

  // Live demo: Flexbox navbar
  function FlexboxDemo() {
    const bar = cn(
      display("flex")
        .justifyContent("space-between")
        .alignItems("center")
        .padding("12px 16px")
        .backgroundColor(colors.bgLight)
        .border(`1px solid ${colors.border}`)
        .borderRadius("10px")
    );
    const links = cn(display("flex").gap("12px").alignItems("center"));
    const link = cn(color(colors.textMuted).transition("color 0.2s"));
    return div(
      s.demoPanel,
      div(s.demoPanelHeader, "Live: Flexbox"),
      div(
        s.demoPanelContent,
        nav(
          bar,
          div(cn(fontWeight("700")), "Logo"),
          div(
            links,
            a(link, "Home", on("mouseenter", (e) => ((e.currentTarget as HTMLElement).style.color = colors.text)), on("mouseleave", (e) => ((e.currentTarget as HTMLElement).style.color = colors.textMuted))),
            a(link, "Docs", on("mouseenter", (e) => ((e.currentTarget as HTMLElement).style.color = colors.text)), on("mouseleave", (e) => ((e.currentTarget as HTMLElement).style.color = colors.textMuted))),
            a(link, "Contact", on("mouseenter", (e) => ((e.currentTarget as HTMLElement).style.color = colors.text)), on("mouseleave", (e) => ((e.currentTarget as HTMLElement).style.color = colors.textMuted)))
          )
        )
      )
    );
  }

  // Live demo: Grid cards
  function GridDemo() {
    const gridBox = cn(
      display("grid").gap("12px"),
      { medium: gridTemplateColumns("repeat(3, 1fr)") }
    );
    const card = cn(backgroundColor(colors.bgLight).border(`1px solid ${colors.border}`).borderRadius("10px").padding("12px"));
    return div(
      s.demoPanel,
      div(s.demoPanelHeader, "Live: Grid"),
      div(
        s.demoPanelContent,
        div(gridBox, ...Array.from({ length: 6 }, (_, i) => div(card, `Card ${i + 1}`)))
      )
    );
  }

  // Live demo: Effects & transitions
  function EffectsDemo() {
    const box = cn(
      backgroundColor(colors.bgLight)
        .border(`1px solid ${colors.border}`)
        .borderRadius("12px")
        .padding("24px")
        .transition("all 0.25s"),
      {
        hover: boxShadow("0 20px 50px rgba(0,0,0,0.35)").transform("translateY(-4px) scale(1.02)")
      }
    );
    return div(
      s.demoPanel,
      div(s.demoPanelHeader, "Live: Effects"),
      div(
        s.demoPanelContent,
        div(
          box,
          "Hover me"
        )
      )
    );
  }

  // Live demo: Organizing styles (theme buttons)
  function OrganizingDemo() {
    const card = cn(
      backgroundColor(colors.bgCard)
        .border(`1px solid ${colors.border}`)
        .borderRadius("14px")
        .padding("20px")
    );
    return div(
      s.demoPanel,
      div(s.demoPanelHeader, "Live: Organized styles"),
      div(
        s.demoPanelContent,
        div(card,
          h3(cn(fontSize("16px").fontWeight("700")), "Theme buttons"),
          div(
            cn(display("flex").gap("10px").marginTop("8px")),
            button(s.btnPrimary, { style: s.btnPrimaryStyle }, "Primary"),
            button(s.btnSecondary, "Secondary")
          )
        )
      )
    );
  }

  return div(
    s.pageContent,
    h1(s.pageTitle, "Styling"),
    p(
      s.pageSubtitle,
      "All of the original styling docs are here: chainable helpers, StyleBuilder utilities, responsive queries, and layout recipes."
    ),

    // Overview
    h2(s.h2, "Overview"),
    p(
      s.p,
      "Nuclo's styling system is powered by chainable helpers that generate CSS classes for you. Start with any helper (",
      InlineCode("bg()"),
      ", ",
      InlineCode("padding()"),
      ", etc.), chain more, and wrap with ",
      InlineCode("createStyleQueries"),
      " for responsive variants."
    ),
    p(s.p, "Quick example straight from the legacy site:"),
    div(
      s.demoContainerSingle,
      div(OverviewDemo()),
      div(CodeBlock(stylingCode.overviewQuickExample.code, stylingCode.overviewQuickExample.lang, true))
    ),

    // StyleBuilder
    h2(s.h2, "StyleBuilder"),
    p(
      s.p,
      "Each helper returns a StyleBuilder instance. You can chain helpers, pull out the generated class name, or read the computed styles."
    ),
    h3(s.h3, "How it works"),
    div(
      s.demoContainerSingle,
      div(StyleBuilderDemo()),
      div(CodeBlock(stylingCode.styleBuilderUsage.code, stylingCode.styleBuilderUsage.lang, true))
    ),
    h3(s.h3, "StyleBuilder methods"),
    CodeBlock(stylingCode.styleBuilderMethods.code, stylingCode.styleBuilderMethods.lang),
    h3(s.h3, "Generated CSS"),
    CodeBlock(stylingCode.styleBuilderClass.code, stylingCode.styleBuilderClass.lang),

    // Style helpers
    h2(s.h2, "Style Helpers"),
    p(
      s.p,
      "95+ helpers mirror CSS properties: layout, spacing, typography, color, flexbox, grid, effects, and more. Chain them to build up reusable class names."
    ),
    h3(s.h3, "Basic usage"),
    div(
      s.demoContainerSingle,
      div(StyleHelpersBasicDemo()),
      div(CodeBlock(stylingCode.styleHelpersBasic.code, stylingCode.styleHelpersBasic.lang, true))
    ),
    h3(s.h3, "Available helpers (from the original reference)"),
    CodeBlock(stylingCode.styleHelpersList.code, stylingCode.styleHelpersList.lang),
    h3(s.h3, "Shorthand helpers"),
    CodeBlock(stylingCode.styleHelpersShorthand.code, stylingCode.styleHelpersShorthand.lang),

    // Style queries
    h2(s.h2, "Style Queries"),
    p(
      s.p,
      "Use ",
      InlineCode("createStyleQueries"),
      " to add media, container, or feature queries. Defaults can be merged with breakpoint overrides."
    ),
    CodeBlock(stylingCode.styleQueriesSetup.code, stylingCode.styleQueriesSetup.lang),
    h3(s.h3, "Defaults and overrides"),
    div(
      s.demoContainerSingle,
      div(QueriesDemo()),
      div(CodeBlock(stylingCode.styleQueriesDefaults.code, stylingCode.styleQueriesDefaults.lang, true))
    ),
    h3(s.h3, "Generated CSS output"),
    CodeBlock(stylingCode.styleQueriesGeneratedCss.code, stylingCode.styleQueriesGeneratedCss.lang, false),
    h3(s.h3, "Query-only styles"),
    CodeBlock(stylingCode.styleQueriesQueriesOnly.code, stylingCode.styleQueriesQueriesOnly.lang),
    h3(s.h3, "Container queries"),
    CodeBlock(stylingCode.styleQueriesContainer.code, stylingCode.styleQueriesContainer.lang),
    h3(s.h3, "Feature queries"),
    CodeBlock(stylingCode.styleQueriesFeature.code, stylingCode.styleQueriesFeature.lang),
    h3(s.h3, "Viewport breakpoints example"),
    CodeBlock(stylingCode.styleQueriesExamples.code, stylingCode.styleQueriesExamples.lang),

    // Layout
    h2(s.h2, "Layout"),
    p(s.p, "Display, positioning, sizing, spacing, and overflow helpers pulled from the original docs."),
    h3(s.h3, "Display & position"),
    CodeBlock(stylingCode.layoutDisplayPosition.code, stylingCode.layoutDisplayPosition.lang),
    h3(s.h3, "Sizing"),
    CodeBlock(stylingCode.layoutSizing.code, stylingCode.layoutSizing.lang),
    h3(s.h3, "Spacing"),
    CodeBlock(stylingCode.layoutSpacing.code, stylingCode.layoutSpacing.lang),
    h3(s.h3, "Overflow"),
    CodeBlock(stylingCode.layoutOverflow.code, stylingCode.layoutOverflow.lang),
    div(
      s.demoContainer,
      div(LayoutDemo())
    ),

    // Typography
    h2(s.h2, "Typography"),
    p(s.p, "Font and text styling helpers."),
    h3(s.h3, "Font properties"),
    CodeBlock(stylingCode.typographyFont.code, stylingCode.typographyFont.lang),
    h3(s.h3, "Text styling"),
    CodeBlock(stylingCode.typographyText.code, stylingCode.typographyText.lang),
    h3(s.h3, "Typography system example"),
    div(
      s.demoContainer,
      div(TypographyDemo()),
      div(CodeBlock(stylingCode.typographySystem.code, stylingCode.typographySystem.lang, true))
    ),

    // Colors
    h2(s.h2, "Colors & Backgrounds"),
    h3(s.h3, "Colors"),
    CodeBlock(stylingCode.colorsBasic.code, stylingCode.colorsBasic.lang),
    h3(s.h3, "Gradients"),
    div(
      s.demoContainerSingle,
      div(ColorsDemo()),
      div(CodeBlock(stylingCode.colorsGradients.code, stylingCode.colorsGradients.lang, true))
    ),
    h3(s.h3, "Background properties"),
    CodeBlock(stylingCode.colorsBackground.code, stylingCode.colorsBackground.lang),

    // Flexbox
    h2(s.h2, "Flexbox"),
    p(s.p, "Container and item helpers, plus an example navbar layout."),
    h3(s.h3, "Container helpers"),
    CodeBlock(stylingCode.flexContainer.code, stylingCode.flexContainer.lang),
    h3(s.h3, "Item helpers"),
    CodeBlock(stylingCode.flexItem.code, stylingCode.flexItem.lang),
    h3(s.h3, "Navbar example"),
    div(
      s.demoContainer,
      div(FlexboxDemo()),
      div(CodeBlock(stylingCode.flexNavbarExample.code, stylingCode.flexNavbarExample.lang, true))
    ),

    // Grid
    h2(s.h2, "CSS Grid"),
    h3(s.h3, "Container helpers"),
    CodeBlock(stylingCode.gridContainer.code, stylingCode.gridContainer.lang),
    h3(s.h3, "Item helpers"),
    CodeBlock(stylingCode.gridItem.code, stylingCode.gridItem.lang),
    h3(s.h3, "Responsive card grid"),
    div(
      s.demoContainerSingle,
      div(GridDemo()),
      div(CodeBlock(stylingCode.gridResponsiveExample.code, stylingCode.gridResponsiveExample.lang, true))
    ),

    // Effects
    h2(s.h2, "Effects & Transitions"),
    p(s.p, "Shadows, opacity, transitions, transforms, filters, and hover-friendly reactive styles."),
    h3(s.h3, "Box shadows"),
    CodeBlock(stylingCode.effectsShadows.code, stylingCode.effectsShadows.lang),
    h3(s.h3, "Visibility"),
    CodeBlock(stylingCode.effectsVisibility.code, stylingCode.effectsVisibility.lang),
    h3(s.h3, "Transitions"),
    CodeBlock(stylingCode.effectsTransitions.code, stylingCode.effectsTransitions.lang),
    h3(s.h3, "Transforms"),
    CodeBlock(stylingCode.effectsTransforms.code, stylingCode.effectsTransforms.lang),
    h3(s.h3, "Filters & backdrop"),
    CodeBlock(stylingCode.effectsFilters.code, stylingCode.effectsFilters.lang),
    h3(s.h3, "Hover effects with pseudo-classes"),
    p(s.p, "Use the built-in pseudo-class support for hover, focus, active, and more:"),
    CodeBlock(stylingCode.styleQueriesPseudoClasses.code, stylingCode.styleQueriesPseudoClasses.lang),
    h3(s.h3, "Hover effects with reactive styles (alternative)"),
    div(
      s.demoContainerSingle,
      div(EffectsDemo()),
      div(CodeBlock(stylingCode.effectsHover.code, stylingCode.effectsHover.lang, true))
    ),

    // Organizing
    h2(s.h2, "Organizing Styles"),
    p(
      s.p,
      "Reuse the theme + style modules from the legacy page: keep tokens, shared layout pieces, and component styles in one place."
    ),
    h3(s.h3, "Theme constants"),
    CodeBlock(stylingCode.organizingTheme.code, stylingCode.organizingTheme.lang),
    h3(s.h3, "Shared styles"),
    CodeBlock(stylingCode.organizingStyles.code, stylingCode.organizingStyles.lang),
    h3(s.h3, "Using the styles"),
    div(
      s.demoContainerSingle,
      div(OrganizingDemo()),
      div(CodeBlock(stylingCode.organizingUsage.code, stylingCode.organizingUsage.lang, true))
    ),

    // Next steps
    h2(s.h2, "Next Steps"),
    ul(
      s.ul,
      li(
        s.li,
        "Explore ",
        InlineCode("CodeBlock"),
        " + ",
        InlineCode("InlineCode"),
        " components to present snippets cleanly."
      ),
      li(
        s.li,
        "Combine ",
        InlineCode("createStyleQueries"),
        " with the helpers above for responsive variants."
      ),
      li(
        s.li,
        "Jump to the ",
        a({ href: "#examples" }, "Examples page"),
        " to see these styles in action."
      )
    )
  );
}
