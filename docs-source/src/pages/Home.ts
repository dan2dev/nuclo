import "nuclo";
import { cn, s, colors } from "../styles.ts";
import { setRoute } from "../router.ts";
import { CodeBlock } from "../components/CodeBlock.ts";
import { examplesContent } from "../content/examples.ts";
import { gettingStartedCode } from "../content/gettingStarted.ts";
import { stylingCode } from "../content/styling.ts";
import { ArrowRightIcon } from "../components/icons.ts";

const heroCode = `import 'nuclo';

let count = 0;

const counter = div(
  h1(() => \`Count: \${count}\`),
  button('Increment', on('click', () => {
    count++;
    update();
  }))
);

render(counter, document.body);`;

// ─── Live Demo ──────────────────────────────────────────────────────────────

let heroDemoCount = 0;

function HeroDemo() {
  return div(
    cn(padding("20px 24px").display("flex").flexDirection("column").gap("16px")),

    div(
      cn(display("flex").alignItems("baseline").gap("12px")),
      span(
        cn(fontSize("56px").fontWeight("800").lineHeight("1").color(colors.text)),
        () => heroDemoCount
      ),
      span(
        cn(
          fontSize("11px").fontWeight("700").padding("4px 10px")
            .borderRadius("99px").textTransform("uppercase").letterSpacing("0.07em")
            .transition("all 0.3s")
        ),
        {
          style: () => ({
            backgroundColor: heroDemoCount % 2 === 0
              ? "rgba(132, 204, 22, 0.15)"
              : "rgba(34, 211, 238, 0.15)",
            color: heroDemoCount % 2 === 0 ? colors.primary : colors.accentSecondary,
          })
        },
        () => heroDemoCount % 2 === 0 ? "even" : "odd"
      )
    ),

    p(
      cn(fontSize("11px").color(colors.textDim).letterSpacing("0.07em").textTransform("uppercase").fontWeight("600")),
      "Live Counter"
    ),

    div(
      cn(display("flex").gap("8px")),
      button(
        cn(
          width("40px").height("40px")
            .display("flex").alignItems("center").justifyContent("center")
            .backgroundColor(colors.bgLight).color(colors.text)
            .borderRadius("8px").border(`1px solid ${colors.borderLight}`)
            .fontSize("18px").fontWeight("700").cursor("pointer").transition("all 0.15s"),
          { hover: backgroundColor(colors.bgCardHover).borderColor(colors.primary) }
        ),
        "−",
        on("click", () => { heroDemoCount--; update(); })
      ),
      button(
        cn(
          width("40px").height("40px")
            .display("flex").alignItems("center").justifyContent("center")
            .backgroundColor(colors.primary).color(colors.bg)
            .borderRadius("8px").border("none")
            .fontSize("18px").fontWeight("700").cursor("pointer").transition("all 0.15s"),
          { hover: backgroundColor(colors.primaryHover).transform("scale(1.05)") }
        ),
        "+",
        on("click", () => { heroDemoCount++; update(); })
      ),
      button(
        cn(
          padding("0 14px").height("40px")
            .display("flex").alignItems("center").justifyContent("center")
            .backgroundColor(colors.bgLight).color(colors.textMuted)
            .borderRadius("8px").border(`1px solid ${colors.border}`)
            .fontSize("13px").cursor("pointer").transition("all 0.15s"),
          { hover: color(colors.text).borderColor(colors.borderLight) }
        ),
        "Reset",
        on("click", () => { heroDemoCount = 0; update(); })
      )
    )
  );
}

// ─── Bento Card Styles ───────────────────────────────────────────────────────

const bentoCell = cn(
  backgroundColor(colors.bgCard)
    .borderRadius("20px")
    .border(`1px solid ${colors.border}`)
    .overflow("hidden")
);

const bentoCellGreen = cn(
  borderRadius("20px")
    .border(`1px solid ${colors.borderGlow}`)
    .overflow("hidden")
);

const bentoCellCyan = cn(
  borderRadius("20px")
    .border("1px solid rgba(34, 211, 238, 0.25)")
    .overflow("hidden")
);

// ─── Data ───────────────────────────────────────────────────────────────────

const previewIds = ["counter", "todo", "search", "async", "styled-card", "subtasks"];
const previewExamples = examplesContent.filter((ex) => previewIds.includes(ex.id));

