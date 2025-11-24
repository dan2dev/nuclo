import "nuclo";
import { s } from "../styles.ts";
import { CodeBlock, InlineCode } from "../components/CodeBlock.ts";
import { gettingStartedCode } from "../content/gettingStarted.ts";

export function GettingStartedPage() {
  return div(
    s.pageContent,
    h1(s.pageTitle, "Getting Started"),
    p(
      s.pageSubtitle,
      "Everything from the original Nuclo docs: installs, Deno support, first app walkthrough, explicit updates, events, styling, and best practices."
    ),

    // Installation
    h2(s.h2, "Installation"),
    p(s.p, "Install with your preferred package manager:"),
    CodeBlock(gettingStartedCode.installNpm.code, gettingStartedCode.installNpm.lang),
    p(s.p, "Deno works too—import directly from npm:"),
    CodeBlock(gettingStartedCode.denoImport.code, gettingStartedCode.denoImport.lang),
    p(s.p, "Or add it to ", InlineCode("deno.json"), ":"),
    CodeBlock(gettingStartedCode.denoJson.code, gettingStartedCode.denoJson.lang),
    p(s.p, "Then import once to register global builders:"),
    CodeBlock(gettingStartedCode.denoUsage.code, gettingStartedCode.denoUsage.lang),

    // TypeScript
    h2(s.h2, "TypeScript Setup"),
    p(
      s.p,
      "Nuclo ships full typings for 140+ HTML/SVG builders. Enable them globally with ",
      InlineCode("types"),
      "."
    ),
    CodeBlock(gettingStartedCode.tsconfigTypes.code, gettingStartedCode.tsconfigTypes.lang),
    p(s.p, "…or add a reference to your env definition file:"),
    CodeBlock(gettingStartedCode.typesReference.code, gettingStartedCode.typesReference.lang),

    // First app
    h2(s.h2, "Your First App"),
    p(
      s.p,
      "Straight from the original landing page: a counter that shows state, events, and explicit ",
      InlineCode("update()"),
      "."
    ),
    CodeBlock(gettingStartedCode.firstApp.code, gettingStartedCode.firstApp.lang),
    h3(s.h3, "How it works"),
    ul(
      s.ul,
      li(s.li, strong("Import:"), " ", InlineCode("import 'nuclo'"), " registers global builders"),
      li(s.li, strong("State:"), " plain variables/objects—no hooks or stores"),
      li(s.li, strong("Reactive content:"), " zero-arg functions rerender on ", InlineCode("update()")),
      li(s.li, strong("Events:"), " attach listeners with ", InlineCode("on()")),
      li(s.li, strong("Render:"), " mount once with ", InlineCode("render()"))
    ),

    // update()
    h2(s.h2, "Understanding update()"),
    p(
      s.p,
      InlineCode("update()"),
      " is explicit: mutate freely, then call it once to refresh reactive functions."
    ),
    h3(s.h3, "Batching updates"),
    CodeBlock(gettingStartedCode.batchUpdates.code, gettingStartedCode.batchUpdates.lang),
    h3(s.h3, "Why explicit?"),
    ul(
      s.ul,
      li(s.li, "Performance: batch multiple mutations into one DOM update"),
      li(s.li, "Control: you decide exactly when the UI refreshes"),
      li(s.li, "Predictability: no hidden re-renders or proxies"),
      li(s.li, "Debugging: set a breakpoint on ", InlineCode("update()"), " to trace changes")
    ),

    // Reactive functions
    h2(s.h2, "Reactive Functions"),
    p(s.p, "Any zero-arg function is reactive. Use them for text, attributes, and styles."),
    h3(s.h3, "Text content"),
    CodeBlock(gettingStartedCode.reactiveText.code, gettingStartedCode.reactiveText.lang),
    h3(s.h3, "Attributes"),
    CodeBlock(gettingStartedCode.reactiveAttributes.code, gettingStartedCode.reactiveAttributes.lang),
    h3(s.h3, "Styles"),
    CodeBlock(gettingStartedCode.reactiveStyles.code, gettingStartedCode.reactiveStyles.lang),
    h3(s.h3, "Complex expressions"),
    CodeBlock(gettingStartedCode.complexExpressions.code, gettingStartedCode.complexExpressions.lang),

    // Events
    h2(s.h2, "Event Handling with on()"),
    p(s.p, "The ", InlineCode("on()"), " helper returns modifiers for any DOM event."),
    h3(s.h3, "Basic events"),
    CodeBlock(gettingStartedCode.eventBasic.code, gettingStartedCode.eventBasic.lang),
    h3(s.h3, "Multiple events"),
    CodeBlock(gettingStartedCode.eventMultiple.code, gettingStartedCode.eventMultiple.lang),
    h3(s.h3, "Event options"),
    CodeBlock(gettingStartedCode.eventOptions.code, gettingStartedCode.eventOptions.lang),
    h3(s.h3, "Keyboard helpers"),
    CodeBlock(gettingStartedCode.keyboardEvents.code, gettingStartedCode.keyboardEvents.lang),

    // Styling
    h2(s.h2, "Styling"),
    p(
      s.p,
      "Nuclo ships a CSS-in-JS system with chainable helpers and ",
      InlineCode("createStyleQueries"),
      "."
    ),
    h3(s.h3, "Using createStyleQueries"),
    CodeBlock(gettingStartedCode.stylingSetup.code, gettingStartedCode.stylingSetup.lang),
    h3(s.h3, "Responsive styles"),
    CodeBlock(gettingStartedCode.responsiveStyles.code, gettingStartedCode.responsiveStyles.lang),
    h3(s.h3, "Dynamic styles"),
    CodeBlock(gettingStartedCode.dynamicStyles.code, gettingStartedCode.dynamicStyles.lang),

    // Best practices
    h2(s.h2, "Best Practices"),
    h3(s.h3, "Batch your updates"),
    CodeBlock(gettingStartedCode.bestPracticeBatch.code, gettingStartedCode.bestPracticeBatch.lang),
    h3(s.h3, "Use computed helpers"),
    CodeBlock(gettingStartedCode.bestPracticeComputed.code, gettingStartedCode.bestPracticeComputed.lang),
    h3(s.h3, "Component-like functions"),
    CodeBlock(gettingStartedCode.componentFunctions.code, gettingStartedCode.componentFunctions.lang),
    h3(s.h3, "Use plain objects/arrays"),
    CodeBlock(gettingStartedCode.mutableState.code, gettingStartedCode.mutableState.lang),
    h3(s.h3, "Handle async flows"),
    CodeBlock(gettingStartedCode.asyncFlow.code, gettingStartedCode.asyncFlow.lang),

    // Next steps
    h2(s.h2, "Next Steps"),
    ul(
      s.ul,
      li(s.li, strong("Core API:"), " learn ", InlineCode("when()"), ", ", InlineCode("list()"), ", and more"),
      li(s.li, strong("Tag Builders:"), " explore all HTML and SVG elements"),
      li(s.li, strong("Styling:"), " CSS-in-JS helpers and responsive design"),
      li(s.li, strong("Examples:"), " run through the full demo gallery")
    )
  );
}
