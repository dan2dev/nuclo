import { cn, colors, s } from "../../styles.ts";
import { hs } from "./styles.ts";
import {
  HERO_BADGE, HERO_TITLE_LINES, HERO_DESC, INSTALL_CMD, HERO_STATS,
  HERO_CODE, COUNTER_TEASER_CODE, TODO_TEASER_CODE,
  PHILOSOPHY_QUOTE, PHILOSOPHY_POINTS,
  FEATURES, QUICK_START_STEPS,
} from "./content.ts";
import { CodeBlock } from "../../components/CodeBlock.ts";
import { GitHubSvg } from "../../components/icons.ts";
import { setRoute } from "../../router.ts";

function DemoDot(color: string) {
  return div(hs.heroDot, { style: `background:${color}` });
}

function HeroDemoCard() {
  let activeTab: 'preview' | 'code' = 'preview';

  // Live counter state inside the demo
  let count = 0;

  function CounterPreview() {
    return div(
      cn(textAlign("center").width("100%")),
      div(
        cn(
          fontSize("5rem").fontWeight("700").lineHeight("1").color(colors.text)
            .marginBottom("6px").fontVariantNumeric("tabular-nums")
            .transition("transform 0.1s ease")
        ),
        () => String(count),
      ),
      div(
        cn(fontSize("0.78rem").color(colors.textMuted).letterSpacing("0.05em").marginBottom("24px")),
        "COUNT",
      ),
      div(
        cn(display("flex").gap("10px").justifyContent("center")),
        button(
          cn(
            padding("9px 22px").borderRadius("6px")
              .fontSize("0.875rem").fontWeight("600").cursor("pointer")
              .border(`1px solid ${colors.borderLight}`).color(colors.textDim)
              .backgroundColor(colors.bgSecondary).transition("all 0.18s ease")
              .fontFamily("'Space Grotesk', system-ui, sans-serif"),
            { hover: color(colors.text).borderColor(colors.primary) }
          ),
          "−",
          on("click", () => { count--; update(); }),
        ),
        button(
          cn(
            padding("9px 22px").borderRadius("6px")
              .fontSize("0.875rem").fontWeight("600").cursor("pointer")
              .border(`1px solid transparent`).color("#fff")
              .backgroundColor(colors.primary).transition("all 0.18s ease")
              .fontFamily("'Space Grotesk', system-ui, sans-serif"),
            { hover: backgroundColor(colors.primaryHover) }
          ),
          "Reset",
          on("click", () => { count = 0; update(); }),
        ),
        button(
          cn(
            padding("9px 22px").borderRadius("6px")
              .fontSize("0.875rem").fontWeight("600").cursor("pointer")
              .border(`1px solid ${colors.borderLight}`).color(colors.textDim)
              .backgroundColor(colors.bgSecondary).transition("all 0.18s ease")
              .fontFamily("'Space Grotesk', system-ui, sans-serif"),
            { hover: color(colors.text).borderColor(colors.primary) }
          ),
          "+",
          on("click", () => { count++; update(); }),
        ),
      ),
    );
  }

  function Tab(label: string, tab: 'preview' | 'code') {
    return button(
      hs.demoTabBtn,
      { style: () => ({ color: activeTab === tab ? "var(--c-primary)" : "", borderBottom: activeTab === tab ? "2px solid var(--c-primary)" : "" }) },
      label,
      on("click", () => { activeTab = tab; update(); }),
    );
  }

  return div(
    s.demoCard,
    hs.heroDemoArea,
    // Chrome bar
    div(
      hs.demoChrome,
      DemoDot("#ff5f57"),
      DemoDot("#febc2e"),
      DemoDot("#28c840"),
      div(hs.heroDemoFilename, "counter.ts"),
    ),
    // Tabs
    div(
      hs.demoTabBar,
      Tab("Preview", "preview"),
      Tab("Code", "code"),
    ),
    // Panes
    div(
      hs.demoPreviewPane,
      { style: () => ({ display: activeTab === "preview" ? "" : "none" }) },
      CounterPreview(),
    ),
    div(
      hs.demoCodePane,
      { style: () => ({ display: activeTab === "code" ? "" : "none" }) },
      { innerHTML: `<pre style="margin:0;white-space:pre-wrap">${HERO_CODE}</pre>` },
    ),
  );
}

