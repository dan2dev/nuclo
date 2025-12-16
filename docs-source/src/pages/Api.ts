import "nuclo";
import { cn, s } from "../styles.ts";
import { CodeBlock, InlineCode } from "../components/CodeBlock.ts";
import { TableOfContents, setTocItems, setActiveSection } from "../components/TableOfContents.ts";
import { apiCode } from "../content/api.ts";
import { setPageCleanup } from "../routes.ts";

const tocItems = [
  { id: "core-functions", label: "Core Functions", level: 2 },
  { id: "update", label: "update()", level: 3 },
  { id: "render", label: "render()", level: 3 },
  { id: "on", label: "on()", level: 3 },
  { id: "list", label: "list()", level: 3 },
  { id: "when", label: "when()", level: 3 },
  { id: "scope", label: "scope()", level: 3 },
  { id: "tag-builders", label: "Tag Builders", level: 2 },
  { id: "html-tags", label: "HTML Tags", level: 3 },
  { id: "svg-tags", label: "SVG Tags", level: 3 },
  { id: "attributes", label: "Attributes", level: 2 },
  { id: "className-merging", label: "className Merging", level: 2 },
  { id: "style-helpers", label: "Style Helpers", level: 2 },
  { id: "modifiers", label: "Modifiers", level: 2 },
  { id: "ssr", label: "Server-Side Rendering", level: 2 },
];

let scrollObserver: IntersectionObserver | null = null;
let scrollTimer: number | null = null;

function setupScrollDetection() {
  if (scrollObserver) {
    scrollObserver.disconnect();
    scrollObserver = null;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    },
    {
      rootMargin: "-100px 0px -66%",
      threshold: 0,
    }
  );

  scrollObserver = observer;

  tocItems.forEach((item) => {
    const element = document.getElementById(item.id);
    if (element) observer.observe(element);
  });
}

