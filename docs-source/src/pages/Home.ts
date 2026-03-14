import "nuclo";
import { cn, colors } from "../styles.ts";
import { setRoute } from "../router.ts";
import { examplesContent } from "../content/examples.ts";

// ─── Shared card style ─────────────────────────────────────────────────────

const card = cn(
  backgroundColor(colors.bgCard)
    .borderRadius("20px")
    .border(`1px solid ${colors.border}`)
    .overflow("hidden")
    .transition("border-color 0.2s, background 0.2s"),
);

const cardPad = "28px";

// ─── Live Counter Demo ─────────────────────────────────────────────────────

let heroDemoCount = 0;

function LiveDemo() {
  // Header bar
  const demoHeader = div(
    cn(
      display("flex")
        .alignItems("center")
        .justifyContent("space-between")
        .padding("0 20px")
        .height("46px")
        .backgroundColor(colors.bgSecondary)
        .borderBottom(`1px solid ${colors.border}`),
    ),
    span(
      cn(fontSize("11px").fontWeight("700").color(colors.textMuted).letterSpacing("0.12em")),
      "LIVE DEMO",
    ),
    span(
      cn(
        display("inline-flex")
          .alignItems("center")
          .gap("5px")
          .padding("4px 10px")
          .borderRadius("99px")
          .fontSize("11px")
          .fontWeight("600")
          .color(colors.primary),
      ),
      { style: { backgroundColor: "var(--c-primary-alpha-08)" } },
      div(
        cn(
          width("6px").height("6px").borderRadius("50%")
            .backgroundColor(colors.primary).flexShrink("0"),
        ),
      ),
      "Interactive",
    ),
  );

  // Counter content
  const demoContent = div(
    cn(display("flex").flexDirection("column").gap("16px").padding("20px 24px")),

    // Number row
    div(
      cn(display("flex").alignItems("center").gap("12px")),
      span(
        cn(fontSize("56px").fontWeight("800").lineHeight("1").color(colors.text)
          .fontFamily("'JetBrains Mono', monospace")),
        () => heroDemoCount,
      ),
      span(
        cn(
          fontSize("11px").fontWeight("700").padding("4px 10px").borderRadius("99px")
            .textTransform("uppercase").letterSpacing("0.07em").transition("all 0.2s"),
        ),
        {
          style: () => ({
            backgroundColor: "var(--c-primary-alpha-13)",
            color: "var(--c-primary)",
          }),
        },
        () => heroDemoCount % 2 === 0 ? "even" : "odd",
      ),
    ),

    // Label
    span(
      cn(fontSize("10px").fontWeight("700").color(colors.textMuted).letterSpacing("0.15em")),
      "LIVE COUNTER",
    ),

    // Buttons
    div(
      cn(display("flex").gap("8px")),
      button(
        cn(
          display("flex").alignItems("center").justifyContent("center")
            .width("40px").height("40px").borderRadius("8px")
            .backgroundColor(colors.bgSecondary).color(colors.text)
            .border(`1px solid ${colors.border}`)
            .fontSize("18px").fontWeight("700").cursor("pointer").transition("all 0.15s"),
          { hover: borderColor(colors.borderPrimary) },
        ),
        "−",
        on("click", () => { heroDemoCount--; update(); }),
      ),
      button(
        cn(
          display("flex").alignItems("center").justifyContent("center")
            .width("40px").height("40px").borderRadius("8px")
            .border("none").fontSize("18px").fontWeight("700")
            .cursor("pointer").transition("all 0.15s"),
          { hover: opacity("0.85").transform("scale(1.05)") },
        ),
        { style: { backgroundColor: "#D5FF40", color: "#0e0e0e" } },
        "+",
        on("click", () => { heroDemoCount++; update(); }),
      ),
      button(
        cn(
          display("flex").alignItems("center").justifyContent("center")
            .padding("0 14px").height("40px").borderRadius("8px")
            .backgroundColor(colors.bgSecondary).color(colors.textMuted)
            .border(`1px solid ${colors.border}`)
            .fontSize("13px").cursor("pointer").transition("all 0.15s"),
          { hover: color(colors.text).borderColor(colors.borderLight) },
        ),
        "Reset",
        on("click", () => { heroDemoCount = 0; update(); }),
      ),
    ),
  );

  return div(card, demoHeader, demoContent);
}