export function HomeHeroSection() {
  return section(
    hs.heroSection,
    div(
      s.container,
      div(
        hs.heroInner,
        // Left: copy
        div(
          // Badge
          div(
            s.badge,
            cn(marginBottom("22px")),
            HERO_BADGE,
          ),
          // Rule
          div(hs.heroRule),
          // Title
          h1(
            hs.heroTitle,
            ...HERO_TITLE_LINES.map((line, _i) => {
              // "Call update()." gets styled update() code
              if (line.includes("update()")) {
                return div(
                  line.replace("Call update().", "Call "),
                  code(
                    cn(
                      fontFamily("'JetBrains Mono', monospace")
                        .fontSize("0.85em").color(colors.primaryHover)
                        .backgroundColor(colors.bgLight)
                        .padding("1px 6px").borderRadius("4px")
                    ),
                    "update()",
                  ),
                  ".",
                );
              }
              return div(line);
            }),
          ),
          // Description
          p(hs.heroDesc, HERO_DESC),
          // Install command
          div(
            hs.heroInstall,
            div(
              s.installCmd,
              span(cn(color(colors.textMuted).fontFamily("'JetBrains Mono', monospace")), "$"),
              span(cn(marginLeft("8px")), INSTALL_CMD),
            ),
          ),
          // Action buttons
          div(
            hs.heroActions,
            button(
              s.btn, s.btnPrimary,
              "Get Started →",
              on("click", () => setRoute("docs")),
            ),
            button(
              s.btn, s.btnSecondary,
              "View Examples",
              on("click", () => setRoute("examples")),
            ),
          ),
          // Stats
          div(
            s.statsRow,
            ...HERO_STATS.map(({ num, sup, label }) =>
              div(
                div(
                  s.statNum,
                  num,
                  sup ? span(cn(fontSize("1rem").color(colors.primary)), sup) : null,
                ),
                div(s.statLabel, label),
              )
            ),
          ),
        ),
        // Right: demo card
        HeroDemoCard(),
      ),
    ),
  );
}

export function PhilosophySection() {
  return section(
    hs.philosophySection,
    div(
      s.container,
      div(
        hs.philosophyInner,
        // Left: quote + label
        div(
          div(
            s.sectionLabel,
            cn(marginBottom("16px")),
            "Philosophy",
          ),
          blockquote(
            hs.philosophyQuote,
            { style: "font-style:normal" },
            `"${PHILOSOPHY_QUOTE}"`,
          ),
        ),
        // Right: 3 points
        div(
          hs.philosophyPoints,
          ...PHILOSOPHY_POINTS.map(({ num, title, desc }) =>
            div(
              hs.philosophyPoint,
              div(hs.philosophyPointIcon, num),
              div(
                div(hs.philosophyPointTitle, title),
                div(hs.philosophyPointDesc, desc),
              ),
            )
          ),
        ),
      ),
    ),
  );
}

export function FeaturesSection() {
  return section(
    hs.featuresSection,
    div(
      s.container,
      div(s.sectionLabel, "Features"),
      h2(s.sectionTitle, "Built for clarity."),
      p(s.sectionSub, cn(marginBottom("48px")), "No magic. No surprises. Every update is intentional."),
      div(
        s.featureGrid,
        ...FEATURES.map(({ num, title, desc }) =>
          div(
            s.featureCard,
            div(s.featureNum, num),
            div(s.featureTitle, title),
            div(s.featureDesc, desc),
          )
        ),
      ),
    ),
  );
}

export function HomeQuickStartSection() {
  return div(
    div(s.divider),
    section(
      hs.quickStartSection,
      div(
        s.container,
        div(s.sectionLabel, "Quick Start"),
        h2(s.sectionTitle, "Up and running in minutes."),
        p(s.sectionSub, cn(marginBottom("40px")), "Three steps and you're building real UIs."),
        div(
          s.stepsGrid,
          ...QUICK_START_STEPS.map(({ num, title, desc, code, lang }) =>
            div(
              hs.quickStartStep,
              div(
                hs.stepHeader,
                div(s.stepNum, num),
                div(s.stepTitle, title),
                div(s.stepDesc, desc),
              ),
              CodeBlock({ filename: lang, code, showCopy: true, preTokenized: true }),
            )
          ),
        ),
        div(
          cn(marginTop("40px").textAlign("center")),
          button(
            s.btn, s.btnSecondary,
            "Read the full docs →",
            on("click", () => setRoute("docs")),
          ),
        ),
      ),
    ),
  );
}