export function ApiPage() {
  setTocItems(tocItems);

  if (scrollTimer !== null) {
    window.clearTimeout(scrollTimer);
    scrollTimer = null;
  }

  scrollTimer = window.setTimeout(setupScrollDetection, 200);

  setPageCleanup(() => {
    if (scrollTimer !== null) {
      window.clearTimeout(scrollTimer);
      scrollTimer = null;
    }
    if (scrollObserver) {
      scrollObserver.disconnect();
      scrollObserver = null;
    }
  });

  const pageLayoutStyle = cn(
    display("flex")
      .gap("48px")
      .maxWidth("1400px")
      .margin("0 auto")
      .padding("40px 24px 80px"),
    { medium: padding("140px 48px 80px") }
  );

  const contentStyle = cn(flex("1").minWidth("0"));

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
    pageLayoutStyle,
    // Main content
    div(
      contentStyle,
      h1(s.pageTitle, { id: "api-reference" }, "API Reference"),
      p(s.pageSubtitle, "Complete reference content from the original Nuclo site."),

      // Core functions overview
      h2(s.h2, { id: "core-functions" }, "Core Functions"),
      p(
        s.p,
        InlineCode("update()"),
        ", ",
        InlineCode("render()"),
        ", ",
        InlineCode("on()"),
        ", ",
        InlineCode("list()"),
        ", and ",
        InlineCode("when()"),
        " are the primitives every page is built on."
      ),

      // update
      h3(s.h3, { id: "update" }, "update()"),
      p(s.p, "Trigger a synchronous refresh of every reactive function."),
      CodeBlock(apiCode.updateUsage.code, apiCode.updateUsage.lang),
      ul(
        s.ul,
        li(s.li, "Call after batching mutations for best performance"),
        li(s.li, "Only zero-argument functions re-evaluate"),
        li(s.li, "Safe to call multiple times; prefer grouping work first")
      ),

      // render
      h3(s.h3, { id: "render" }, "render(element, container)"),
      p(s.p, "Mount an element tree to a DOM container (append, not replace)."),
      CodeBlock(apiCode.renderUsage.code, apiCode.renderUsage.lang),
      ul(
        s.ul,
        li(s.li, "Typical pattern: render one root that owns the whole app"),
        li(s.li, "You can render multiple trees if needed"),
        li(s.li, "Works with any element created by the tag builders")
      ),

      // on()
      h3(s.h3, { id: "on" }, "on(event, handler, options?)"),
      p(s.p, "Attach event listeners with full TypeScript support."),
      CodeBlock(apiCode.onClick.code, apiCode.onClick.lang),
      p(s.p, "Multiple handlers and options are supported:"),
      CodeBlock(apiCode.onMultipleEvents.code, apiCode.onMultipleEvents.lang),
      CodeBlock(apiCode.onPassive.code, apiCode.onPassive.lang),
      CodeBlock(apiCode.onKeyboard.code, apiCode.onKeyboard.lang),
      CodeBlock(apiCode.onFormSubmit.code, apiCode.onFormSubmit.lang),

      // list()
      h3(s.h3, { id: "list" }, "list(provider, renderer)"),
      p(
        s.p,
        "Synchronize arrays to DOM nodes. Items stay mounted while object identity is stable—mutate objects in place instead of replacing them."
      ),
      CodeBlock(apiCode.listBasic.code, apiCode.listBasic.lang),
      CodeBlock(apiCode.listIdentity.code, apiCode.listIdentity.lang),
      p(s.p, "Nested lists remain stable too:"),
      CodeBlock(apiCode.listNested.code, apiCode.listNested.lang),

      // when()
      h3(s.h3, { id: "when" }, "when(condition, ...content)"),
      p(s.p, "Chain conditional branches; the first truthy branch wins and DOM is preserved when the branch stays the same."),
      CodeBlock(apiCode.whenBasic.code, apiCode.whenBasic.lang),
      CodeBlock(apiCode.whenRoles.code, apiCode.whenRoles.lang),
      CodeBlock(apiCode.whenElseBranch.code, apiCode.whenElseBranch.lang),
      CodeBlock(apiCode.whenPreserve.code, apiCode.whenPreserve.lang),
      CodeBlock(apiCode.whenNestedConditions.code, apiCode.whenNestedConditions.lang),

      // scope()
      h3(s.h3, { id: "scope" }, "scope(...ids) & Scoped Updates"),
      p(
        s.p,
        "For performance optimization, you can scope updates to specific parts of your UI. Mark elements with ",
        InlineCode("scope()"),
        " and pass scope IDs to ",
        InlineCode("update()"),
        " to update only those scoped regions."
      ),
      CodeBlock(apiCode.scopedUpdates.code, apiCode.scopedUpdates.lang),
      p(s.p, "You can apply multiple scopes to an element and update multiple scopes at once:"),
      CodeBlock(apiCode.scopeMultiple.code, apiCode.scopeMultiple.lang),
      ul(
        s.ul,
        li(s.li, "Scoped updates only refresh reactive functions within marked scope roots"),
        li(s.li, "Elements can belong to multiple scopes"),
        li(s.li, "Calling ", InlineCode("update()"), " without arguments updates all scopes (default behavior)"),
        li(s.li, "Great for large apps where only specific regions need updates")
      ),

      // Tag builders
      h2(s.h2, { id: "tag-builders" }, "Tag Builders"),
      p(
        s.p,
        "Every HTML and SVG element is available globally after ",
        InlineCode("import 'nuclo'"),
        ". Builders accept children, attributes, event modifiers, and arrays."
      ),
      CodeBlock(apiCode.tagBuilderBasic.code, apiCode.tagBuilderBasic.lang),

      // HTML tags
      h3(s.h3, { id: "html-tags" }, "HTML Tags"),
      p(s.p, "Full HTML5 coverage from the legacy site:"),
      ...htmlTagLists.map((group) =>
        div(
          h4(cn(fontSize("16px").fontWeight("600").marginTop("16px").marginBottom("8px")), group.title),
          pre(s.codeBlock, code(group.tags))
        )
      ),
      p(
        s.p,
        "And 100+ more—see ",
        a(
          {
            href: "https://github.com/dan2dev/nuclo/blob/main/packages/nuclo/src/core/tagRegistry.ts",
            target: "_blank",
            rel: "noopener noreferrer"
          },
          "the full registry"
        ),
        "."
      ),

      // SVG tags
      h3(s.h3, { id: "svg-tags" }, "SVG Tags"),
      p(
        s.p,
        "All SVG elements are available with a ",
        InlineCode("-Svg"),
        " suffix for better TypeScript support and to avoid naming conflicts:"
      ),
      CodeBlock(
        `svg, circleSvg, ellipseSvg, lineSvg, pathSvg, polygonSvg, polylineSvg, rectSvg,
g, defs, use, symbol, marker, clipPath, mask, pattern,
linearGradient, radialGradient, stop, text, tspan, textPath`,
        "text"
      ),
      p(s.p, "Basic usage example:"),
      CodeBlock(apiCode.svgExample.code, apiCode.svgExample.lang),
      p(s.p, "Advanced SVG with gradients and shapes:"),
      CodeBlock(apiCode.svgAdvanced.code, apiCode.svgAdvanced.lang),

      // Attributes
      h2(s.h2, { id: "attributes" }, "Attributes"),
      p(s.p, "Pass attributes as objects—values can be static or reactive functions."),
      h3(s.h3, "Static attributes"),
      CodeBlock(apiCode.attributesStatic.code, apiCode.attributesStatic.lang),
      h3(s.h3, "Reactive attributes"),
      CodeBlock(apiCode.attributesReactive.code, apiCode.attributesReactive.lang),
      h3(s.h3, "Style objects"),
      CodeBlock(apiCode.attributesStyle.code, apiCode.attributesStyle.lang),
      h3(s.h3, "Boolean helpers"),
      CodeBlock(apiCode.attributesBoolean.code, apiCode.attributesBoolean.lang),
      h3(s.h3, "Special attributes"),
      CodeBlock(apiCode.specialAttributes.code, apiCode.specialAttributes.lang),

      // className merging
      h2(s.h2, { id: "className-merging" }, "className Merging"),
      p(
        s.p,
        "Multiple ",
        InlineCode("className"),
        " values are merged rather than overwritten—static strings, reactive functions, and style helper modifiers all compose."
      ),
      CodeBlock(apiCode.classNameMerging.code, apiCode.classNameMerging.lang),
      CodeBlock(apiCode.classNameConditional.code, apiCode.classNameConditional.lang),
      CodeBlock(apiCode.styleHelperMerging.code, apiCode.styleHelperMerging.lang),
      CodeBlock(apiCode.classNameStatusPattern.code, apiCode.classNameStatusPattern.lang),

      // Style helpers
      h2(s.h2, { id: "style-helpers" }, "Style Helpers & createStyleQueries"),
      p(
        s.p,
        "95+ chainable helpers return ",
        InlineCode("StyleBuilder"),
        " instances. Use ",
        InlineCode("createStyleQueries"),
        " for responsive variants or feature/container queries."
      ),
      CodeBlock(apiCode.styleHelpersCreateQueries.code, apiCode.styleHelpersCreateQueries.lang),
      CodeBlock(apiCode.styleHelpersResponsive.code, apiCode.styleHelpersResponsive.lang),
      CodeBlock(apiCode.styleHelpersFullList.code, apiCode.styleHelpersFullList.lang),
      CodeBlock(apiCode.styleHelpersReactiveStyles.code, apiCode.styleHelpersReactiveStyles.lang),

      // Modifiers
      h2(s.h2, { id: "modifiers" }, "Modifiers"),
      p(s.p, "Objects with ", InlineCode("__modifier"), " allow behaviors beyond attributes."),
      h3(s.h3, "Event modifiers"),
      CodeBlock(apiCode.modifiersEvents.code, apiCode.modifiersEvents.lang),
      h3(s.h3, "Style modifiers"),
      CodeBlock(apiCode.modifiersStyles.code, apiCode.modifiersStyles.lang),
      h3(s.h3, "Custom modifier example"),
      CodeBlock(apiCode.modifiersCustomFocus.code, apiCode.modifiersCustomFocus.lang),

      // SSR
      h2(s.h2, { id: "ssr" }, "Server-Side Rendering (SSR)"),
      p(
        s.p,
        "Nuclo supports server-side rendering through the ",
        InlineCode("nuclo/ssr"),
        " module. Render components to HTML strings for SSR frameworks or static site generation."
      ),
      h3(s.h3, "renderToString()"),
      p(s.p, "Render a component to an HTML string:"),
      CodeBlock(apiCode.ssrBasic.code, apiCode.ssrBasic.lang),
      h3(s.h3, "renderManyToString()"),
      p(s.p, "Render multiple components to an array of HTML strings:"),
      CodeBlock(apiCode.ssrMultiple.code, apiCode.ssrMultiple.lang),
      h3(s.h3, "renderToStringWithContainer()"),
      p(s.p, "Render with a custom container element and attributes:"),
      CodeBlock(apiCode.ssrWithContainer.code, apiCode.ssrWithContainer.lang),
      ul(
        s.ul,
        li(s.li, "SSR functions work in Node.js environments with DOM polyfills"),
        li(s.li, "Reactive functions are evaluated once during SSR"),
        li(s.li, "Event handlers and client-side interactivity are omitted from SSR output"),
        li(s.li, "Perfect for pre-rendering pages or generating static HTML")
      )
    ),
    // Table of Contents Sidebar
    TableOfContents()
  );
}