// ─── Hero code snippet (static, no syntax highlight component) ────────────

const heroCodeLines = [
  { text: "import 'nuclo';",           accent: true },
  { text: "",                           muted: true },
  { text: "let count = 0;",            },
  { text: "",                           muted: true },
  { text: "const counter = div(",      accent: true },
  { text: "  h1(() => `Count: ${count}`),",  },
  { text: "  button('Increment', on('click', () => {", },
  { text: "    count++;",              number: true },
  { text: "    update();",             accent: true },
  { text: "  }))",                     },
  { text: ");",                        },
  { text: "",                           muted: true },
  { text: "render(counter, document.body);", accent: true },
];

function CodeCard() {
  const dots = div(
    cn(
      display("flex").alignItems("center").gap("8px")
        .padding("0 20px").height("48px")
        .backgroundColor(colors.bgSecondary)
        .borderBottom(`1px solid ${colors.border}`),
    ),
    div(cn(width("11px").height("11px").borderRadius("50%").backgroundColor("#ff5f57").flexShrink("0"))),
    div(cn(width("11px").height("11px").borderRadius("50%").backgroundColor("#febc2e").flexShrink("0"))),
    div(cn(width("11px").height("11px").borderRadius("50%").backgroundColor("#28c840").flexShrink("0"))),
    span(cn(marginLeft("auto").fontSize("12px").color(colors.textMuted).fontWeight("500")), "app.ts"),
  );

  const lines = div(
    cn(display("flex").flexDirection("column").gap("8px").padding("24px 28px")),
    ...heroCodeLines.map(({ text, accent, muted, number: isNum }) => {
      const col = accent ? "var(--c-primary)"
        : muted ? "var(--c-text-muted)"
        : isNum ? "#D97706"
        : "var(--c-text)";
      return div(
        cn(fontSize("14px").lineHeight("1.4").fontFamily("'JetBrains Mono', monospace")),
        { style: { color: col, whiteSpace: "pre" } },
        text || "\u00a0",
      );
    }),
  );

  return div(
    card,
    cn(height("fill_container")),
    dots,
    div(cn(overflow("auto"), { style: { flex: "1" } }), lines),
  );
}

// ─── Zero Deps stat card ──────────────────────────────────────────────────

function StatCard() {
  return div(
    card,
    cn(padding("28px").display("flex").flexDirection("column").gap("12px")),

    div(
      cn(display("flex").alignItems("baseline").gap("6px")),
      span(
        cn(fontSize("64px").fontWeight("800").lineHeight("1").color(colors.primary)
          .fontFamily("'JetBrains Mono', monospace")),
        "0",
      ),
      span(
        cn(fontSize("20px").fontWeight("600").color(colors.textMuted)
          .fontFamily("'JetBrains Mono', monospace")),
        "deps",
      ),
    ),
    span(cn(fontSize("17px").fontWeight("600").color(colors.text)), "Zero Dependencies"),
    span(
      cn(fontSize("13px").color(colors.textMuted).lineHeight("1.6")),
      "No third-party packages. Pure DOM, pure performance.",
    ),
  );
}

// ─── Feature cards (Row 2) ────────────────────────────────────────────────

