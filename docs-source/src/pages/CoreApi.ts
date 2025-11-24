import "nuclo";
import { s } from "../styles.ts";
import { CodeBlock } from "../components/CodeBlock.ts";
import { apiCode } from "../content/api.ts";

export function CoreApiPage() {
  return div(
    s.pageContent,
    h1(s.pageTitle, "Core API"),
    p(
      s.pageSubtitle,
      "The essential functions that power every Nuclo application: update(), render(), on(), list(), and when()."
    ),

    // update()
    h2(s.h2, { id: "update" }, "update()"),
    p(s.p, "Trigger a synchronous refresh of every reactive function in your application."),
    CodeBlock(apiCode.updateUsage.code, apiCode.updateUsage.lang),
    h3(s.h3, "Key Points"),
    ul(
      s.ul,
      li(s.li, "Call after batching mutations for best performance"),
      li(s.li, "Only zero-argument functions re-evaluate"),
      li(s.li, "Safe to call multiple times; prefer grouping work first")
    ),

    // render()
    h2(s.h2, { id: "render" }, "render(element, container)"),
    p(s.p, "Mount an element tree to a DOM container (append, not replace)."),
    CodeBlock(apiCode.renderUsage.code, apiCode.renderUsage.lang),
    h3(s.h3, "Key Points"),
    ul(
      s.ul,
      li(s.li, "Typical pattern: render one root that owns the whole app"),
      li(s.li, "You can render multiple trees if needed"),
      li(s.li, "Works with any element created by the tag builders")
    ),

    // on()
    h2(s.h2, { id: "on" }, "on(event, handler, options?)"),
    p(s.p, "Attach event listeners with full TypeScript support."),
    CodeBlock(apiCode.onClick.code, apiCode.onClick.lang),

    h3(s.h3, "Multiple Events"),
    p(s.p, "Attach multiple event handlers to the same element:"),
    CodeBlock(apiCode.onMultipleEvents.code, apiCode.onMultipleEvents.lang),

    h3(s.h3, "Event Options"),
    p(s.p, "Pass standard event listener options:"),
    CodeBlock(apiCode.onPassive.code, apiCode.onPassive.lang),

    h3(s.h3, "Keyboard Events"),
    CodeBlock(apiCode.onKeyboard.code, apiCode.onKeyboard.lang),

    h3(s.h3, "Form Handling"),
    CodeBlock(apiCode.onFormSubmit.code, apiCode.onFormSubmit.lang),

    // list()
    h2(s.h2, { id: "list" }, "list(provider, renderer)"),
    p(
      s.p,
      "Synchronize arrays to DOM nodes. Items stay mounted while object identity is stable—mutate objects in place instead of replacing them."
    ),
    CodeBlock(apiCode.listBasic.code, apiCode.listBasic.lang),

    h3(s.h3, "Object Identity"),
    p(s.p, "Nuclo tracks items by reference. Mutate objects to preserve their DOM elements:"),
    CodeBlock(apiCode.listIdentity.code, apiCode.listIdentity.lang),

    h3(s.h3, "Nested Lists"),
    p(s.p, "Nested lists remain stable too:"),
    CodeBlock(apiCode.listNested.code, apiCode.listNested.lang),

    // when()
    h2(s.h2, { id: "when" }, "when(condition, ...content)"),
    p(s.p, "Chain conditional branches; the first truthy branch wins and DOM is preserved when the branch stays the same."),

    h3(s.h3, "Basic Usage"),
    CodeBlock(apiCode.whenBasic.code, apiCode.whenBasic.lang),

    h3(s.h3, "Multiple Conditions"),
    CodeBlock(apiCode.whenRoles.code, apiCode.whenRoles.lang),

    h3(s.h3, "Content in Branches"),
    CodeBlock(apiCode.whenElseBranch.code, apiCode.whenElseBranch.lang),

    h3(s.h3, "DOM Preservation"),
    p(s.p, "Elements persist across updates if the same branch is active:"),
    CodeBlock(apiCode.whenPreserve.code, apiCode.whenPreserve.lang),

    h3(s.h3, "Nested Conditions"),
    CodeBlock(apiCode.whenNestedConditions.code, apiCode.whenNestedConditions.lang)
  );
}