export function ExamplesTeaserSection() {
  function TeaserCard(
    filename: string,
    code: string,
    PreviewFn: () => ReturnType<typeof div>,
  ) {
    let activeTab: 'preview' | 'code' = 'preview';

    function Tab(label: string, tab: 'preview' | 'code') {
      return button(
        hs.demoTabBtn,
        { style: () => ({ color: activeTab === tab ? "var(--c-primary)" : "", borderBottom: activeTab === tab ? "2px solid var(--c-primary)" : "" }) },
        label,
        on("click", () => { activeTab = tab; update(); }),
      );
    }

    return div(
      hs.teaserCard,
      div(
        hs.demoChrome,
        DemoDot("#ff5f57"), DemoDot("#febc2e"), DemoDot("#28c840"),
        div(hs.heroDemoFilename, filename),
      ),
      div(
        hs.demoTabBar,
        Tab("Preview", "preview"),
        Tab("Code", "code"),
      ),
      div(
        hs.teaserDemoPane,
        { style: () => ({ display: activeTab === "preview" ? "" : "none" }) },
        PreviewFn(),
      ),
      div(
        hs.teaserCodePane,
        { style: () => ({ display: activeTab === "code" ? "" : "none" }) },
        { innerHTML: `<pre style="margin:0;white-space:pre-wrap">${code}</pre>` },
      ),
    );
  }

  function CounterPreview() {
    let n = 0;
    return div(
      cn(textAlign("center")),
      div(cn(fontSize("3rem").fontWeight("700").lineHeight("1").marginBottom("12px")), () => String(n)),
      div(
        cn(display("flex").gap("8px").justifyContent("center")),
        button(
          cn(padding("7px 16px").borderRadius("5px").fontSize("0.85rem").cursor("pointer").border(`1px solid ${colors.borderLight}`).color(colors.textDim).backgroundColor(colors.bgLight).fontFamily("inherit")),
          "−", on("click", () => { n--; update(); })
        ),
        button(
          cn(padding("7px 16px").borderRadius("5px").fontSize("0.85rem").cursor("pointer").border("none").color("#fff").backgroundColor(colors.primary).fontFamily("inherit")),
          "Reset", on("click", () => { n = 0; update(); })
        ),
        button(
          cn(padding("7px 16px").borderRadius("5px").fontSize("0.85rem").cursor("pointer").border(`1px solid ${colors.borderLight}`).color(colors.textDim).backgroundColor(colors.bgLight).fontFamily("inherit")),
          "+", on("click", () => { n++; update(); })
        ),
      ),
    );
  }

  function TodoPreview() {
    let todos: { text: string; done: boolean }[] = [];
    const inputEl = inputDom({
      type: "text", placeholder: "Add a task…",
      class: "ex-input",
      style: "margin-bottom:10px;width:100%",
    } as any);
    return div(
      cn(width("100%").maxWidth("280px")),
      div(
        cn(display("flex").gap("8px").marginBottom("10px")),
        inputEl,
        button(
          cn(padding("9px 14px").borderRadius("6px").fontSize("0.85rem").cursor("pointer").border("none").color("#fff").backgroundColor(colors.primary).fontFamily("inherit").whiteSpace("nowrap")),
          "Add",
          on("click", () => {
            const v = (inputEl as any as HTMLInputElement).value.trim();
            if (!v) return;
            todos.push({ text: v, done: false });
            (inputEl as any as HTMLInputElement).value = '';
            update();
          }),
        ),
      ),
      list(
        () => todos,
        (t) => div(
          cn(display("flex").alignItems("center").gap("8px").padding("7px 10px").borderRadius("5px").border(`1px solid ${colors.border}`).backgroundColor(colors.bgSecondary).marginBottom("5px").fontSize("0.85rem")),
          input({ type: "checkbox" }, { checked: () => t.done }, on("change", () => { t.done = !t.done; update(); })),
          span({ style: () => t.done ? "text-decoration:line-through;opacity:0.5" : "" }, t.text),
        ),
      ),
    );
  }

  return div(
    div(s.divider),
    section(
      hs.examplesTeaserSection,
      div(
        s.container,
        div(s.sectionLabel, "Examples"),
        h2(s.sectionTitle, "See it in action."),
        p(s.sectionSub, "Interactive demos. Explore the code behind each one."),
        div(
          hs.examplesTeaserGrid,
          TeaserCard("counter.ts", COUNTER_TEASER_CODE, CounterPreview),
          TeaserCard("todo.ts", TODO_TEASER_CODE, TodoPreview),
        ),
        div(
          cn(marginTop("36px").textAlign("center")),
          button(
            s.btn, s.btnSecondary,
            "View all examples →",
            on("click", () => setRoute("examples")),
          ),
        ),
      ),
    ),
  );
}

export function CTASection() {
  return section(
    hs.ctaSection,
    div(
      s.container,
      div(s.sectionLabel, cn(justifyContent("center").display("flex")), "Get Started"),
      h2(
        cn(
          fontSize("clamp(2rem, 3.5vw, 2.8rem)").fontWeight("700")
            .letterSpacing("-0.02em").lineHeight("1.2").marginBottom("18px")
        ),
        "Ready to build?",
      ),
      p(
        cn(
          fontSize("1.05rem").color(colors.textDim)
            .maxWidth("480px").margin("0 auto 0").lineHeight("1.7")
        ),
        "Start with the docs, explore the examples, or install and dive straight in.",
      ),
      div(
        hs.ctaActions,
        button(
          s.btn, s.btnPrimary,
          "Read the Docs →",
          on("click", () => setRoute("docs")),
        ),
        a(
          {
            href: "https://github.com/dan2dev/nuclo",
            target: "_blank",
            rel: "noopener noreferrer",
          },
          s.btn, s.btnSecondary,
          GitHubSvg({ size: 15 }),
          "GitHub",
        ),
      ),
    ),
  );
}

// Helper to create input DOM element (needed for TodoPreview ref pattern)
function inputDom(attrs: Record<string, string>) {
  return input(attrs);
}