function FeatureCard(icon: string, title: string, desc: string) {
  const iconBox = div(
    cn(
      display("flex").alignItems("center").justifyContent("center")
        .width("44px").height("44px").borderRadius("12px")
        .backgroundColor(colors.bgIcon).border(`1px solid ${colors.border}`)
        .flexShrink("0"),
    ),
    span(cn(fontSize("22px")), icon),
  );

  return div(
    card,
    cn(padding(cardPad).display("flex").flexDirection("column").gap("12px")),
    iconBox,
    span(cn(fontSize("17px").fontWeight("600").color(colors.text)), title),
    span(
      cn(fontSize("13px").color(colors.textMuted).lineHeight("1.7").flex("1")),
      { style: { textGrowth: "fixed-width" } },
      desc,
    ),
  );
}

// ─── Install bar ──────────────────────────────────────────────────────────

function InstallBar() {
  return div(
    cn(
      display("flex").alignItems("center").justifyContent("space-between")
        .flexWrap("wrap").gap("20px")
        .borderRadius("20px").border(`1px solid ${colors.border}`)
        .padding("32px 40px")
        .backgroundColor(colors.bgSecondary),
    ),
    { style: { boxShadow: "0 8px 40px rgba(0,0,0,0.3)" } },

    // Left
    div(
      cn(display("flex").flexDirection("column").gap("8px")),
      span(
        cn(fontSize("11px").fontWeight("700").color(colors.textMuted).letterSpacing("0.12em")),
        "INSTALL VIA NPM",
      ),
      span(
        cn(fontSize("24px").fontWeight("600").color(colors.primary)
          .fontFamily("'JetBrains Mono', monospace")),
        "npm install nuclo",
      ),
    ),

    // Button
    button(
      cn(
        display("flex").alignItems("center").justifyContent("center")
          .padding("14px 28px").borderRadius("10px").border("none")
          .fontSize("15px").fontWeight("700").cursor("pointer").transition("all 0.15s"),
        { hover: opacity("0.85").transform("translateY(-1px)") },
      ),
      { style: { backgroundColor: "#D5FF40", color: "#0e0e0e" } },
      "Get Started →",
      on("click", () => setRoute("getting-started")),
    ),
  );
}

// ─── Quick Start step card ────────────────────────────────────────────────

function stepIconBox(icon: string) {
  return div(
    cn(
      display("flex").alignItems("center").justifyContent("center")
        .width("40px").height("40px").borderRadius("10px")
        .backgroundColor(colors.bgIcon).border(`1px solid ${colors.border}`)
        .flexShrink("0"),
    ),
    span(cn(fontSize("18px")), icon),
  );
}

function Step01() {
  const top = div(
    cn(display("flex").flexDirection("column").gap("14px")),
    stepIconBox("⬛"),
    span(cn(fontSize("11px").fontWeight("700").color(colors.primary).letterSpacing("0.15em")), "STEP 01"),
    span(cn(fontSize("24px").fontWeight("700").color(colors.text)), "Install"),
    span(
      cn(fontSize("14px").color(colors.textMuted).lineHeight("1.6")),
      { style: { maxWidth: "240px" } },
      "One command. Zero config. Ready to build.",
    ),
  );

  const codeSnip = div(
    cn(
      display("flex").alignItems("center").gap("8px").padding("16px 20px")
        .borderRadius("12px").backgroundColor(colors.bgSecondary).border(`1px solid ${colors.border}`),
    ),
    span(
      cn(fontSize("14px").color(colors.textMuted).fontFamily("'JetBrains Mono', monospace")),
      "$",
    ),
    span(
      cn(fontSize("14px").color(colors.primary).fontFamily("'JetBrains Mono', monospace").fontWeight("600")),
      "npm install nuclo",
    ),
  );

  return div(
    card,
    cn(
      padding("32px").display("flex").flexDirection("column")
        .justifyContent("space-between").gap("20px"),
    ),
    top,
    codeSnip,
  );
}

