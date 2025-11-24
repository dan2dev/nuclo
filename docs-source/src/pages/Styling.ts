import "nuclo";
import { s } from "../styles.ts";
import { CodeBlock, InlineCode } from "../components/CodeBlock.ts";
import { stylingCode } from "../content/styling.ts";

export function StylingPage() {
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
    CodeBlock(stylingCode.overviewQuickExample.code, stylingCode.overviewQuickExample.lang),

    // StyleBuilder
    h2(s.h2, "StyleBuilder"),
    p(
      s.p,
      "Each helper returns a StyleBuilder instance. You can chain helpers, pull out the generated class name, or read the computed styles."
    ),
    h3(s.h3, "How it works"),
    CodeBlock(stylingCode.styleBuilderUsage.code, stylingCode.styleBuilderUsage.lang),
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
    CodeBlock(stylingCode.styleHelpersBasic.code, stylingCode.styleHelpersBasic.lang),
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
    CodeBlock(stylingCode.styleQueriesDefaults.code, stylingCode.styleQueriesDefaults.lang),
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

    // Typography
    h2(s.h2, "Typography"),
    p(s.p, "Font and text styling helpers."),
    h3(s.h3, "Font properties"),
    CodeBlock(stylingCode.typographyFont.code, stylingCode.typographyFont.lang),
    h3(s.h3, "Text styling"),
    CodeBlock(stylingCode.typographyText.code, stylingCode.typographyText.lang),
    h3(s.h3, "Typography system example"),
    CodeBlock(stylingCode.typographySystem.code, stylingCode.typographySystem.lang),

    // Colors
    h2(s.h2, "Colors & Backgrounds"),
    h3(s.h3, "Colors"),
    CodeBlock(stylingCode.colorsBasic.code, stylingCode.colorsBasic.lang),
    h3(s.h3, "Gradients"),
    CodeBlock(stylingCode.colorsGradients.code, stylingCode.colorsGradients.lang),
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
    CodeBlock(stylingCode.flexNavbarExample.code, stylingCode.flexNavbarExample.lang),

    // Grid
    h2(s.h2, "CSS Grid"),
    h3(s.h3, "Container helpers"),
    CodeBlock(stylingCode.gridContainer.code, stylingCode.gridContainer.lang),
    h3(s.h3, "Item helpers"),
    CodeBlock(stylingCode.gridItem.code, stylingCode.gridItem.lang),
    h3(s.h3, "Responsive card grid"),
    CodeBlock(stylingCode.gridResponsiveExample.code, stylingCode.gridResponsiveExample.lang),

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
    h3(s.h3, "Hover effects with reactive styles"),
    CodeBlock(stylingCode.effectsHover.code, stylingCode.effectsHover.lang),

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
    CodeBlock(stylingCode.organizingUsage.code, stylingCode.organizingUsage.lang),

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
