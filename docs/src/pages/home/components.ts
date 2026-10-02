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
  BENCHMARK_TITLE, BENCHMARK_SUB, BENCHMARK_NOTE,
  BENCHMARK_SOURCE_URL, BENCHMARK_SOURCE_LABEL, BENCHMARK_ENTRIES,
  CTA_TITLE, CTA_SUB,
} from "./content.ts";
import { CodeBlock, highlightCode, codeTokenStyle, terminalCodeTokenStyle } from "../../components/CodeBlock.ts";
import { copyText } from "../../components/clipboard.ts";
import { withCode } from "../../components/inline-code.ts";
import { GitHubSvg, CheckIcon, MinusIcon, CopyIcon } from "../../components/icons.ts";
import { setRoute } from "../../router.ts";

function DemoDot(color: string) {
  return div(
    hs.heroDot,
    css(`pages-home-components-demo-dot-${color.slice(1)}`, { backgroundColor: color }),
  );
}

/** Splits a "01 · Mutate" / "01 - INSTALL" step label into its number and its label text. */
function splitStepLabel(raw: string): { badge: string; kicker: string } {
  const m = raw.match(/^(\d+)\s*[-·]\s*(.+)$/);
  return m ? { badge: m[1], kicker: m[2] } : { badge: raw, kicker: "" };
}

/** Install command bar with shimmer sheen and a copy-to-clipboard button. */
function InstallCommand(variant?: ReturnType<typeof css>) {
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
    ...(variant ? [variant] : []),
    span(css("pages-home-components-components-inline-2", { color: colors.textMuted, fontFamily: "ui-monospace, monospace" }), "$"),
    span(INSTALL_CMD),
    button(
      hs.heroCopyBtn,
      { title: "Copy to clipboard", "aria-label": "Copy install command" },
      { class: () => cx(hs.heroCopyBtn, copied ? css("pages-home-components-components-inline-3", { color: colors.primary }) : null).className },
      when(() => copied, CheckIcon({ size: 14 })).else(CopyIcon({ size: 14 })),
      { onClick: handleCopy },
    ),
  );
}

function HeroDemoCard() {
  const heroCodeHtml = highlightCode(HERO_CODE);
  let count = 0;

  function changeCount(event: Event, amount: number) {
    count += amount;
    const buttonElement = event.currentTarget as HTMLButtonElement;
    const demo = buttonElement.closest<HTMLElement>("[data-hero-demo]");
    const value = demo?.querySelector<HTMLElement>("[data-demo-count]");
    if (value) value.textContent = String(count);
  }

  function CounterPreview() {
    return div(
      css("pages-home-components-components-inline-4", { textAlign: "center", width: "100%" }),
      div(
        fx.accentText,
        css("pages-home-components-components-inline-5", { fontSize: "5.2rem", fontWeight: "700", lineHeight: "1", marginBottom: "26px", fontVariantNumeric: "tabular-nums" }),
        { "data-demo-count": "" },
        "0",
      ),
      div(
        css("pages-home-components-components-inline-6", { display: "flex", gap: "10px", justifyContent: "center" }),
        button(
          css("pages-home-components-components-inline-7", { minWidth: "44px", height: "40px", padding: "0 18px", borderRadius: "8px", fontSize: "0.9375rem", fontWeight: "600", cursor: "pointer", border: `1px solid ${colors.borderLight}`, color: colors.text, fontFamily: "system-ui, sans-serif", hover: { backgroundColor: colors.bgSecondary } }),
          "−",
          { onClick: (event) => changeCount(event, -1) },
        ),
        button(
          css("pages-home-components-components-inline-8", { minWidth: "44px", height: "40px", padding: "0 18px", borderRadius: "8px", fontSize: "0.9375rem", fontWeight: "600", cursor: "pointer", border: "1px solid transparent", color: "#fff", backgroundColor: colors.primaryDark, fontFamily: "system-ui, sans-serif", hover: { filter: "brightness(0.92)" } }),
          "+",
          { onClick: (event) => changeCount(event, 1) },
        ),
      ),
    );
  }

  return div(
    hs.heroDemoArea,
    { "data-hero-demo": "" },
    div(
      hs.demoPreviewPane,
      { "data-demo-pane": "preview" },
      CounterPreview(),
    ),
    div(
      hs.demoCodePane,
      terminalCodeTokenStyle,
      { "data-demo-pane": "code" },
      { innerHTML: `<pre class="${hs.preWrap.className}">${heroCodeHtml}</pre>` },
    ),
  );
}

