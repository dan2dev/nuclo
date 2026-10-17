import { css, colors, cx, s } from "../../styles.ts";
import { fx } from "../../styles/effects.ts";
import { hs } from "./styles.ts";
import { home } from "./content.ts";
import { t } from "../../i18n/index.ts";
import { CodeBlock, highlightCode, codeTokenStyle } from "../../components/CodeBlock.ts";
import { copyText } from "../../components/clipboard.ts";
import { withCode } from "../../components/inline-code.ts";
import { GitHubSvg, CheckIcon, MinusIcon, CopyIcon } from "../../components/icons.ts";
import { href, router } from "../../router.ts";
import { HeroCard } from "./hero-card.ts";

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
  const { INSTALL_CMD, LABELS: L } = home();
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
      { title: t.common.copyToClipboard, "aria-label": L.copyInstall },
      { class: () => cx(hs.heroCopyBtn, copied ? css("pages-home-components-components-inline-3", { color: colors.primary }) : null).className },
      when(() => copied, CheckIcon({ size: 14 })).else(CopyIcon({ size: 14 })),
      { onClick: handleCopy },
    ),
  );
}

// A title line with a *marked* word: the word gets the highlight
function TitleLine(line: string) {
  const parts = line.split(/\*([^*]+)\*/);
  return div(...parts.map((part, i) => (i % 2 ? span(hs.heroEm, part) : part)));
}

export function HomeHeroSection() {
  const { HERO_BADGE, HERO_TITLE_LINES, HERO_DESC, HERO_STATS, LABELS: L } = home();
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
              span(fx.badgeDot, hs.heroBadgeDot),
              HERO_BADGE,
            ),
            // Title
            h1(
              hs.heroTitle,
              { className: "he he-2" },
              ...HERO_TITLE_LINES.map(TitleLine),
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
                { href: href("/docs") },
                L.getStarted,
              ),
              a(
                hs.heroBtn, hs.heroSecondaryBtn,
                { href: href("/examples") },
                L.viewExamples,
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
          // Right: the examples card
          div(
            hs.heroVisual,
            { className: "he he-7" },
            HeroCard(),
          ),
        ),
      ),
    ),
  );
}

export function PipelineSection() {
  const { PIPELINE_STEPS, LABELS: L } = home();
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
      div(s.sectionLabel, { className: "rv" }, L.howItWorks),
      h2(s.sectionTitle, { className: "rv" }, L.pipelineTitle),
      p(s.sectionSub, { className: "rv" }, L.pipelineSub),
      ol(hs.pipe, ...PIPELINE_STEPS.map(PipeNode)),
    ),
  );
}

export function PhilosophySection() {
  const { PHILOSOPHY_QUOTE, PHILOSOPHY_POINTS, LABELS: L } = home();
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
            L.philosophy,
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
  const { FEATURES, LABELS: L } = home();
  return section(
    hs.featuresSection,
    div(
      s.container,
      div(s.sectionLabel, { className: "rv" }, L.features),
      h2(s.sectionTitle, { className: "rv" }, L.featuresTitle),
      p(s.sectionSub, { className: "rv" }, L.featuresSub),
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
  const { COMPARISON_TITLE, COMPARISON_SUB, COMPARISON_COLS, LABELS: L } = home();
  return section(
    hs.comparisonSection,
    div(
      s.container,
      div(s.sectionLabel, { className: "rv" }, L.comparison),
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
              col.featured ? span(hs.cmpBadge, span(fx.badgeDot), L.theNucloWay) : null,
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
  const { BENCHMARK_TITLE, BENCHMARK_SUB, BENCHMARK_NOTE, BENCHMARK_SOURCE_URL, BENCHMARK_SOURCE_LABEL, BENCHMARK_ENTRIES, LABELS: L } = home();
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
      div(s.sectionLabel, { className: "rv" }, L.benchmarks),
      h2(s.sectionTitle, { className: "rv" }, BENCHMARK_TITLE),
      p(s.sectionSub, { className: "rv" }, BENCHMARK_SUB),
      div(
        hs.benchPanel,
        { className: "rv rv-d1" },
        div(
          hs.benchHead,
          span(hs.benchCaption, BENCHMARK_SOURCE_LABEL),
          span(L.lowerIsBetter),
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
            L.benchmarkSource,
          ),
        ),
      ),
    ),
  );
}

export function HomeQuickStartSection() {
  const { QUICK_START_STEPS, LABELS: L } = home();
  return div(
    div(s.divider),
    section(
      hs.quickStartSection,
      div(
        s.container,
        div(s.sectionLabel, { className: "rv" }, L.quickStart),
        h2(s.sectionTitle, { className: "rv" }, L.quickStartTitle),
        p(s.sectionSub, { className: "rv" }, css("pages-home-components-components-inline-15", { marginBottom: "40px" }), L.quickStartSub),
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
            L.readFullDocs,
            { onClick: () => router.go(href("/docs")) },
          ),
        ),
      ),
    ),
  );
}

export function ExamplesTeaserSection() {
  const { COUNTER_TEASER_CODE, TODO_TEASER_CODE, LABELS: L } = home();
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
        Tab(t.common.preview, "preview"),
        Tab(t.common.code, "code"),
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
          L.reset, { onClick: () => { n = 0; update(); } }
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
            placeholder: L.addATask,
          },
          { onInput: (e) => { inputValue = (e.target as HTMLInputElement).value; } },
          { onKeyDown: (e) => { if ((e as KeyboardEvent).key === "Enter") addTodo(); } },
          ((el: any) => { domInput = el; }) as any,
        ),
        button(
          css("pages-home-components-components-inline-26", { padding: "9px 14px", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", border: "none", color: "#fff", backgroundColor: colors.primary, fontFamily: "inherit", whiteSpace: "nowrap" }),
          L.add,
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
        div(s.sectionLabel, { className: "rv" }, L.examples),
        h2(s.sectionTitle, { className: "rv" }, L.examplesTitle),
        p(s.sectionSub, { className: "rv" }, L.examplesSub),
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
            L.viewAllExamples,
            { onClick: () => router.go(href("/examples")) },
          ),
        ),
      ),
    ),
  );
}

export function CTASection() {
  const { CTA_TITLE, CTA_SUB, LABELS: L } = home();
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
              { href: href("/docs") },
              L.readTheDocs,
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
