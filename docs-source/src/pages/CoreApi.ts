import "nuclo";
import { s } from "../styles.ts";
import { CodeBlock } from "../components/CodeBlock.ts";
import { PageHeader, ApiEntry, NoteCard, NextSteps } from "../components/ui.ts";
import { apiCode } from "../content/api.ts";

export function CoreApiPage() {
  return div(
    s.pageContent,

    PageHeader(
      "Core API",
      "The five functions that power every Nuclo application: update(), render(), on(), list(), and when().",
      "Reference"
    ),

    // ── update() ─────────────────────────────────────────────────────────────
    ApiEntry({
      id: "update",
      signature: "update()",
      description: "Runs one synchronous update pass across the application. Call it once after all state mutations.",
      points: [
        "Nuclo does not auto-detect mutations — you decide when the DOM syncs",
        "Zero-argument bindings, list providers, and when() conditions re-evaluate",
        "Safe to call multiple times; prefer grouping work first",
      ],
    }),
    CodeBlock(apiCode.updateUsage.code, apiCode.updateUsage.lang),

    // ── render() ─────────────────────────────────────────────────────────────
    ApiEntry({
      id: "render",
      signature: "render(element, container)",
      description: "Mounts an element tree into a DOM container. Appends rather than replaces — run it once at app startup.",
      points: [
        "Typical pattern: render one root element that owns the whole app",
        "Multiple trees are supported but rarely needed",
        "Works with any element returned by the tag builders",
      ],
    }),
    CodeBlock(apiCode.renderUsage.code, apiCode.renderUsage.lang),

    // ── on() ─────────────────────────────────────────────────────────────────
    ApiEntry({
      id: "on",
      signature: "on(event, handler, options?)",
      description: "Returns a modifier that attaches a typed event listener to any element. Full TypeScript inference for every DOM event.",
      points: [
        "Accepts any standard EventTarget event name",
        "Optional third argument maps to addEventListener options (once, passive, capture)",
        "Multiple on() calls on the same element are all registered",
      ],
    }),

    h3(s.h3, "Basic usage"),
    CodeBlock(apiCode.onClick.code, apiCode.onClick.lang),

    h3(s.h3, "Multiple events"),
    CodeBlock(apiCode.onMultipleEvents.code, apiCode.onMultipleEvents.lang),

    h3(s.h3, "Listener options"),
    CodeBlock(apiCode.onPassive.code, apiCode.onPassive.lang),

    h3(s.h3, "Keyboard events"),
    CodeBlock(apiCode.onKeyboard.code, apiCode.onKeyboard.lang),

    h3(s.h3, "Form submit"),
    CodeBlock(apiCode.onFormSubmit.code, apiCode.onFormSubmit.lang),

    // ── list() ───────────────────────────────────────────────────────────────
    ApiEntry({
      id: "list",
      signature: "list(provider, renderer)",
      description: "Synchronizes an array of objects to a sequence of DOM nodes. Items stay mounted while their object reference remains stable — mutate in place for efficient updates.",
      points: [
        "provider is a zero-arg function returning the current array — re-evaluated on update()",
        "renderer(item, index) builds the DOM for each item",
        "Items are tracked by object identity; replace a reference and its element is recreated",
        "Supports nested lists — each inner list tracks its own items independently",
      ],
    }),

    h3(s.h3, "Basic list"),
    CodeBlock(apiCode.listBasic.code, apiCode.listBasic.lang),

    h3(s.h3, "Object identity"),
    NoteCard("warning", "Mutate objects; don't replace them. A new object reference forces element recreation."),
    CodeBlock(apiCode.listIdentity.code, apiCode.listIdentity.lang),

    h3(s.h3, "Nested lists"),
    CodeBlock(apiCode.listNested.code, apiCode.listNested.lang),

    // ── when() ───────────────────────────────────────────────────────────────
    ApiEntry({
      id: "when",
      signature: "when(condition, ...content)",
      description: "Conditional rendering with DOM preservation. Chain .when() for else-if branches and .else() for the fallback. The first truthy branch wins; its DOM persists across updates as long as the same branch is active.",
      points: [
        "condition is a zero-arg function — re-evaluated on update()",
        "Chain as many .when() branches as needed before a final .else()",
        "DOM is preserved when the active branch doesn't change — no teardown",
        "Accepts multiple children per branch",
      ],
    }),

    h3(s.h3, "Basic usage"),
    CodeBlock(apiCode.whenBasic.code, apiCode.whenBasic.lang),

    h3(s.h3, "Multiple conditions"),
    CodeBlock(apiCode.whenRoles.code, apiCode.whenRoles.lang),

    h3(s.h3, "Branch content"),
    CodeBlock(apiCode.whenElseBranch.code, apiCode.whenElseBranch.lang),

    h3(s.h3, "DOM preservation"),
    p(s.p, "Elements persist across updates when the same branch stays active:"),
    CodeBlock(apiCode.whenPreserve.code, apiCode.whenPreserve.lang),

    h3(s.h3, "Nested conditions"),
    CodeBlock(apiCode.whenNestedConditions.code, apiCode.whenNestedConditions.lang),

    NextSteps([
      { label: "Tag Builders", description: "Every HTML and SVG tag as a global function.",             route: "tag-builders"   },
      { label: "Styling",      description: "CSS-in-JS helpers, breakpoints, and pseudo-classes.",     route: "styling"        },
      { label: "Pitfalls",     description: "Five common mistakes and how to avoid them.",             route: "pitfalls"       },
      { label: "Examples",     description: "See update(), list(), and when() in working demos.",      route: "examples"       },
    ])
  );
}