export function HomeHeroSection() {
  return section(
    hs.heroSection,
    div(
      hs.heroShell,
      div(
        hs.heroFrame,
        div(
          hs.heroInner,
          // Left: copy
          div(
            // Badge
            div(
              hs.heroBadge,
              { className: "he he-1" },
              css("pages-home-components-components-inline-9", { marginBottom: "14px", medium: { marginBottom: "22px" } }),
              HERO_BADGE,
            ),
            // Title
            h1(
              hs.heroTitle,
              { className: "he he-2" },
              ...HERO_TITLE_LINES.map((line) => div(line)),
            ),
            // Description
            p(hs.heroDesc, { className: "he he-3" }, HERO_DESC),
            // Install command
            div(hs.heroInstall, { className: "he he-4" }, InstallCommand(hs.heroInstallCmd)),
            // Action buttons
            div(
              hs.heroActions,
              { className: "he he-5" },
              a(
                hs.heroBtn, hs.heroPrimaryBtn,
                { href: "/docs", onClick: (e) => { e.preventDefault(); setRoute("docs"); } },
                "Get started",
              ),
              a(
                hs.heroBtn, hs.heroSecondaryBtn,
                { href: "/examples", onClick: (e) => { e.preventDefault(); setRoute("examples"); } },
                "View examples",
              ),
            ),
            // Stats
            div(
              hs.statsRow,
              { className: "he he-6" },
              ...HERO_STATS.map(({ num, sup, label }) =>
                div(
                  div(
                    hs.statNum,
                    num,
                    sup ? span(css("pages-home-components-components-inline-10", { fontSize: "1rem", color: "rgba(255,255,255,0.72)", marginLeft: "2px" }), sup) : null,
                  ),
                  div(hs.statLabel, label),
                )
              ),
            ),
          ),
          // Right: demo card
          div(
            hs.heroVisual,
            { className: "he he-7" },
            HeroDemoCard(),
          ),
        ),
      ),
    ),
  );
}