function Step02() {
  const left = div(
    cn(display("flex").flexDirection("column").gap("16px").padding("32px")),
    stepIconBox("💻"),
    span(cn(fontSize("11px").fontWeight("700").color(colors.primary).letterSpacing("0.15em")), "STEP 02"),
    span(cn(fontSize("24px").fontWeight("700").color(colors.text)), "Import & Use"),
    span(
      cn(fontSize("14px").color(colors.textMuted).lineHeight("1.6")),
      "Import once globally. Every HTML tag becomes a function. Build UI with pure JavaScript.",
    ),
  );

  const codeLines = [
    { text: "import 'nuclo';", accent: true },
    { text: " " },
    { text: "const app = div(", accent: true },
    { text: "  h1('Hello, Nuclo!')," },
    { text: "  p('Building UIs.')" },
    { text: ");" },
    { text: " " },
    { text: "render(app, document.body);", accent: true },
  ];

  const right = div(
    cn(
      display("flex").flexDirection("column").gap("4px").padding("24px 28px")
        .backgroundColor(colors.bgSecondary).overflow("auto"),
    ),
    { style: { flex: "1", minWidth: "200px" } },
    ...codeLines.map(({ text, accent }) =>
      div(
        cn(fontSize("13px").fontFamily("'JetBrains Mono', monospace").lineHeight("1.5")),
        { style: { color: accent ? "var(--c-primary)" : "var(--c-text)", whiteSpace: "pre" } },
        text || "\u00a0",
      )
    ),
  );

  return div(
    card,
    cn(display("flex").overflow("hidden")),
    left,
    div(
      cn(display("none"), { medium: display("flex").flex("1").overflow("hidden") }),
      right,
    ),
  );
}

function Step03() {
  const codeLines = [
    { text: "// tsconfig.json",               comment: true },
    { text: "{" },
    { text: '  "compilerOptions": {' },
    { text: '    "types": ["nuclo/types"]',   accent: true },
    { text: "  }" },
    { text: "}" },
  ];

  const left = div(
    cn(
      display("flex").flexDirection("column").gap("4px").padding("24px 28px")
        .backgroundColor(colors.bgSecondary).overflow("auto"),
    ),
    { style: { flex: "1", minWidth: "200px" } },
    ...codeLines.map(({ text, accent, comment }) =>
      div(
        cn(fontSize("13px").fontFamily("'JetBrains Mono', monospace").lineHeight("1.5")),
        { style: { color: comment ? "var(--c-text-muted)" : accent ? "var(--c-primary)" : "var(--c-text)", whiteSpace: "pre" } },
        text || "\u00a0",
      )
    ),
  );

  const right = div(
    cn(display("flex").flexDirection("column").gap("16px").padding("32px")),
    stepIconBox("📐"),
    span(cn(fontSize("11px").fontWeight("700").color(colors.primary).letterSpacing("0.15em")), "STEP 03"),
    span(cn(fontSize("24px").fontWeight("700").color(colors.text)), "TypeScript Ready"),
    span(
      cn(fontSize("14px").color(colors.textMuted).lineHeight("1.6")),
      "Add one line to your tsconfig and get full autocomplete, type checking, and IntelliSense for every tag.",
    ),
  );

  return div(
    card,
    cn(display("flex").overflow("hidden")),
    { style: { borderColor: "var(--c-border-primary)" } },
    div(
      cn(display("none"), { medium: display("flex").flex("1").overflow("hidden") }),
      left,
    ),
    right,
  );
}

function ReadyCard() {
  return div(
    card,
    cn(
      display("flex").flexDirection("column").alignItems("center").justifyContent("center")
        .gap("20px").padding("32px").textAlign("center"),
    ),

    // rocket icon
    div(
      cn(
        display("flex").alignItems("center").justifyContent("center")
          .width("64px").height("64px").borderRadius("16px")
          .backgroundColor(colors.bgIcon).border(`1px solid ${colors.border}`).flexShrink("0"),
      ),
      span(cn(fontSize("28px")), "🚀"),
    ),

    span(cn(fontSize("22px").fontWeight("700").color(colors.text)), "You're Ready!"),

    span(
      cn(fontSize("14px").color(colors.textSubtitle).lineHeight("1.7")),
      { style: { maxWidth: "260px" } },
      "That's it. Three steps to build imperative, explicit UIs with zero abstractions.",
    ),

    span(
      cn(
        display("inline-flex").alignItems("center").gap("8px")
          .padding("8px 20px").borderRadius("99px")
          .backgroundColor(colors.bgIcon).border(`1px solid ${colors.border}`)
          .fontSize("12px").fontWeight("600").color(colors.primary),
      ),
      "✓  < 1kb gzipped",
    ),
  );
}

