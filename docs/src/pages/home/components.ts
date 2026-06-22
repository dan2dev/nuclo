import { css, colors, cx, s } from "../../styles.ts";
import { fx } from "../../styles/effects.ts";
import { hs } from "./styles.ts";
import {
  HERO_BADGE, HERO_TITLE_LINES, HERO_DESC, INSTALL_CMD, HERO_STATS,
  HERO_CODE, COUNTER_TEASER_CODE, TODO_TEASER_CODE,
  PHILOSOPHY_QUOTE, PHILOSOPHY_POINTS,
  FEATURES, QUICK_START_STEPS,
  PIPELINE_STEPS,
  COMPARISON_TITLE, COMPARISON_SUB, COMPARISON_COLS,
  CTA_TITLE, CTA_SUB,
} from "./content.ts";
import { CodeBlock } from "../../components/CodeBlock.ts";
import { copyText } from "../../components/clipboard.ts";
import {
  GitHubSvg, CheckIcon, MinusIcon, CopyIcon,
  ZapIcon, FeatherIcon, BracesIcon, TargetIcon,
} from "../../components/icons.ts";
import { setRoute } from "../../router.ts";

function DemoDot(color: string) {
  return div(hs.heroDot, css({ backgroundColor: color }));
}

/** Install command bar with shimmer sheen and a copy-to-clipboard button. */
function InstallCommand() {
  let copied = false;

  function handleCopy() {
    copyText(INSTALL_CMD).then((ok) => {
      if (!ok) return;
      copied = true;
      update();
      setTimeout(() => { copied = false; update(); }, 1800);
    });
  }

  return div(
    s.installCmd,
    fx.shimmer,
    span(css({ color: colors.textMuted, fontFamily: "'JetBrains Mono', monospace" }), "$"),
    span(INSTALL_CMD),
    button(
      hs.heroCopyBtn,
      { title: "Copy to clipboard", "aria-label": "Copy install command" },
      { class: () => cx(hs.heroCopyBtn, copied ? css({ color: colors.primary }) : null).className },
      when(() => copied, CheckIcon({ size: 14 })).else(CopyIcon({ size: 14 })),
      on("click", handleCopy),
    ),
  );
}

function HeroDemoCard() {
  let activeTab: 'preview' | 'code' = 'preview';

  // Live counter state inside the demo
  let count = 0;
  let updateCalls = 0;

  function bump(fn: () => void) {
    return () => { fn(); updateCalls++; update(); };
  }

  function CounterPreview() {
    return div(
      css({ textAlign: "center", width: "100%" }),
      div(
        fx.gradientText,
        css({ fontSize: "5.2rem", fontWeight: "700", lineHeight: "1", marginBottom: "6px", fontVariantNumeric: "tabular-nums" }),
        () => String(count),
      ),
      div(
        css({ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: colors.textMuted, letterSpacing: "0.14em", marginBottom: "26px" }),
        "COUNT",
      ),
      div(
        css({ display: "flex", gap: "10px", justifyContent: "center" }),
        button(
          css({ padding: "9px 22px", borderRadius: "7px", fontSize: "0.875rem", fontWeight: "600", cursor: "pointer", border: `1px solid ${colors.borderLight}`, color: colors.textDim, backgroundColor: colors.bgSecondary, transition: "all 0.18s ease", fontFamily: "'Space Grotesk', system-ui, sans-serif", hover: { color: colors.text, borderColor: colors.primary } }),
          "−",
          on("click", bump(() => { count--; })),
        ),
        button(
          css({ padding: "9px 22px", borderRadius: "7px", fontSize: "0.875rem", fontWeight: "600", cursor: "pointer", border: `1px solid transparent`, color: "#fff", backgroundColor: colors.primary, transition: "all 0.18s ease", fontFamily: "'Space Grotesk', system-ui, sans-serif", hover: { backgroundColor: colors.primaryHover } }),
          "Reset",
          on("click", bump(() => { count = 0; })),
        ),
        button(
          css({ padding: "9px 22px", borderRadius: "7px", fontSize: "0.875rem", fontWeight: "600", cursor: "pointer", border: `1px solid ${colors.borderLight}`, color: colors.textDim, backgroundColor: colors.bgSecondary, transition: "all 0.18s ease", fontFamily: "'Space Grotesk', system-ui, sans-serif", hover: { color: colors.text, borderColor: colors.primary } }),
          "+",
          on("click", bump(() => { count++; })),
        ),
      ),
      div(
        hs.demoMeta,
        span(css({ color: colors.primary }), "update()"),
        span(" calls: "),
        span(() => String(updateCalls)),
      ),
    );
  }

  function Tab(label: string, tab: 'preview' | 'code') {
    return button(
      hs.demoTabBtn,
      { class: () => cx(hs.demoTabBtn, activeTab === tab ? hs.demoTabBtnActive : null).className },
      label,
      on("click", () => { activeTab = tab; update(); }),
    );
  }

  return div(
    hs.heroDemoArea,
    fx.gradientBorder, fx.demoElevated, { className: "he he-7" },
    // Chrome bar
    div(
      hs.demoChrome,
      DemoDot("#ff5f57"),
      DemoDot("#febc2e"),
      DemoDot("#28c840"),
      div(hs.heroDemoFilename, "counter.ts"),
      span(hs.liveTag, span(fx.badgeDot), "live"),
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
      { class: () => cx(hs.demoPreviewPane, activeTab === "preview" ? null : hs.paneHidden).className },
      CounterPreview(),
    ),
    div(
      hs.demoCodePane,
      { class: () => cx(hs.demoCodePane, activeTab === "code" ? null : hs.paneHidden).className },
      { innerHTML: `<pre class="${hs.preWrap.className}">${HERO_CODE}</pre>` },
    ),
  );
}

