import "nuclo";
import { setRoute, type Route } from "../../router.ts";
import type { ExampleContent } from "../../content/examples.ts";
import {
  EXAMPLE_ICONS,
  HERO_CODE_LINES,
  HOME_COPY,
  HOMEPAGE_EXAMPLE_IDS,
  HOME_FEATURES,
  QUICK_START_TYPES_LINES,
  QUICK_START_USAGE_LINES,
  type HomeCodeLine,
} from "./content.ts";
import { homeCodeToneColors, hs } from "./styles.ts";

type ButtonSize = "compact" | "regular";
type ButtonTone = "outline-accent" | "outline-neutral" | "primary";
type IconSize = "large" | "regular";

function ActionButton(
  label: string,
  onClick: () => void,
  tone: ButtonTone,
  size: ButtonSize = "regular",
) {
  const sizeStyle = size === "compact" ? hs.buttonCompact : hs.buttonRegular;

  if (tone === "outline-accent") {
    return button(hs.buttonBase, sizeStyle, hs.buttonOutlineAccent, label, on("click", onClick));
  }

  if (tone === "outline-neutral") {
    return button(hs.buttonBase, sizeStyle, hs.buttonOutlineNeutral, label, on("click", onClick));
  }

  return button(hs.buttonBase, sizeStyle, hs.buttonPrimary, label, on("click", onClick));
}

function IconBadge(icon: string, size: IconSize = "regular") {
  return div(
    size === "large" ? hs.iconBadgeLarge : hs.iconBadge,
    span(size === "large" ? hs.iconTextLarge : hs.iconText, icon),
  );
}

function InteractiveBadge(label: string) {
  return span(
    hs.interactiveBadge,
    div(hs.interactiveBadgeDot),
    label,
  );
}

function LiveBadge(label: string) {
  return span(
    hs.liveBadge,
    div(hs.liveBadgeDot),
    label,
  );
}

function WindowHeader(fileName: string) {
  return div(
    hs.terminalHeader,
    div(hs.windowDot, hs.windowDotRed),
    div(hs.windowDot, hs.windowDotAmber),
    div(hs.windowDot, hs.windowDotGreen),
    span(hs.terminalFileName, fileName),
  );
}

function renderCodeLines(lines: HomeCodeLine[], compact = false) {
  return lines.map(({ text, tone }) =>
    div(
      compact ? hs.codeLineCompact : hs.codeLine,
      { style: { color: tone ? homeCodeToneColors[tone] : homeCodeToneColors.default } },
      text || "\u00a0",
    )
  );
}

function CodeBlockLines(lines: HomeCodeLine[], compact = false) {
  return div(
    compact ? hs.codeLinesCompact : hs.codeLinesLarge,
    ...renderCodeLines(lines, compact),
  );
}

function SectionIntro(title: string, subtitle: string) {
  return div(
    hs.sectionIntro,
    span(hs.sectionTitle, title),
    span(hs.sectionSubtitle, subtitle),
  );
}

function StepInfo(
  icon: string,
  label: string,
  title: string,
  description: string,
  narrow = false,
) {
  return div(
    narrow ? hs.stepInfoCompact : hs.stepInfo,
    IconBadge(icon),
    span(hs.stepLabel, label),
    span(hs.stepTitle, title),
    span(narrow ? hs.bodyTextNarrow : hs.bodyTextRelaxed, description),
  );
}

function HeroCodeCard() {
  return div(
    hs.card,
    hs.heroCodeCard,
    WindowHeader("app.ts"),
    div(
      hs.heroCodeScroller,
      CodeBlockLines(HERO_CODE_LINES),
    ),
  );
}

function LiveDemoCard() {
  let count = 0;

  const changeCount = (delta: number) => () => {
    count += delta;
    update();
  };

  const resetCount = () => {
    count = 0;
    update();
  };

  return div(
    hs.card,
    div(
      hs.panelHeader,
      span(hs.panelEyebrow, "LIVE DEMO"),
      InteractiveBadge("Interactive"),
    ),
    div(
      hs.demoBody,
      div(
        hs.demoMetricRow,
        span(hs.demoMetricValue, () => count),
        span(hs.counterStatusBadge, () => count % 2 === 0 ? "even" : "odd"),
      ),
      span(hs.demoLabel, "LIVE COUNTER"),
      div(
        hs.demoActions,
        button(hs.demoIconButton, "−", on("click", changeCount(-1))),
        button(hs.demoPrimaryButton, "+", on("click", changeCount(1))),
        button(hs.demoResetButton, "Reset", on("click", resetCount)),
      ),
    ),
  );
}

function StatCard() {
  return div(
    hs.card,
    hs.cardBody,
    div(
      hs.metricRow,
      span(hs.metricValue, "0"),
      span(hs.metricSuffix, "deps"),
    ),
    span(hs.title, HOME_COPY.statLabel),
    span(hs.bodyText, HOME_COPY.statDescription),
  );
}

function FeatureCard(icon: string, title: string, description: string) {
  return div(
    hs.card,
    hs.cardBody,
    div(
      hs.iconBadge,
      span(hs.iconTextFeature, icon),
    ),
    span(hs.title, title),
    span(hs.bodyTextWide, description),
  );
}

function TagCoverageCard() {
  return div(
    hs.card,
    hs.cardBody,
    div(
      hs.metricRow,
      span(hs.metricValueAlt, "140"),
      span(hs.metricSuffixAlt, "+"),
    ),
    span(hs.title, HOME_COPY.tagCoverageTitle),
    span(hs.bodyTextWide, HOME_COPY.tagCoverageDescription),
  );
}