// ─── Example card ────────────────────────────────────────────────────────

const exampleIcons: Record<string, string> = {
  counter: "🔢", todo: "✅", subtasks: "🗂️", search: "🔍",
  async: "⚡", forms: "📝", nested: "🧩", animations: "✨",
  routing: "🗺️", "styled-card": "🎨",
};

// show only 3 examples on the homepage — same as Pencil design
const homepageExamples = ["counter", "todo", "search"];

function ExampleCard(id: string, title: string, desc: string) {
  return div(
    cn(
      backgroundColor(colors.bgCard)
        .borderRadius("20px")
        .border(`1px solid ${colors.border}`)
        .padding(cardPad)
        .display("flex").flexDirection("column").gap("12px")
        .cursor("pointer")
        .transition("all 0.2s"),
      {
        hover: border(`1px solid ${colors.borderPrimary}`)
          .transform("translateY(-2px)")
          .boxShadow("0 8px 32px rgba(0,0,0,0.15)"),
      }
    ),

    // top row: icon + live badge
    div(
      cn(display("flex").alignItems("center").justifyContent("space-between")),
      span(cn(fontSize("28px")), exampleIcons[id] ?? "📄"),
      span(
        cn(
          display("inline-flex").alignItems("center").gap("5px")
            .padding("4px 10px").borderRadius("99px")
            .fontSize("11px").fontWeight("600").color(colors.primary),
        ),
        { style: { backgroundColor: "var(--c-primary-alpha-08)" } },
        div(cn(width("5px").height("5px").borderRadius("50%").backgroundColor(colors.primary).flexShrink("0"))),
        "Live",
      ),
    ),

    span(cn(fontSize("16px").fontWeight("600").color(colors.text)), title),
    span(cn(fontSize("13px").color(colors.textMuted).lineHeight("1.6").flex("1")), desc),
    span(cn(fontSize("13px").fontWeight("600").color(colors.primary)), "View Example →"),

    on("click", () => {
      setRoute("examples");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }),
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export function HomePage() {
  const examples = examplesContent.filter(e => homepageExamples.includes(e.id));

  const sectionPad = cn(
    padding("0 24px 80px").maxWidth("1440px").margin("0 auto"),
    { medium: padding("0 48px 80px") }
  );

  return div(

    // ── HERO ──────────────────────────────────────────────────────────────
    section(
      cn(
        display("flex").flexDirection("column").alignItems("center")
          .textAlign("center").justifyContent("center")
          .padding("120px 24px 100px"),
        { medium: padding("120px 48px 100px") }
      ),

      // Badge
      div(
        cn(
          display("inline-flex").alignItems("center").gap("8px")
            .padding("6px 16px").borderRadius("99px")
            .border(`1px solid ${colors.border}`)
            .marginBottom("32px"),
        ),
        { style: { backgroundColor: "var(--c-primary-alpha-08)" } },
        div(cn(width("7px").height("7px").borderRadius("50%").backgroundColor(colors.primary).flexShrink("0"))),
        span(
          cn(fontSize("12px").fontWeight("600").color(colors.primary).letterSpacing("0.04em")),
          "Lightweight · Explicit · Imperative",
        ),
      ),

      // Headline — 2 lines matching Pencil exactly
      div(
        cn(display("flex").flexDirection("column").alignItems("center").marginBottom("24px")),
        span(
          cn(
            fontSize("48px").fontWeight("800").color(colors.text).lineHeight("1.05")
              .letterSpacing("-0.03em").display("block"),
            { medium: fontSize("60px"), large: fontSize("72px") }
          ),
          "Build Imperative,",
        ),
        span(
          cn(
            fontSize("48px").fontWeight("800").lineHeight("1.05")
              .letterSpacing("-0.03em").display("block"),
            { medium: fontSize("60px"), large: fontSize("72px") }
          ),
          { style: { color: "var(--c-primary)", fontStyle: "italic" } },
          "Explicit UIs.",
        ),
      ),

      // Subtitle
      p(
        cn(
          fontSize("16px").color(colors.textSubtitle).lineHeight("1.7")
            .marginBottom("40px"),
          { medium: fontSize("18px"), style: { maxWidth: "640px" } }
        ),
        "A lightweight imperative DOM framework. Mutate plain state, call update() when you're ready, and let Nuclo sync the DOM without proxies, signals, or virtual DOM.",
      ),

      // CTAs
      div(
        cn(display("flex").gap("12px").flexWrap("wrap").justifyContent("center")),
        button(
          cn(
            display("flex").alignItems("center").gap("8px")
              .padding("16px 32px").borderRadius("10px").border("none")
              .fontSize("15px").fontWeight("700").cursor("pointer").transition("all 0.15s"),
            { hover: opacity("0.9").transform("translateY(-2px)") },
          ),
          { style: { backgroundColor: "#D5FF40", color: "#0e0e0e" } },
          "Get Started →",
          on("click", () => setRoute("getting-started")),
        ),
        button(
          cn(
            display("flex").alignItems("center").gap("8px")
              .padding("16px 32px").borderRadius("10px")
              .backgroundColor("transparent")
              .border(`1px solid ${colors.border}`)
              .fontSize("15px").fontWeight("600").color(colors.primary)
              .cursor("pointer").transition("all 0.15s"),
            { hover: borderColor(colors.borderPrimary).transform("translateY(-2px)") },
          ),
          "View Examples",
          on("click", () => setRoute("examples")),
        ),
      ),
    ),

    // ── BENTO GRID ───────────────────────────────────────────────────────
    section(
      sectionPad,

      // Row 1: Code card (2/3 width) | Right col (1/3): Stats + Live Demo
      div(
        { className: "bento-code-row", style: { marginBottom: "20px", alignItems: "stretch" } },

        // Code card
        div(
          card,
          cn(display("flex").flexDirection("column").overflow("hidden")),
          { style: { minHeight: "420px" } },
          // Mac dots header
          div(
            cn(
              display("flex").alignItems("center").gap("8px")
                .padding("0 20px").height("48px")
                .backgroundColor(colors.bgSecondary)
                .borderBottom(`1px solid ${colors.border}`).flexShrink("0"),
            ),
            div(cn(width("11px").height("11px").borderRadius("50%").backgroundColor("#ff5f57").flexShrink("0"))),
            div(cn(width("11px").height("11px").borderRadius("50%").backgroundColor("#febc2e").flexShrink("0"))),
            div(cn(width("11px").height("11px").borderRadius("50%").backgroundColor("#28c840").flexShrink("0"))),
            span(cn(marginLeft("auto").fontSize("12px").color(colors.textMuted).fontWeight("500")), "app.ts"),
          ),
          // Code lines
          div(
            cn(display("flex").flexDirection("column").gap("8px").padding("24px 28px").overflow("auto")),
            ...heroCodeLines.map(({ text, accent, muted, number: isNum }) => {
              const col = accent ? "var(--c-primary)"
                : muted ? "var(--c-text-muted)"
                : isNum ? "#D97706"
                : "var(--c-text)";
              return div(
                cn(fontSize("14px").lineHeight("1.4").fontFamily("'JetBrains Mono', monospace")),
                { style: { color: col, whiteSpace: "pre" } },
                text || "\u00a0",
              );
            }),
          ),
        ),

        // Right column: Stats + Live Demo
        div(
          cn(display("flex").flexDirection("column").gap("20px")),
          StatCard(),
          LiveDemo(),
        ),
      ),

      // Row 2: 3 feature cards
      div(
        { className: "bento-feat-row" },
        FeatureCard("⚡", "TypeScript-First",
          "Full type definitions for 140+ HTML and SVG tags. Catch errors at compile time, not runtime."),
        div(
          card,
          cn(padding(cardPad).display("flex").flexDirection("column").gap("12px")),
          div(
            cn(display("flex").alignItems("baseline").gap("4px")),
            span(
              cn(fontSize("56px").fontWeight("800").lineHeight("1").color(colors.primary)
                .fontFamily("'JetBrains Mono', monospace")),
              "140",
            ),
            span(cn(fontSize("28px").fontWeight("800").color(colors.primary)
              .fontFamily("'JetBrains Mono', monospace")), "+"),
          ),
          span(cn(fontSize("17px").fontWeight("600").color(colors.text)), "HTML & SVG Tags"),
          span(
            cn(fontSize("13px").color(colors.textMuted).lineHeight("1.6").flex("1")),
            "Every standard element as a global builder function. No imports needed.",
          ),
        ),
        FeatureCard("🎯", "Fine-Grained Updates",
          "Call update() and Nuclo only touches DOM nodes whose resolved values changed. Elements are reused, branches stay mounted."),
      ),
    ),

    // ── INSTALL BAR ─────────────────────────────────────────────────────
    section(sectionPad, InstallBar()),

    // ── QUICK START ──────────────────────────────────────────────────────
    section(
      sectionPad,

      div(
        cn(display("flex").flexDirection("column").gap("12px").marginBottom("48px")),
        span(
          cn(fontSize("28px").fontWeight("800").color(colors.text).letterSpacing("-0.03em"),
            { medium: fontSize("34px"), large: fontSize("38px") }),
          "Quick Start",
        ),
        span(cn(fontSize("17px").color(colors.textMuted).lineHeight("1.7")), "Up and running in 30 seconds."),
      ),

      div(
        cn(display("flex").flexDirection("column").gap("20px")),

        // Row 1: Step01 (420px) + Step02 (fill)
        div(
          { className: "qs-row1", style: { minHeight: "320px" } },
          Step01(),
          Step02(),
        ),

        // Row 2: Step03 (fill) + ReadyCard (380px)
        div(
          { className: "qs-row2", style: { minHeight: "300px" } },
          Step03(),
          ReadyCard(),
        ),
      ),
    ),

    // ── EXAMPLES ────────────────────────────────────────────────────────
    section(
      sectionPad,

      div(
        cn(display("flex").flexDirection("column").gap("12px").marginBottom("48px")),
        span(
          cn(fontSize("28px").fontWeight("800").color(colors.text).letterSpacing("-0.03em"),
            { medium: fontSize("34px"), large: fontSize("38px") }),
          "Examples",
        ),
        span(cn(fontSize("17px").color(colors.textMuted).lineHeight("1.7")),
          "Practical examples with interactive live demos."),
      ),

      div(
        { className: "ex-grid" },
        ...examples.map(ex => ExampleCard(ex.id, ex.title, ex.description)),
      ),

      div(
        cn(textAlign("center").marginTop("40px")),
        button(
          cn(
            padding("12px 32px").borderRadius("10px")
              .backgroundColor("transparent").color(colors.text)
              .border(`1px solid ${colors.border}`)
              .fontSize("15px").fontWeight("600").cursor("pointer").transition("all 0.2s"),
            { hover: borderColor(colors.borderPrimary).color(colors.primary) },
          ),
          "View All Examples →",
          on("click", () => setRoute("examples")),
        ),
      ),
    ),
  );
}