export function HomeHeroSection() {
  return section(
    hs.heroSection,
    hs.heroWrap,
    // Ambient ornaments (decorative, behind content)
    div(hs.heroBg, { "aria-hidden": "true" }),
    div(hs.dotGrid, { "aria-hidden": "true" }),
    div(hs.heroOrbC, { "aria-hidden": "true" }),
    div(
      s.container,
      div(
        hs.heroInner,
        // Left: copy
        div(
          // Badge
          div(
            s.badge,
            fx.shimmer, { className: "he he-1" },
            css({ marginBottom: "22px" }),
            span(fx.badgeDot),
            HERO_BADGE,
          ),
          // Rule
          div(hs.heroRule, { className: "he he-2" }),
          // Title
          h1(
            hs.heroTitle,
            { className: "he he-2" },
            ...HERO_TITLE_LINES.map((line) => {
              // "Call update()." gets styled update() code
              if (line.includes("update()")) {
                return div(
                  line.replace("Call update().", "Call "),
                  code(
                    css({ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85em", color: colors.primaryHover, backgroundColor: colors.bgLight, padding: "1px 8px", borderRadius: "6px" }),
                    "update()",
                  ),
                  ".",
                );
              }
              if (line === "Done.") {
                return div(span(fx.gradientText, line));
              }
              return div(line);
            }),
          ),
          // Description
          p(hs.heroDesc, { className: "he he-3" }, HERO_DESC),
          // Install command
          div(hs.heroInstall, { className: "he he-4" }, InstallCommand()),
          // Action buttons
          div(
            hs.heroActions,
            { className: "he he-5" },
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
            hs.statsRow,
            { className: "he he-6" },
            ...HERO_STATS.map(({ num, sup, label }) =>
              div(
                hs.statItem,
                div(
                  hs.statNum,
                  num,
                  sup ? span(css({ fontSize: "1rem", color: colors.primary, marginLeft: "2px" }), sup) : null,
                ),
                div(hs.statLabel, label),
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

export function PipelineSection() {
  function PipeNode(step: typeof PIPELINE_STEPS[number], revealClass: string) {
    return div(
      hs.pipeNode,
      { className: `${hs.pipeNode.className} ${revealClass}` },
      div(hs.pipeKicker, step.kicker),
      div(hs.pipeTitle, step.title),
      div(hs.pipeDesc, step.desc),
      div(hs.pipeCode, { innerHTML: step.code }),
    );
  }

  return section(
    hs.pipelineSection,
    div(
      s.container,
      div(s.sectionLabel, { className: "rv" }, "How it works"),
      h2(s.sectionTitle, { className: "rv" }, "One explicit cycle."),
      p(s.sectionSub, { className: "rv" }, "No reactivity graph, no scheduler, no surprises. A single predictable path from your data to the screen."),
      div(
        hs.pipe,
        PipeNode(PIPELINE_STEPS[0], "rv rv-d1"),
        div(hs.pipeLink, { className: "rv rv-d1", "aria-hidden": "true" }),
        PipeNode(PIPELINE_STEPS[1], "rv rv-d2"),
        div(hs.pipeLink, { className: "rv rv-d2", "aria-hidden": "true" }),
        PipeNode(PIPELINE_STEPS[2], "rv rv-d3"),
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
          { className: "rv" },
          div(
            s.sectionLabel,
            css({ marginBottom: "16px" }),
            "Philosophy",
          ),
          blockquote(
            hs.philosophyQuote,
            css({ fontStyle: "normal" }),
            span(hs.philosophyMark, { "aria-hidden": "true" }, "“"),
            PHILOSOPHY_QUOTE,
          ),
        ),
        // Right: 3 points
        div(
          hs.philosophyPoints,
          ...PHILOSOPHY_POINTS.map(({ num, title, desc }, i) =>
            div(
              hs.philosophyPoint,
              { className: `rv rv-d${i + 1}` },
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

const FEATURE_ICONS: Record<string, () => ReturnType<typeof svgSvg>> = {
  zap: () => ZapIcon({ size: 18 }),
  feather: () => FeatherIcon({ size: 18 }),
  braces: () => BracesIcon({ size: 18 }),
  target: () => TargetIcon({ size: 18 }),
};

export function FeaturesSection() {
  return section(
    hs.featuresSection,
    div(
      s.container,
      div(s.sectionLabel, { className: "rv" }, "Features"),
      h2(s.sectionTitle, { className: "rv" }, "Built for clarity."),
      p(s.sectionSub, { className: "rv" }, css({ marginBottom: "48px" }), "No magic. No surprises. Every update is intentional."),
      div(
        s.featureGrid,
        { className: "rv" },
        ...FEATURES.map(({ num, icon, title, desc }) =>
          div(
            s.featureCard,
            div(hs.featureIcon, (FEATURE_ICONS[icon] ?? FEATURE_ICONS.zap)()),
            div(s.featureNum, num),
            div(s.featureTitle, title),
            div(s.featureDesc, desc),
          )
        ),
      ),
    ),
  );
}

export function ComparisonSection() {
  return section(
    hs.comparisonSection,
    div(
      s.container,
      div(s.sectionLabel, { className: "rv" }, "Comparison"),
      h2(s.sectionTitle, { className: "rv" }, COMPARISON_TITLE),
      p(s.sectionSub, { className: "rv" }, COMPARISON_SUB),
      div(
        hs.cmpGrid,
        ...COMPARISON_COLS.map((col, i) =>
          div(
            hs.cmpCol,
            { className: `${cx(hs.cmpCol, col.featured ? hs.cmpColFeatured : null).className} rv rv-d${i + 1}` },
            div(
              hs.cmpHead,
              div(hs.cmpName, col.name),
              col.featured ? span(hs.cmpBadge, span(fx.badgeDot), "the nuclo way") : null,
            ),
            div(hs.cmpSub, col.sub),
            ...col.items.map((item) =>
              div(
                hs.cmpLi,
                item.good ? hs.cmpLiGood : hs.cmpLiDim,
                item.good ? CheckIcon({ size: 13 }) : MinusIcon({ size: 13 }),
                span(item.text),
              )
            ),
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
        div(s.sectionLabel, { className: "rv" }, "Quick Start"),
        h2(s.sectionTitle, { className: "rv" }, "Up and running in minutes."),
        p(s.sectionSub, { className: "rv" }, css({ marginBottom: "40px" }), "Three steps and you're building real UIs."),
        div(
          s.stepsGrid,
          ...QUICK_START_STEPS.map(({ num, title, desc, code, lang }, i) =>
            div(
              hs.quickStartStep,
              { className: `rv rv-d${i + 1}` },
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
          css({ marginTop: "40px", textAlign: "center" }),
          { className: "rv" },
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
    extraClass: string,
  ) {
    let activeTab: 'preview' | 'code' = 'preview';

    function Tab(label: string, tab: 'preview' | 'code') {
      return button(
        hs.demoTabBtn,
        { class: () => cx(hs.demoTabBtn, activeTab === tab ? hs.demoTabBtnActive : null).className },
        label,
        on("click", () => { activeTab = tab; update(); }),
      );
    }

    return div(
      hs.teaserCard,
      { className: extraClass },
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
        { class: () => cx(hs.teaserDemoPane, activeTab === "preview" ? null : hs.paneHidden).className },
        PreviewFn(),
      ),
      div(
        hs.teaserCodePane,
        { class: () => cx(hs.teaserCodePane, activeTab === "code" ? null : hs.paneHidden).className },
        { innerHTML: `<pre class="${hs.preWrap.className}">${code}</pre>` },
      ),
    );
  }

  function CounterPreview() {
    let n = 0;
    return div(
      css({ textAlign: "center" }),
      div(fx.gradientText, css({ fontSize: "3rem", fontWeight: "700", lineHeight: "1", marginBottom: "12px", fontVariantNumeric: "tabular-nums" }), () => String(n)),
      div(
        css({ display: "flex", gap: "8px", justifyContent: "center" }),
        button(
          css({ padding: "7px 16px", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", border: `1px solid ${colors.borderLight}`, color: colors.textDim, backgroundColor: colors.bgLight, fontFamily: "inherit" }),
          "−", on("click", () => { n--; update(); })
        ),
        button(
          css({ padding: "7px 16px", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", border: "none", color: "#fff", backgroundColor: colors.primary, fontFamily: "inherit" }),
          "Reset", on("click", () => { n = 0; update(); })
        ),
        button(
          css({ padding: "7px 16px", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", border: `1px solid ${colors.borderLight}`, color: colors.textDim, backgroundColor: colors.bgLight, fontFamily: "inherit" }),
          "+", on("click", () => { n++; update(); })
        ),
      ),
    );
  }

  function TodoPreview() {
    let todos: { text: string; done: boolean }[] = [];
    let inputValue = "";
    let domInput: HTMLInputElement | null = null;

    function addTodo() {
      const v = inputValue.trim();
      if (!v) return;
      todos.push({ text: v, done: false });
      inputValue = "";
      if (domInput) domInput.value = "";
      update();
    }

    return div(
      css({ width: "100%", maxWidth: "280px" }),
      div(
        css({ display: "flex", gap: "8px", marginBottom: "10px" }),
        input(
          css({ flex: "1", padding: "9px 13px", borderRadius: "6px", border: `1px solid ${colors.borderLight}`, backgroundColor: colors.bgSecondary, color: colors.text, fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: "0.875rem", outline: "none", marginBottom: "10px", width: "100%", focus: { borderColor: colors.primary } }),
          {
            type: "text",
            placeholder: "Add a task…",
          },
          on("input", (e) => { inputValue = (e.target as HTMLInputElement).value; }),
          on("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter") addTodo(); }),
          ((el: any) => { domInput = el; }) as any,
        ),
        button(
          css({ padding: "9px 14px", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", border: "none", color: "#fff", backgroundColor: colors.primary, fontFamily: "inherit", whiteSpace: "nowrap" }),
          "Add",
          on("click", addTodo),
        ),
      ),
      list(
        () => todos,
        (t) => div(
          css({ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "5px", border: `1px solid ${colors.border}`, backgroundColor: colors.bgSecondary, marginBottom: "5px", fontSize: "0.85rem" }),
          input({ type: "checkbox" }, { checked: () => t.done }, on("change", () => { t.done = !t.done; update(); })),
          span(
            css({ transition: "opacity 0.18s ease" }),
            { class: () => t.done ? css({ textDecoration: "line-through", opacity: "0.5" }).className : "" },
            t.text,
          ),
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
        div(s.sectionLabel, { className: "rv" }, "Examples"),
        h2(s.sectionTitle, { className: "rv" }, "See it in action."),
        p(s.sectionSub, { className: "rv" }, "Interactive demos. Explore the code behind each one."),
        div(
          hs.examplesTeaserGrid,
          TeaserCard("counter.ts", COUNTER_TEASER_CODE, CounterPreview, "rv rv-d1"),
          TeaserCard("todo.ts", TODO_TEASER_CODE, TodoPreview, "rv rv-d2"),
        ),
        div(
          css({ marginTop: "36px", textAlign: "center" }),
          { className: "rv" },
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
      div(
        hs.ctaPanel, { className: "rv" },
        div(s.sectionLabel, css({ justifyContent: "center", display: "flex" }), "Get Started"),
        h2(
          css({ fontSize: "2.1rem", fontWeight: "700", letterSpacing: "-0.01em", lineHeight: "1.2", marginBottom: "18px", medium: { fontSize: "2.7rem" } }),
          CTA_TITLE,
        ),
        p(
          css({ fontSize: "1.05rem", color: colors.textDim, maxWidth: "520px", margin: "0 auto 0", lineHeight: "1.7" }),
          CTA_SUB,
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
        div(hs.ctaInstall, InstallCommand()),
      ),
    ),
  );
}