function InstallBar() {
  return section(
    hs.section,
    div(
      hs.installBar,
      div(
        hs.installInfo,
        span(hs.installEyebrow, "INSTALL VIA NPM"),
        span(hs.installCommand, HOME_COPY.installCommand),
      ),
      ActionButton("Get Started →", () => setRoute("getting-started"), "primary", "compact"),
    ),
  );
}

function QuickStartInstallCard() {
  return div(
    hs.card,
    hs.cardBodyLarge,
    StepInfo("⬛", "STEP 01", "Install", "One command. Zero config. Ready to build.", true),
    div(
      hs.commandRow,
      span(hs.commandPrompt, "$"),
      span(hs.commandText, HOME_COPY.installCommand),
    ),
  );
}

function QuickStartUsageCard() {
  return div(
    hs.card,
    hs.splitCard,
    div(
      hs.splitInfoPane,
      StepInfo(
        "💻",
        "STEP 02",
        "Import & Use",
        "Import once globally. Every HTML tag becomes a function. Build UI with pure JavaScript.",
      ),
    ),
    div(
      hs.splitCodePane,
      CodeBlockLines(QUICK_START_USAGE_LINES, true),
    ),
  );
}

function QuickStartTypesCard() {
  return div(
    hs.card,
    hs.splitCard,
    hs.highlightedCard,
    div(
      hs.splitCodePane,
      CodeBlockLines(QUICK_START_TYPES_LINES, true),
    ),
    div(
      hs.splitInfoPane,
      StepInfo(
        "📐",
        "STEP 03",
        "TypeScript Ready",
        "Add one line to your tsconfig and get full autocomplete, type checking, and IntelliSense for every tag.",
      ),
    ),
  );
}

function ReadyCard() {
  return div(
    hs.card,
    hs.centeredCard,
    IconBadge("🚀", "large"),
    span(hs.titleLarge, "You're Ready!"),
    span(hs.centeredBodyText, HOME_COPY.readyDescription),
  );
}

/** Subrota de /examples — ex.: /examples/todo */
function exampleIdToRoute(exampleId: string): Route {
  return `examples/${exampleId}` as Route;
}

function exampleRouteHref(exampleId: string) {
  const route = exampleIdToRoute(exampleId);
  return `${import.meta.env.BASE_URL}${route}`;
}

function openExample(exampleId: string) {
  setRoute(exampleIdToRoute(exampleId));
}

function ExampleCard(example: ExampleContent) {
  return a(
    { href: exampleRouteHref(example.id) },
    hs.card,
    hs.cardInteractive,
    hs.cardBody,
    div(
      hs.exampleTopRow,
      span(hs.exampleIcon, EXAMPLE_ICONS[example.id] ?? "📄"),
      LiveBadge("Live"),
    ),
    span(hs.title, example.title),
    span(hs.bodyTextWide, example.description),
    span(hs.exampleLink, "View Example →"),
    on("click", (e) => {
      e.preventDefault();
      openExample(example.id);
    }),
  );
}

export function HomeHeroSection() {
  return section(
    hs.heroSection,
    div(
      hs.heroBadge,
      div(hs.heroBadgeDot),
      span(hs.heroBadgeText, HOME_COPY.heroBadge),
    ),
    div(
      hs.heroTitleGroup,
      span(hs.heroTitle, "Build Imperative,"),
      span(hs.heroTitleAccent, "Explicit UIs."),
    ),
    p(hs.heroSubtitle, HOME_COPY.heroDescription),
    div(
      hs.actionRow,
      ActionButton("Get Started →", () => setRoute("getting-started"), "primary"),
      ActionButton("View Examples", () => setRoute("examples"), "outline-accent"),
    ),
  );
}

export function HomeShowcaseSection() {
  return section(
    hs.section,
    div(
      hs.leadGrid,
      HeroCodeCard(),
      div(
        hs.stackedCards,
        StatCard(),
        LiveDemoCard(),
      ),
    ),
    div(
      hs.threeColumnGrid,
      FeatureCard(
        HOME_FEATURES[0].icon,
        HOME_FEATURES[0].title,
        HOME_FEATURES[0].description,
      ),
      TagCoverageCard(),
      FeatureCard(
        HOME_FEATURES[1].icon,
        HOME_FEATURES[1].title,
        HOME_FEATURES[1].description,
      ),
    ),
  );
}

export function HomeQuickStartSection() {
  return section(
    hs.section,
    SectionIntro("Quick Start", HOME_COPY.quickStartDescription),
    div(
      hs.quickStartStack,
      div(
        hs.quickStartWideGrid,
        QuickStartInstallCard(),
        QuickStartUsageCard(),
      ),
      div(
        hs.quickStartCompactGrid,
        QuickStartTypesCard(),
        ReadyCard(),
      ),
    ),
  );
}

export function HomeExamplesSection(examples: ExampleContent[]) {
  return section(
    hs.section,
    SectionIntro("Examples", HOME_COPY.examplesDescription),
    div(
      hs.examplesGrid,
      ...examples.map((example) => ExampleCard(example)),
    ),
    div(
      hs.sectionFooter,
      ActionButton("View All Examples →", () => setRoute("examples"), "outline-neutral", "compact"),
    ),
  );
}

export function getHomepageExampleIds() {
  return new Set<string>(HOMEPAGE_EXAMPLE_IDS);
}

export { InstallBar as HomeInstallBar };