function goToExample(id: string) {
  setRoute("examples");
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 150);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function HomePage() {
  return div(

    // ── HERO ──────────────────────────────────────────────────────────────
    section(
      s.hero,

      div(
        cn(
          display("inline-flex").alignItems("center").gap("8px")
            .padding("6px 16px").borderRadius("99px")
            .backgroundColor("rgba(132, 204, 22, 0.08)")
            .border(`1px solid ${colors.borderGlow}`)
            .marginBottom("28px")
        ),
        span(cn(
          width("7px").height("7px").borderRadius("50%")
            .backgroundColor(colors.primary).display("block")
        )),
        span(
          cn(fontSize("12px").fontWeight("600").color(colors.primary).letterSpacing("0.04em")),
          "Lightweight · Explicit · Reactive"
        )
      ),

      h1(
        s.heroTitle,
        "Build ",
        span(s.heroTitleAccent, { style: s.heroTitleAccentStyle }, "Faster"),
        ", ",
        span(s.heroTitleAccent, { style: s.heroTitleAccentStyle }, "Reactive"),
        " Interfaces."
      ),

      p(
        s.heroSubtitle,
        "A lightweight DOM library for the modern web. Just functions, plain objects, and explicit updates — no magic, no hidden reactivity."
      ),

      div(
        s.heroButtons,
        button(
          cn(
            padding("14px 32px")
              .backgroundColor(colors.primary).color(colors.bg)
              .borderRadius("10px").fontWeight("600").fontSize("15px")
              .border("none").transition("all 0.2s")
              .display("flex").alignItems("center").gap("8px"),
            { hover: backgroundColor(colors.primaryHover).transform("translateY(-2px)").boxShadow(`0 8px 24px ${colors.primaryGlow}`) }
          ),
          { style: s.btnPrimaryStyle },
          "Get Started", ArrowRightIcon(),
          on("click", () => setRoute("getting-started"))
        ),
        button(
          cn(
            padding("14px 32px")
              .backgroundColor("transparent").color(colors.text)
              .borderRadius("10px").fontWeight("600").fontSize("15px")
              .border(`1px solid ${colors.borderLight}`).transition("all 0.2s"),
            { hover: border(`1px solid ${colors.primary}`).color(colors.primary).transform("translateY(-2px)") }
          ),
          "View Examples",
          on("click", () => setRoute("examples"))
        )
      )
    ),

    // ── BENTO GRID ────────────────────────────────────────────────────────
    section(
      cn(
        padding("0 24px 80px").maxWidth("1200px").margin("0 auto"),
        { medium: padding("0 48px 100px") }
      ),

      div(
        cn(
          display("grid").gap("16px").gridTemplateColumns("1fr"),
          {
            medium: gridTemplateColumns("repeat(2, 1fr)").gap("20px"),
            large: gridTemplateColumns("repeat(3, 1fr)").gap("20px")
          }
        ),

        // TILE 1: Code Preview — spans 2 cols (medium+), 2 rows (large+)
        div(
          bentoCell,
          { className: "bento-col-2 bento-row-2" },
          // macOS window chrome
          div(
            cn(
              padding("12px 20px").backgroundColor(colors.bgLight)
                .borderBottom(`1px solid ${colors.border}`)
                .display("flex").alignItems("center").gap("8px")
            ),
            span(cn(width("11px").height("11px").borderRadius("50%").backgroundColor("#ff5f57").display("block"))),
            span(cn(width("11px").height("11px").borderRadius("50%").backgroundColor("#febc2e").display("block"))),
            span(cn(width("11px").height("11px").borderRadius("50%").backgroundColor("#28c840").display("block"))),
            span(cn(marginLeft("auto").fontSize("12px").color(colors.textDim).fontWeight("500")), "app.ts")
          ),
          div(
            cn(overflow("auto")),
            CodeBlock(heroCode, "typescript", false)
          )
        ),

        // TILE 2: Zero Dependencies stat
        div(
          bentoCellGreen,
          { style: { background: `linear-gradient(145deg, rgba(132, 204, 22, 0.1) 0%, ${colors.bgCard} 65%)` } },
          div(
            cn(padding("28px").display("flex").flexDirection("column")),
            div(
              cn(display("flex").alignItems("baseline").gap("4px")),
              span(cn(fontSize("56px").fontWeight("800").lineHeight("1").color(colors.primary)), "0"),
              span(cn(fontSize("18px").fontWeight("600").color(colors.textDim)), "deps")
            ),
            div(
              cn(marginTop("20px")),
              h3(cn(fontSize("17px").fontWeight("600").color(colors.text).marginBottom("6px")), "Zero Dependencies"),
              p(cn(fontSize("13px").color(colors.textMuted).lineHeight("1.7")), "No third-party packages. Pure DOM, pure performance.")
            )
          )
        ),

        // TILE 3: Live Counter Demo
        div(
          bentoCell,
          div(
            cn(
              padding("12px 20px").borderBottom(`1px solid ${colors.border}`)
                .display("flex").alignItems("center").justifyContent("space-between")
            ),
            span(
              cn(fontSize("11px").fontWeight("700").color(colors.textDim)
                .textTransform("uppercase").letterSpacing("0.08em")),
              "Live Demo"
            ),
            span(
              cn(
                display("inline-flex").alignItems("center").gap("5px")
                  .padding("3px 10px").borderRadius("99px")
                  .backgroundColor("rgba(132, 204, 22, 0.1)")
                  .fontSize("11px").fontWeight("600").color(colors.primary)
              ),
              span(cn(width("6px").height("6px").borderRadius("50%").backgroundColor(colors.primary).display("block"))),
              "Interactive"
            )
          ),
          HeroDemo()
        ),

        // TILE 4: TypeScript-First
        div(
          bentoCell,
          div(
            cn(padding("28px")),
            div(
              cn(
                display("inline-flex").alignItems("center").justifyContent("center")
                  .width("44px").height("44px").borderRadius("12px").marginBottom("16px")
              ),
              { style: { background: "linear-gradient(135deg, rgba(130, 170, 255, 0.2), rgba(130, 170, 255, 0.05))", border: "1px solid rgba(130, 170, 255, 0.25)" } },
              span(cn(fontSize("22px")), "⚡")
            ),
            h3(cn(fontSize("17px").fontWeight("600").color(colors.text).marginBottom("8px")), "TypeScript-First"),
            p(cn(fontSize("13px").color(colors.textMuted).lineHeight("1.7")), "Full type definitions for 140+ HTML and SVG tags. Catch errors at compile time, not runtime.")
          )
        ),

        // TILE 5: 140+ Tags
        div(
          bentoCellCyan,
          { style: { background: `linear-gradient(145deg, rgba(34, 211, 238, 0.1) 0%, ${colors.bgCard} 65%)` } },
          div(
            cn(padding("28px")),
            div(
              cn(display("flex").alignItems("baseline").gap("2px")),
              span(cn(fontSize("52px").fontWeight("800").lineHeight("1").color(colors.accentSecondary)), "140"),
              span(cn(fontSize("26px").fontWeight("800").color(colors.accentSecondary)), "+")
            ),
            h3(cn(fontSize("17px").fontWeight("600").color(colors.text).marginBottom("6px").marginTop("16px")), "HTML & SVG Tags"),
            p(cn(fontSize("13px").color(colors.textMuted).lineHeight("1.6")), "Every standard element as a global builder function. No imports needed.")
          )
        ),

        // TILE 6: Fine-Grained Updates
        div(
          bentoCell,
          div(
            cn(padding("28px")),
            div(
              cn(
                display("inline-flex").alignItems("center").justifyContent("center")
                  .width("44px").height("44px").borderRadius("12px").marginBottom("16px")
              ),
              { style: { background: "linear-gradient(135deg, rgba(132, 204, 22, 0.2), rgba(132, 204, 22, 0.05))", border: `1px solid ${colors.borderGlow}` } },
              span(cn(fontSize("22px")), "🎯")
            ),
            h3(cn(fontSize("17px").fontWeight("600").color(colors.text).marginBottom("8px")), "Fine-Grained Updates"),
            p(cn(fontSize("13px").color(colors.textMuted).lineHeight("1.7")), "Only updates what changed. Elements are reused, branches preserved, performance maximized.")
          )
        )
      )
    ),

    // ── INSTALL BAR ───────────────────────────────────────────────────────
    section(
      cn(
        padding("0 24px 80px").maxWidth("1200px").margin("0 auto"),
        { medium: padding("0 48px 80px") }
      ),
      div(
        cn(
          backgroundColor(colors.bgCode).borderRadius("16px")
            .border(`1px solid ${colors.border}`)
            .padding("24px 32px")
            .display("flex").alignItems("center")
            .justifyContent("space-between").flexWrap("wrap").gap("16px")
        ),
        { style: s.glowBoxStyle },
        div(
          p(
            cn(fontSize("11px").color(colors.textDim).marginBottom("8px").fontWeight("600")
              .textTransform("uppercase").letterSpacing("0.08em")),
            "Install via npm"
          ),
          span(
            cn(fontSize("20px").fontWeight("600").color(colors.primary)),
            { style: { fontFamily: "'Courier New', Courier, monospace" } },
            "npm install nuclo"
          )
        ),
        button(
          cn(
            padding("10px 24px").backgroundColor(colors.primary).color(colors.bg)
              .borderRadius("8px").fontWeight("600").fontSize("14px").border("none")
              .cursor("pointer").transition("all 0.2s"),
            { hover: backgroundColor(colors.primaryHover).transform("translateY(-1px)") }
          ),
          "Get Started →",
          on("click", () => setRoute("getting-started"))
        )
      )
    ),

    // ── QUICK START ───────────────────────────────────────────────────────
    section(
      s.section,
      h2(s.sectionTitle, "Quick Start"),
      p(s.sectionSubtitle, "Up and running in 30 seconds."),
      div(
        cn(
          display("grid").gap("16px").gridTemplateColumns("1fr"),
          { medium: gridTemplateColumns("repeat(3, 1fr)").gap("20px") }
        ),
        div(
          cn(backgroundColor(colors.bgCard).borderRadius("16px").border(`1px solid ${colors.border}`).padding("24px")),
          span(cn(fontSize("11px").fontWeight("700").color(colors.primary)
            .textTransform("uppercase").letterSpacing("0.08em").display("block").marginBottom("16px")), "Step 1"),
          h3(cn(fontSize("17px").fontWeight("600").color(colors.text).marginBottom("16px")), "Install"),
          CodeBlock("npm install nuclo", "bash", false)
        ),
        div(
          cn(backgroundColor(colors.bgCard).borderRadius("16px").border(`1px solid ${colors.border}`).padding("24px")),
          span(cn(fontSize("11px").fontWeight("700").color(colors.primary)
            .textTransform("uppercase").letterSpacing("0.08em").display("block").marginBottom("16px")), "Step 2"),
          h3(cn(fontSize("17px").fontWeight("600").color(colors.text).marginBottom("16px")), "Import & Use"),
          CodeBlock(`import 'nuclo';

const app = div(
  h1('Hello, Nuclo!'),
  p('Building UIs made simple.')
);

render(app, document.body);`, "typescript", false)
        ),
        div(
          cn(backgroundColor(colors.bgCard).borderRadius("16px").border(`1px solid ${colors.border}`).padding("24px")),
          span(cn(fontSize("11px").fontWeight("700").color(colors.primary)
            .textTransform("uppercase").letterSpacing("0.08em").display("block").marginBottom("16px")), "Step 3"),
          h3(cn(fontSize("17px").fontWeight("600").color(colors.text).marginBottom("16px")), "TypeScript"),
          CodeBlock(`// tsconfig.json
{
  "compilerOptions": {
    "types": ["nuclo/types"]
  }
}`, "json", false)
        )
      )
    ),

    // ── CORE CONCEPTS ─────────────────────────────────────────────────────
    section(
      s.section,
      h2(s.sectionTitle, "Core Concepts"),
      p(s.sectionSubtitle, "Explicit updates, reactive functions, conditionals, and list synchronization."),
      div(
        cn(
          display("grid").gap("16px").gridTemplateColumns("1fr"),
          {
            medium: gridTemplateColumns("repeat(2, 1fr)").gap("20px"),
            large: gridTemplateColumns("repeat(3, 1fr)")
          }
        ),
        div(
          cn(backgroundColor(colors.bgCard).borderRadius("16px").border(`1px solid ${colors.border}`).padding("24px")),
          h3(cn(fontSize("13px").fontWeight("700").color(colors.textMuted).marginBottom("16px")
            .textTransform("uppercase").letterSpacing("0.06em")), "Batch Updates"),
          CodeBlock(gettingStartedCode.batchUpdates.code, gettingStartedCode.batchUpdates.lang, false)
        ),
        div(
          cn(backgroundColor(colors.bgCard).borderRadius("16px").border(`1px solid ${colors.border}`).padding("24px")),
          h3(cn(fontSize("13px").fontWeight("700").color(colors.textMuted).marginBottom("16px")
            .textTransform("uppercase").letterSpacing("0.06em")), "Reactive Functions"),
          CodeBlock(gettingStartedCode.reactiveText.code, gettingStartedCode.reactiveText.lang, false)
        ),
        div(
          cn(backgroundColor(colors.bgCard).borderRadius("16px").border(`1px solid ${colors.border}`).padding("24px")),
          h3(cn(fontSize("13px").fontWeight("700").color(colors.textMuted).marginBottom("16px")
            .textTransform("uppercase").letterSpacing("0.06em")), "CSS-in-JS"),
          CodeBlock(stylingCode.overviewQuickExample.code, stylingCode.overviewQuickExample.lang, false)
        ),
        div(
          cn(backgroundColor(colors.bgCard).borderRadius("16px").border(`1px solid ${colors.border}`).padding("24px")),
          h3(cn(fontSize("13px").fontWeight("700").color(colors.textMuted).marginBottom("16px")
            .textTransform("uppercase").letterSpacing("0.06em")), "Conditionals"),
          CodeBlock(`when(() => user.isAdmin,
  div('Admin Panel')
).when(() => user.isLoggedIn,
  div('Dashboard')
).else(
  div('Please log in')
);`, "typescript", false)
        ),
        div(
          cn(backgroundColor(colors.bgCard).borderRadius("16px").border(`1px solid ${colors.border}`).padding("24px")),
          h3(cn(fontSize("13px").fontWeight("700").color(colors.textMuted).marginBottom("16px")
            .textTransform("uppercase").letterSpacing("0.06em")), "List Sync"),
          CodeBlock(`list(() => items, (item, index) =>
  div(() => \`\${index}: \${item.name}\`)
);`, "typescript", false)
        )
      )
    ),

    // ── EXAMPLES PREVIEW ──────────────────────────────────────────────────
    section(
      s.section,
      h2(s.sectionTitle, "Examples"),
      p(s.sectionSubtitle, "Practical examples with interactive live demos."),
      div(
        cn(
          display("grid").gap("16px").gridTemplateColumns("1fr"),
          {
            medium: gridTemplateColumns("repeat(2, 1fr)").gap("20px"),
            large: gridTemplateColumns("repeat(3, 1fr)")
          }
        ),
        ...previewExamples.map((example) =>
          div(
            cn(
              backgroundColor(colors.bgCard).borderRadius("16px")
                .border(`1px solid ${colors.border}`)
                .padding("24px").cursor("pointer").transition("all 0.2s"),
              { hover: border(`1px solid ${colors.primary}`).transform("translateY(-2px)").boxShadow("0 8px 24px rgba(0,0,0,0.15)") }
            ),
            h3(cn(fontSize("16px").fontWeight("600").color(colors.text).marginBottom("10px")), example.title),
            p(cn(fontSize("13px").color(colors.textMuted).lineHeight("1.7").marginBottom("20px")), example.description),
            span(
              cn(fontSize("13px").fontWeight("600").color(colors.primary)
                .display("inline-flex").alignItems("center").gap("4px")),
              "View Example →"
            ),
            on("click", () => goToExample(example.id))
          )
        )
      ),
      div(
        cn(textAlign("center").marginTop("40px")),
        button(
          cn(
            padding("12px 32px").backgroundColor("transparent").color(colors.text)
              .borderRadius("10px").fontWeight("600").fontSize("15px")
              .border(`1px solid ${colors.borderLight}`).transition("all 0.2s"),
            { hover: border(`1px solid ${colors.primary}`).color(colors.primary) }
          ),
          "View All Examples →",
          on("click", () => setRoute("examples"))
        )
      )
    )
  );
}
