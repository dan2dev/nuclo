import "nuclo";
import { cn, s } from "../styles.ts";
import { CodeBlock, InlineCode } from "../components/CodeBlock.ts";
import { apiCode } from "../content/api.ts";

export function TagBuildersPage() {
  const htmlTagLists = [
    { title: "Document Structure", tags: "html, head, body, header, footer, main, section, article, aside, nav" },
    { title: "Content Sectioning", tags: "h1, h2, h3, h4, h5, h6, div, span, p, blockquote, pre, code" },
    { title: "Lists", tags: "ul, ol, li, dl, dt, dd" },
    { title: "Forms", tags: "form, input, textarea, button, select, option, label, fieldset, legend" },
    { title: "Tables", tags: "table, thead, tbody, tfoot, tr, th, td, caption, col, colgroup" },
    { title: "Media", tags: "img, video, audio, source, track, canvas, svg" },
    { title: "Interactive", tags: "a, button, details, summary, dialog" },
    { title: "Text Formatting", tags: "strong, em, mark, small, del, ins, sub, sup, abbr, cite, q, kbd, samp, var" },
  ];

  return div(
    s.pageContent,
    h1(s.pageTitle, "Tag Builders"),
    p(
      s.pageSubtitle,
      "Every HTML and SVG element is available globally after importing Nuclo. Build your UI with simple function calls."
    ),

    // Overview
    h2(s.h2, { id: "overview" }, "Overview"),
    p(
      s.p,
      "Tag builders accept children, attributes, event modifiers, and arrays. After ",
      InlineCode("import 'nuclo'"),
      ", all builders are available globally."
    ),
    CodeBlock(apiCode.tagBuilderBasic.code, apiCode.tagBuilderBasic.lang),

    // HTML Tags
    h2(s.h2, { id: "html-tags" }, "HTML Tags"),
    p(s.p, "Full HTML5 coverage with 140+ elements:"),
    ...htmlTagLists.map((group) =>
      div(
        h3(cn(fontSize("18px").fontWeight("600").marginTop("24px").marginBottom("12px")), group.title),
        pre(s.codeBlock, code(group.tags))
      )
    ),
    p(
      s.p,
      cn(marginTop("24px")),
      "And 100+ more—see ",
      a(
        {
          href: "https://github.com/dan2dev/nuclo/blob/main/packages/nuclo/src/core/tagRegistry.ts",
          target: "_blank",
          rel: "noopener noreferrer"
        },
        InlineCode("the full registry")
      ),
      "."
    ),

    // SVG Tags
    h2(s.h2, { id: "svg-tags" }, "SVG Tags"),
    p(s.p, "Full SVG support for graphics and icons:"),
    CodeBlock(
      `svg, circle, ellipse, line, path, polygon, polyline, rect,
g, defs, use, symbol, marker, clipPath, mask, pattern,
linearGradient, radialGradient, stop, text, tspan, textPath`,
      "text"
    ),
    h3(s.h3, "SVG Example"),
    CodeBlock(apiCode.svgExample.code, apiCode.svgExample.lang),

    // Attributes
    h2(s.h2, { id: "attributes" }, "Attributes"),
    p(s.p, "Pass attributes as objects—values can be static or reactive functions."),

    h3(s.h3, "Static Attributes"),
    CodeBlock(apiCode.attributesStatic.code, apiCode.attributesStatic.lang),

    h3(s.h3, "Reactive Attributes"),
    p(s.p, "Use functions for dynamic values that update on ", InlineCode("update()"), ":"),
    CodeBlock(apiCode.attributesReactive.code, apiCode.attributesReactive.lang),

    h3(s.h3, "Style Objects"),
    p(s.p, "Styles can be objects, strings, or reactive functions:"),
    CodeBlock(apiCode.attributesStyle.code, apiCode.attributesStyle.lang),

    h3(s.h3, "Boolean Attributes"),
    CodeBlock(apiCode.attributesBoolean.code, apiCode.attributesBoolean.lang),

    h3(s.h3, "Special Attributes"),
    p(s.p, "Some attributes are mapped for convenience:"),
    CodeBlock(apiCode.specialAttributes.code, apiCode.specialAttributes.lang),

    // className Merging
    h2(s.h2, { id: "className-merging" }, "className Merging"),
    p(
      s.p,
      "Multiple ",
      InlineCode("className"),
      " values are merged rather than overwritten—static strings, reactive functions, and style helper modifiers all compose."
    ),
    CodeBlock(apiCode.classNameMerging.code, apiCode.classNameMerging.lang),

    h3(s.h3, "Conditional Classes"),
    CodeBlock(apiCode.classNameConditional.code, apiCode.classNameConditional.lang),

    h3(s.h3, "With Style Helpers"),
    CodeBlock(apiCode.styleHelperMerging.code, apiCode.styleHelperMerging.lang),

    h3(s.h3, "Status Pattern"),
    p(s.p, "Common pattern for conditional styling:"),
    CodeBlock(apiCode.classNameStatusPattern.code, apiCode.classNameStatusPattern.lang),

    // Modifiers
    h2(s.h2, { id: "modifiers" }, "Modifiers"),
    p(s.p, "Objects with ", InlineCode("__modifier"), " allow behaviors beyond attributes."),

    h3(s.h3, "Event Modifiers"),
    CodeBlock(apiCode.modifiersEvents.code, apiCode.modifiersEvents.lang),

    h3(s.h3, "Style Modifiers"),
    CodeBlock(apiCode.modifiersStyles.code, apiCode.modifiersStyles.lang),

    h3(s.h3, "Custom Modifiers"),
    p(s.p, "Create your own modifiers for reusable behaviors:"),
    CodeBlock(apiCode.modifiersCustomFocus.code, apiCode.modifiersCustomFocus.lang)
  );
}
