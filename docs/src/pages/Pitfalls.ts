import { cn, s, colors } from "../styles.ts";
import { InlineCode } from "../components/CodeBlock.ts";
import { PageHeader, PitfallCard, NoteCard, NextSteps } from "../components/ui.ts";

export function PitfallsPage() {
  return div(
    s.pageContent,

    PageHeader(
      "Common Pitfalls",
      "Patterns that catch beginners off guard. Each entry shows the wrong way, the right way, and why it matters.",
      "5 Pitfalls"
    ),

    // ── 1. Conditional elements ─────────────────────────────────────────────
    PitfallCard({
      title: "Conditional Element Rendering",
      problemContent: [
        "Using a dynamic function to conditionally return ",
        InlineCode("different elements"),
        " won't render anything visible:",
      ],
      problemCode: `// ❌ Wrong — dynamic function returning elements won't render
button(
  () => isOpen ? CloseIcon() : MenuIcon()  // shows nothing!
)`,
      solutionContent: [
        "Use ",
        InlineCode("when()"),
        " to conditionally mount/unmount elements from the DOM:",
      ],
      solutionCode: `// ✅ Correct — when() manages element mounting
button(
  when(() => isOpen, CloseIcon()).else(MenuIcon())
)`,
      why: `Dynamic functions like () => value work great for text content and attributes because Nuclo re-evaluates them during update(). But elements need to be physically mounted and removed from the DOM — that's what when() is for.`,
    }),

    // ── 2. Forgetting update() ──────────────────────────────────────────────
    PitfallCard({
      title: "Forgetting to Call update()",
      problemContent: [
        "Changing state without calling ",
        InlineCode("update()"),
        " leaves the UI frozen:",
      ],
      problemCode: `// ❌ Wrong — UI won't refresh
let count = 0;

button('Increment', on('click', () => {
  count++;  // state changed but screen stays the same
}))`,
      solutionContent: [
        "Always call ",
        InlineCode("update()"),
        " after mutating state to run a new update pass:",
      ],
      solutionCode: `// ✅ Correct — update() triggers the refresh
let count = 0;

button('Increment', on('click', () => {
  count++;
  update();  // now the UI reflects the new count
}))`,
    }),

    // ── 3. Replacing objects in lists ────────────────────────────────────────
    PitfallCard({
      title: "Replacing Objects in Lists",
      problemContent: [
        "Creating a new object instead of mutating the existing one causes ",
        InlineCode("list()"),
        " to destroy and recreate the DOM element:",
      ],
      problemCode: `// ❌ Wrong — new object = new DOM node
todos[0] = { ...todos[0], done: true };
update();`,
      solutionContent: [
        "Mutate the existing object to preserve DOM identity and skip unnecessary re-creation:",
      ],
      solutionCode: `// ✅ Correct — same object = same DOM node, just updates
todos[0].done = true;
update();`,
      why: `list() tracks items by object reference. Replace the reference and Nuclo treats it as a brand-new item, discarding the old DOM node and building a fresh one. Mutate in place to let the element live on.`,
    }),

    // ── 4. Multiple update() calls ──────────────────────────────────────────
    PitfallCard({
      title: "Multiple update() Calls in One Handler",
      problemContent: [
        "Calling ",
        InlineCode("update()"),
        " after every mutation causes redundant DOM passes:",
      ],
      problemCode: `// ❌ Inefficient — 3 full passes instead of 1
function handleSubmit() {
  user.name = 'Alice';
  update();                      // pass 1
  user.email = 'alice@ex.com';
  update();                      // pass 2
  user.age = 30;
  update();                      // pass 3
}`,
      solutionContent: ["Batch all mutations, then call ", InlineCode("update()"), " exactly once:"],
      solutionCode: `// ✅ Efficient — one pass covers all changes
function handleSubmit() {
  user.name  = 'Alice';
  user.email = 'alice@ex.com';
  user.age   = 30;
  update();                      // single pass
}`,
    }),

    // ── 5. Static vs dynamic ─────────────────────────────────────────────────
    PitfallCard({
      title: "Static Value Where a Dynamic Binding Is Needed",
      problemContent: [
        "Interpolating a variable directly captures the value ",
        InlineCode("at construction time"),
        " — it never updates:",
      ],
      problemCode: `// ❌ Wrong — count is captured once, always shows 0
let count = 0;

div(\`Count: \${count}\`)  // always renders "Count: 0"`,
      solutionContent: [
        "Wrap in an arrow function so it re-evaluates on every ",
        InlineCode("update()"),
        ":",
      ],
      solutionCode: `// ✅ Correct — function runs fresh on each update()
let count = 0;

div(() => \`Count: \${count}\`)  // reflects current value`,
    }),

    NoteCard(
      "tip",
      "If you're ever unsure whether something should be a function: ask yourself — ",
      "should this value change after the initial render? If yes, wrap it in ",
      InlineCode("() =>"),
      "."
    ),

    // ── Summary ─────────────────────────────────────────────────────────────
    h2(s.h2, { id: "summary" }, "Quick Reference"),
    div(
      cn(
        backgroundColor(colors.bgCard).borderRadius("14px")
          .border(`1px solid ${colors.border}`).overflow("hidden").marginBottom("24px")
      ),
      // Header row
      div(
        { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", padding: "10px 20px", backgroundColor: colors.bgLight, borderBottom: `1px solid ${colors.border}` } },
        span({ style: { fontSize: "11px", fontWeight: "700", color: colors.textDim, textTransform: "uppercase", letterSpacing: "0.06em" } }, "Concept"),
        span({ style: { fontSize: "11px", fontWeight: "700", color: colors.primary, textTransform: "uppercase", letterSpacing: "0.06em" } }, "✅ Do"),
        span({ style: { fontSize: "11px", fontWeight: "700", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.06em" } }, "❌ Avoid"),
      ),
      ...([
        ["Conditional elements", "when()", "() => condition ? A : B"],
        ["State changes", "update() after mutating", "mutate without update()"],
        ["List items", "mutate objects in-place", "replace with new objects"],
        ["Batching", "one update() per handler", "update() after each mutation"],
        ["Dynamic content", "() => expression", "plain interpolation"],
      ] as [string, string, string][]).map(([concept, correct, wrong], i, arr) =>
        div(
          { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", padding: "12px 20px", ...(i < arr.length - 1 ? { borderBottom: `1px solid ${colors.border}` } : {}) } },
          span({ style: { fontSize: "13px", fontWeight: "600", color: colors.text } }, concept),
          span({ style: { fontSize: "13px", color: colors.primary, fontFamily: "monospace" } }, correct),
          span({ style: { fontSize: "13px", color: "#ef4444", fontFamily: "monospace" } }, wrong)
        )
      )
    ),

    NextSteps([
      { label: "Core API", description: "Deep dive into update(), list(), when(), and on().", route: "core-api" },
      { label: "Getting Started", description: "Build your first Nuclo application from scratch.", route: "getting-started" },
      { label: "Examples", description: "See all pitfalls avoided in real working demos.", route: "examples" },
      { label: "Styling", description: "Learn the CSS-in-JS system and style helpers.", route: "styling" },
    ])
  );
}