export function PipelineSection() {
  function PipeNode(step: typeof PIPELINE_STEPS[number], index: number) {
    const { badge, kicker } = splitStepLabel(step.kicker);
    return li(
      hs.pipeNode,
      { className: `${hs.pipeNode.className} rv rv-d${index + 1}` },
      ...(index > 0 ? [span(hs.pipeArrow, { "aria-hidden": "true" }, PipeChevron())] : []),
      div(hs.pipeStep, span(hs.pipeNum, badge), span(kicker)),
      h3(hs.pipeTitle, step.title),
      p(hs.pipeDesc, step.desc),
      div(hs.pipeCode, { innerHTML: step.code }),
    );
  }

  function PipeChevron() {
    return svgSvg(
      { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2.4", "stroke-linecap": "round", "stroke-linejoin": "round" },
      pathSvg({ d: "M9 6l6 6-6 6" }),
    );
  }

  return section(
    hs.pipelineSection,
    div(
      s.container,
      div(s.sectionLabel, { className: "rv" }, "How it works"),
      h2(s.sectionTitle, { className: "rv" }, "One explicit cycle."),
      p(s.sectionSub, { className: "rv" }, "State-dependent values, no dependency graph, no scheduler. You decide when they run - a single predictable path from your data to the screen."),
      ol(hs.pipe, ...PIPELINE_STEPS.map(PipeNode)),
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
            css("pages-home-components-components-inline-11", { marginBottom: "16px" }),
            "Philosophy",
          ),
          blockquote(hs.philosophyQuote, ...withCode(PHILOSOPHY_QUOTE)),
        ),
        // Right: 3 points
        ol(
          hs.philosophyPoints,
          ...PHILOSOPHY_POINTS.map(({ num, title, desc }, i) =>
            li(
              hs.philosophyPoint,
              { className: `rv rv-d${i + 1}` },
              span(hs.philosophyPointNum, { "aria-hidden": "true" }, num),
              div(
                h3(hs.philosophyPointTitle, title),
                p(hs.philosophyPointDesc, ...withCode(desc)),
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
      div(s.sectionLabel, { className: "rv" }, "Features"),
      h2(s.sectionTitle, { className: "rv" }, "Built for clarity."),
      p(s.sectionSub, { className: "rv" }, "No magic. No surprises. Every update is intentional."),
      ul(
        hs.features,
        ...FEATURES.map(({ num, title, desc }, i) => {
          const { badge, kicker } = splitStepLabel(num);
          return li(
            hs.pipeNode,
            { className: `rv rv-d${i + 1}` },
            div(hs.pipeStep, span(hs.pipeNum, badge), span(kicker)),
            h3(hs.pipeTitle, title),
            p(hs.featureDesc, ...withCode(desc)),
          );
        }),
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

export function BenchmarkSection() {
  const max = Math.max(...BENCHMARK_ENTRIES.map((e) => e.score));
  // Bars start at 1.0 (the fastest possible score) instead of 0 so small gaps are visible; labels keep the real scores.
  const BAR_BASE = 1.0;

  function BenchRow(entry: typeof BENCHMARK_ENTRIES[number]) {
    const widthCls = css(
      `pages-home-components-benchmark-fill-${entry.name.toLowerCase()}`,
      { width: `${(((entry.score - BAR_BASE) / (max - BAR_BASE)) * 100).toFixed(1)}%` },
    );
    return li(
      hs.benchRow,
      div(
        hs.benchName,
        entry.featured ? hs.benchNameFeatured : null,
        entry.name,
        span(hs.benchVersion, entry.version),
      ),
      div(cx(hs.benchBar, entry.featured ? hs.benchBarFeatured : null, widthCls)),
      span(hs.benchValue, entry.featured ? hs.benchValueFeatured : null, entry.score.toFixed(2)),
    );
  }

  return section(
    hs.benchSection,
    div(
      s.container,
      div(s.sectionLabel, { className: "rv" }, "Benchmarks"),
      h2(s.sectionTitle, { className: "rv" }, BENCHMARK_TITLE),
      p(s.sectionSub, { className: "rv" }, BENCHMARK_SUB),
      div(
        hs.benchPanel,
        { className: "rv rv-d1" },
        div(
          hs.benchHead,
          span(hs.benchCaption, BENCHMARK_SOURCE_LABEL),
          span("Lower is better"),
        ),
        ol(hs.benchRows, ...BENCHMARK_ENTRIES.map(BenchRow)),
        div(
          hs.benchFoot,
          span(css("pages-home-components-components-inline-14", { maxWidth: "560px" }), BENCHMARK_NOTE),
          a(
            hs.benchSourceLink,
            {
              href: BENCHMARK_SOURCE_URL,
              target: "_blank",
              rel: "noopener noreferrer",
            },
            "Source: js-framework-benchmark",
          ),
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
        p(s.sectionSub, { className: "rv" }, css("pages-home-components-components-inline-15", { marginBottom: "40px" }), "Three steps and you're building real UIs."),
        div(
          s.stepsGrid,
          ...QUICK_START_STEPS.map(({ num, title, desc, code, lang }, i) => {
            const { badge, kicker } = splitStepLabel(num);
            return div(
              hs.quickStartStep,
              { className: `rv rv-d${i + 1}` },
              div(
                hs.stepHeader,
                div(
                  s.cardHeadRow,
                  div(hs.featureKicker, kicker || num),
                  span(s.cardCornerBadge, badge),
                ),
                div(s.stepTitle, title),
                div(s.stepDesc, desc),
              ),
              CodeBlock({ filename: lang, code, showCopy: true, preTokenized: true }),
            );
          }),
        ),
        div(
          css("pages-home-components-components-inline-16", { marginTop: "40px", textAlign: "center" }),
          { className: "rv" },
          button(
            s.btn, s.btnSecondary,
            "Read the full docs →",
            { onClick: () => setRoute("docs") },
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
        { onClick: () => { activeTab = tab; update(); } },
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
        codeTokenStyle,
        { class: () => cx(hs.teaserCodePane, codeTokenStyle, activeTab === "code" ? null : hs.paneHidden).className },
        { innerHTML: `<pre class="${hs.preWrap.className}">${highlightCode(code)}</pre>` },
      ),
    );
  }

  function CounterPreview() {
    let n = 0;
    return div(
      css("pages-home-components-components-inline-17", { textAlign: "center" }),
      div(fx.accentText, css("pages-home-components-components-inline-18", { fontSize: "3rem", fontWeight: "700", lineHeight: "1", marginBottom: "12px", fontVariantNumeric: "tabular-nums" }), () => String(n)),
      div(
        css("pages-home-components-components-inline-19", { display: "flex", gap: "8px", justifyContent: "center" }),
        button(
          css("pages-home-components-components-inline-20", { padding: "7px 16px", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", border: `1px solid ${colors.borderLight}`, color: colors.textDim, backgroundColor: colors.bgLight, fontFamily: "inherit" }),
          "−", { onClick: () => { n--; update(); } }
        ),
        button(
          css("pages-home-components-components-inline-21", { padding: "7px 16px", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", border: "none", color: "#fff", backgroundColor: colors.primary, fontFamily: "inherit" }),
          "Reset", { onClick: () => { n = 0; update(); } }
        ),
        button(
          css("pages-home-components-components-inline-22", { padding: "7px 16px", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", border: `1px solid ${colors.borderLight}`, color: colors.textDim, backgroundColor: colors.bgLight, fontFamily: "inherit" }),
          "+", { onClick: () => { n++; update(); } }
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
      css("pages-home-components-components-inline-23", { width: "100%", maxWidth: "280px" }),
      div(
        css("pages-home-components-components-inline-24", { display: "flex", gap: "8px", marginBottom: "10px" }),
        input(
          css("pages-home-components-components-inline-25", { flex: "1", padding: "9px 13px", borderRadius: "6px", border: `1px solid ${colors.borderLight}`, backgroundColor: colors.bgSecondary, color: colors.text, fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", outline: "none", marginBottom: "10px", width: "100%", focus: { borderColor: colors.primary } }),
          {
            type: "text",
            placeholder: "Add a task…",
          },
          { onInput: (e) => { inputValue = (e.target as HTMLInputElement).value; } },
          { onKeyDown: (e) => { if ((e as KeyboardEvent).key === "Enter") addTodo(); } },
          ((el: any) => { domInput = el; }) as any,
        ),
        button(
          css("pages-home-components-components-inline-26", { padding: "9px 14px", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", border: "none", color: "#fff", backgroundColor: colors.primary, fontFamily: "inherit", whiteSpace: "nowrap" }),
          "Add",
          { onClick: addTodo },
        ),
      ),
      list(
        () => todos,
        (t) => div(
          css("pages-home-components-components-inline-27", { display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "5px", border: `1px solid ${colors.border}`, backgroundColor: colors.bgSecondary, marginBottom: "5px", fontSize: "0.85rem" }),
          input({ type: "checkbox" }, { checked: () => t.done }, { onChange: () => { t.done = !t.done; update(); } }),
          span(
            css("pages-home-components-components-inline-28", { transition: "opacity 0.18s ease" }),
            { class: () => t.done ? css("pages-home-components-components-inline-29", { textDecoration: "line-through", opacity: "0.5" }).className : "" },
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
          css("pages-home-components-components-inline-30", { marginTop: "36px", textAlign: "center" }),
          { className: "rv" },
          button(
            s.btn, s.btnSecondary,
            "View all examples →",
            { onClick: () => setRoute("examples") },
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
        div(
          h2(hs.ctaTitle, CTA_TITLE),
          p(hs.ctaSub, CTA_SUB),
        ),
        div(
          hs.ctaSide,
          InstallCommand(hs.ctaInstallCmd),
          div(
            hs.ctaActions,
            a(
              hs.ctaBtn, hs.ctaBtnPrimary,
              { href: "/docs", onClick: (e) => { e.preventDefault(); setRoute("docs"); } },
              "Read the docs",
            ),
            a(
              hs.ctaBtn, hs.ctaBtnSecondary,
              { href: "https://github.com/dan2dev/nuclo", target: "_blank", rel: "noopener noreferrer" },
              GitHubSvg({ size: 16 }),
              "GitHub",
            ),
          ),
        ),
      ),
    ),
  );
}
