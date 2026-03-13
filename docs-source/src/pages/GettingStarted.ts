import "nuclo";
import { s } from "../styles.ts";
import { CodeBlock, InlineCode } from "../components/CodeBlock.ts";
import { PageHeader, StepCard, NoteCard, NextSteps } from "../components/ui.ts";
import { gettingStartedCode } from "../content/gettingStarted.ts";

export function GettingStartedPage() {
  return div(
    s.pageContent,

    PageHeader(
      "Getting Started",
      "Install Nuclo, wire up TypeScript, and ship your first reactive UI in minutes.",
      "Quick Start"
    ),

    // ── Installation ─────────────────────────────────────────────────────────
    h2(s.h2, { id: "installation" }, "Installation"),

    StepCard(1, "Install via npm",
      CodeBlock(gettingStartedCode.installNpm.code, gettingStartedCode.installNpm.lang)
    ),
    StepCard(2, "Enable TypeScript types",
      p(s.p, "Add Nuclo's built-in types for all 140+ tag builders:"),
      CodeBlock(gettingStartedCode.tsconfigTypes.code, gettingStartedCode.tsconfigTypes.lang),
      NoteCard("tip", "Or add a single-file reference: ", InlineCode(gettingStartedCode.typesReference.code))
    ),
    StepCard(3, "Import and use",
      p(s.p, "One import registers all global builders — no destructuring needed:"),
      CodeBlock(gettingStartedCode.denoUsage.code, gettingStartedCode.denoUsage.lang)
    ),

    NoteCard(
      "info",
      "Deno? Import from npm directly: ",
      InlineCode("import 'npm:nuclo'"),
      ", or pin it in ",
      InlineCode("deno.json"),
      "."
    ),

    // ── First App ─────────────────────────────────────────────────────────────
    h2(s.h2, { id: "first-app" }, "Your First App"),
    p(s.p, "A counter that demonstrates state, events, and explicit ", InlineCode("update()"), ":"),
    CodeBlock(gettingStartedCode.firstApp.code, gettingStartedCode.firstApp.lang),

    h3(s.h3, "How it works"),
    ul(
      s.ul,
      li(s.li, strong("Import:"), " ", InlineCode("import 'nuclo'"), " registers all global builders"),
      li(s.li, strong("State:"), " plain JS variables — no hooks, no stores, no proxies"),
      li(s.li, strong("Reactive content:"), " zero-arg functions re-run on every ", InlineCode("update()")),
      li(s.li, strong("Events:"), " attach DOM listeners with ", InlineCode("on(event, handler)")),
      li(s.li, strong("Render:"), " mount once with ", InlineCode("render(element, container)"))
    ),

    // ── Understanding update() ────────────────────────────────────────────────
    h2(s.h2, { id: "update" }, "Understanding update()"),
    p(
      s.p,
      InlineCode("update()"),
      " is the heartbeat of a Nuclo app. Mutate state freely, then call it once to re-evaluate every reactive function in the tree."
    ),

    h3(s.h3, "Batching multiple mutations"),
    CodeBlock(gettingStartedCode.batchUpdates.code, gettingStartedCode.batchUpdates.lang),

    h3(s.h3, "Why explicit?"),
    ul(
      s.ul,
      li(s.li, strong("Performance:"), " batch many mutations into one DOM pass"),
      li(s.li, strong("Control:"), " you decide exactly when the UI updates"),
      li(s.li, strong("Predictability:"), " no hidden re-renders or reactive watchers"),
      li(s.li, strong("Debuggability:"), " set a breakpoint on ", InlineCode("update()"), " to trace every change")
    ),

    // ── Reactive Functions ────────────────────────────────────────────────────
    h2(s.h2, { id: "reactive" }, "Reactive Functions"),
    p(s.p, "Any zero-argument function passed as a child or attribute re-runs on ", InlineCode("update()"), "."),

    h3(s.h3, "Text content"),
    CodeBlock(gettingStartedCode.reactiveText.code, gettingStartedCode.reactiveText.lang),

    h3(s.h3, "Attributes"),
    CodeBlock(gettingStartedCode.reactiveAttributes.code, gettingStartedCode.reactiveAttributes.lang),

    h3(s.h3, "Styles"),
    CodeBlock(gettingStartedCode.reactiveStyles.code, gettingStartedCode.reactiveStyles.lang),

    h3(s.h3, "Complex expressions"),
    CodeBlock(gettingStartedCode.complexExpressions.code, gettingStartedCode.complexExpressions.lang),

    // ── Events ────────────────────────────────────────────────────────────────
    h2(s.h2, { id: "events" }, "Event Handling"),
    p(s.p, "The ", InlineCode("on()"), " helper returns a modifier accepted by any tag builder."),

    h3(s.h3, "Basic events"),
    CodeBlock(gettingStartedCode.eventBasic.code, gettingStartedCode.eventBasic.lang),

    h3(s.h3, "Multiple events on one element"),
    CodeBlock(gettingStartedCode.eventMultiple.code, gettingStartedCode.eventMultiple.lang),

    h3(s.h3, "Listener options"),
    CodeBlock(gettingStartedCode.eventOptions.code, gettingStartedCode.eventOptions.lang),

    h3(s.h3, "Keyboard helpers"),
    CodeBlock(gettingStartedCode.keyboardEvents.code, gettingStartedCode.keyboardEvents.lang),

    // ── Styling ───────────────────────────────────────────────────────────────
    h2(s.h2, { id: "styling" }, "Styling"),
    p(s.p, "Nuclo ships a CSS-in-JS system built on ", InlineCode("createStyleQueries"), " with chainable helpers and responsive breakpoints."),

    h3(s.h3, "Setup"),
    CodeBlock(gettingStartedCode.stylingSetup.code, gettingStartedCode.stylingSetup.lang),

    h3(s.h3, "Responsive styles"),
    CodeBlock(gettingStartedCode.responsiveStyles.code, gettingStartedCode.responsiveStyles.lang),

    NoteCard("tip", "See the full ", strong("Styling"), " page for every helper: layout, typography, colors, pseudo-classes, and more."),

    // ── Best Practices ────────────────────────────────────────────────────────
    h2(s.h2, { id: "best-practices" }, "Best Practices"),

    h3(s.h3, "Batch mutations"),
    CodeBlock(gettingStartedCode.bestPracticeBatch.code, gettingStartedCode.bestPracticeBatch.lang),

    h3(s.h3, "Computed helpers"),
    CodeBlock(gettingStartedCode.bestPracticeComputed.code, gettingStartedCode.bestPracticeComputed.lang),

    h3(s.h3, "Component functions"),
    CodeBlock(gettingStartedCode.componentFunctions.code, gettingStartedCode.componentFunctions.lang),

    h3(s.h3, "Plain objects and arrays"),
    CodeBlock(gettingStartedCode.mutableState.code, gettingStartedCode.mutableState.lang),

    h3(s.h3, "Async flows"),
    CodeBlock(gettingStartedCode.asyncFlow.code, gettingStartedCode.asyncFlow.lang),

    NextSteps([
      { label: "Core API",     description: "Detailed reference for update(), list(), when(), on(), and render().", route: "core-api"       },
      { label: "Tag Builders", description: "Every HTML and SVG element available as a global function.",           route: "tag-builders"   },
      { label: "Styling",      description: "The CSS-in-JS helpers, breakpoints, and pseudo-class system.",         route: "styling"        },
      { label: "Pitfalls",     description: "Five common mistakes and how to avoid them.",                          route: "pitfalls"       },
    ])
  );
}
