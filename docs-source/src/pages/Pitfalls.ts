import "nuclo";
import { cn, s, colors } from "../styles.ts";
import { CodeBlock, InlineCode } from "../components/CodeBlock.ts";

export function PitfallsPage() {
  return div(
    s.pageContent,
    h1(s.pageTitle, "Common Pitfalls"),
    p(
      s.pageSubtitle,
      "Avoid these common mistakes when building with Nuclo. Learn the patterns that work and why."
    ),

    // Pitfall 1: Reactive functions for conditional elements
    h2(s.h2, { id: "conditional-elements" }, "Conditional Element Rendering"),
    div(
      cn(
        padding("20px")
          .backgroundColor(colors.bgCard)
          .borderRadius("12px")
          .border(`1px solid ${colors.border}`)
          .marginBottom("24px")
      ),
      h3(cn(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")), "The Problem"),
      p(s.p, "Using a reactive function to conditionally return different elements won't work:"),
      CodeBlock(
`// ❌ Wrong - reactive function returning elements won't render
button(
  () => isOpen ? CloseIcon() : MenuIcon()  // This won't display anything!
)`,
        "typescript"
      ),
      h3(cn(fontSize("16px").fontWeight("600").color(colors.primary).marginTop("20px").marginBottom("12px")), "The Solution"),
      p(s.p, "Use ", InlineCode("when()"), " for conditional element rendering:"),
      CodeBlock(
`// ✅ Correct - use when() for conditional elements
button(
  when(() => isOpen, CloseIcon()).else(MenuIcon())
)`,
        "typescript"
      ),
      h3(cn(fontSize("16px").fontWeight("600").color(colors.textMuted).marginTop("20px").marginBottom("12px")), "Why?"),
      p(
        s.p,
        "Reactive functions ", InlineCode("() => value"), " work great for text content and attribute values because Nuclo can update them in place. But elements need to be mounted/unmounted from the DOM, which requires ", InlineCode("when()"), " to manage properly."
      )
    ),

    // Pitfall 2: Forgetting to call update()
    h2(s.h2, { id: "forgetting-update" }, "Forgetting to Call update()"),
    div(
      cn(
        padding("20px")
          .backgroundColor(colors.bgCard)
          .borderRadius("12px")
          .border(`1px solid ${colors.border}`)
          .marginBottom("24px")
      ),
      h3(cn(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")), "The Problem"),
      p(s.p, "Changing state without calling ", InlineCode("update()"), " won't refresh the UI:"),
      CodeBlock(
`// ❌ Wrong - UI won't update
let count = 0;

button('Increment', on('click', () => {
  count++;  // State changed but UI stays the same
}))`,
        "typescript"
      ),
      h3(cn(fontSize("16px").fontWeight("600").color(colors.primary).marginTop("20px").marginBottom("12px")), "The Solution"),
      p(s.p, "Always call ", InlineCode("update()"), " after changing state:"),
      CodeBlock(
`// ✅ Correct - call update() to refresh
let count = 0;

button('Increment', on('click', () => {
  count++;
  update();  // Now the UI will reflect the new count
}))`,
        "typescript"
      )
    ),

    // Pitfall 3: Replacing objects in lists
    h2(s.h2, { id: "list-identity" }, "Replacing Objects in Lists"),
    div(
      cn(
        padding("20px")
          .backgroundColor(colors.bgCard)
          .borderRadius("12px")
          .border(`1px solid ${colors.border}`)
          .marginBottom("24px")
      ),
      h3(cn(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")), "The Problem"),
      p(s.p, "Replacing objects instead of mutating them causes unnecessary DOM recreation:"),
      CodeBlock(
`// ❌ Wrong - creates a new object, element will be recreated
todos[0] = { ...todos[0], done: true };
update();`,
        "typescript"
      ),
      h3(cn(fontSize("16px").fontWeight("600").color(colors.primary).marginTop("20px").marginBottom("12px")), "The Solution"),
      p(s.p, "Mutate the existing object to preserve its DOM element:"),
      CodeBlock(
`// ✅ Correct - mutate the object, element is preserved
todos[0].done = true;
update();`,
        "typescript"
      ),
      h3(cn(fontSize("16px").fontWeight("600").color(colors.textMuted).marginTop("20px").marginBottom("12px")), "Why?"),
      p(
        s.p,
        "Nuclo's ", InlineCode("list()"), " tracks items by object identity (reference). When you replace an object with a new one, Nuclo sees it as a different item and recreates the DOM element. Mutating preserves identity and enables efficient updates."
      )
    ),

    // Pitfall 4: Multiple update() calls
    h2(s.h2, { id: "multiple-updates" }, "Multiple update() Calls"),
    div(
      cn(
        padding("20px")
          .backgroundColor(colors.bgCard)
          .borderRadius("12px")
          .border(`1px solid ${colors.border}`)
          .marginBottom("24px")
      ),
      h3(cn(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")), "The Problem"),
      p(s.p, "Calling ", InlineCode("update()"), " multiple times is wasteful:"),
      CodeBlock(
`// ❌ Inefficient - 3 updates instead of 1
function handleSubmit() {
  user.name = 'Alice';
  update();
  user.email = 'alice@example.com';
  update();
  user.age = 30;
  update();
}`,
        "typescript"
      ),
      h3(cn(fontSize("16px").fontWeight("600").color(colors.primary).marginTop("20px").marginBottom("12px")), "The Solution"),
      p(s.p, "Batch all state changes, then call ", InlineCode("update()"), " once:"),
      CodeBlock(
`// ✅ Efficient - batch changes, single update
function handleSubmit() {
  user.name = 'Alice';
  user.email = 'alice@example.com';
  user.age = 30;
  update();  // One update for all changes
}`,
        "typescript"
      )
    ),

    // Pitfall 5: Static values where reactive needed
    h2(s.h2, { id: "static-vs-reactive" }, "Static Values Instead of Reactive"),
    div(
      cn(
        padding("20px")
          .backgroundColor(colors.bgCard)
          .borderRadius("12px")
          .border(`1px solid ${colors.border}`)
          .marginBottom("24px")
      ),
      h3(cn(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")), "The Problem"),
      p(s.p, "Using a static value when you need it to update:"),
      CodeBlock(
`// ❌ Wrong - count is captured once, never updates
let count = 0;

div(
  \`Count: \${count}\`  // Always shows "Count: 0"
)`,
        "typescript"
      ),
      h3(cn(fontSize("16px").fontWeight("600").color(colors.primary).marginTop("20px").marginBottom("12px")), "The Solution"),
      p(s.p, "Wrap in a function to make it reactive:"),
      CodeBlock(
`// ✅ Correct - function is called on each update()
let count = 0;

div(
  () => \`Count: \${count}\`  // Updates when count changes
)`,
        "typescript"
      )
    ),

    // Summary
    h2(s.h2, { id: "summary" }, "Quick Reference"),
    div(
      cn(
        padding("20px")
          .backgroundColor(colors.bgCard)
          .borderRadius("12px")
          .border(`1px solid ${colors.border}`)
      ),
      ul(
        s.ul,
        li(s.li, strong("Conditional elements:"), " Use ", InlineCode("when()"), ", not ", InlineCode("() => condition ? A : B")),
        li(s.li, strong("State changes:"), " Always call ", InlineCode("update()"), " after modifying state"),
        li(s.li, strong("Lists:"), " Mutate objects, don't replace them"),
        li(s.li, strong("Batching:"), " Group state changes before a single ", InlineCode("update()")),
        li(s.li, strong("Dynamic content:"), " Wrap in ", InlineCode("() =>"), " to make reactive")
      )
    )
  );
}
