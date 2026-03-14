import "nuclo";
import { cn, colors } from "../styles.ts";
import { DocsHero, DocsPageFrame, DocsSectionHeader, type DocsTocItem } from "../components/DocsPage.ts";
import { CodeBlock } from "../components/CodeBlock.ts";
import { ArrowRightIcon } from "../components/icons.ts";
import { apiCode } from "../content/api.ts";
import { setRoute, type Route } from "../router.ts";

type ApiSection = {
  id: string;
  index: string;
  title: string;
  description: string;
  signature: string;
  points: string[];
  code: { code: string; lang: string };
};

const tocItems: DocsTocItem[] = [
  { id: "update", label: "update()", mono: true },
  { id: "render", label: "render()", mono: true },
  { id: "on", label: "on()", mono: true },
  { id: "list", label: "list()", mono: true },
  { id: "when", label: "when()", mono: true },
  { id: "next-steps", label: "Next Steps" },
];

const sections: ApiSection[] = [
  {
    id: "update",
    index: "01",
    title: "update()",
    description: "Runs one synchronous update pass across the application. Call it once after all state mutations.",
    signature: "update(): void",
    points: [
      "Nuclo does not auto-detect mutations — you decide when the DOM syncs.",
      "Zero-argument bindings, list providers, and when() conditions re-evaluate.",
      "Safe to call multiple times; prefer grouping work first.",
    ],
    code: apiCode.updateUsage,
  },
  {
    id: "render",
    index: "02",
    title: "render()",
    description: "Mounts an element tree into a DOM container. Appends rather than replaces — run it once at app startup.",
    signature: "render(element, container): void",
    points: [
      "Typical pattern: render one root element that owns the whole app.",
      "Multiple trees are supported but rarely needed.",
      "Works with any element returned by the tag builders.",
    ],
    code: apiCode.renderUsage,
  },
  {
    id: "on",
    index: "03",
    title: "on()",
    description: "Returns a modifier that attaches a typed event listener to any element. Full TypeScript inference for every DOM event.",
    signature: "on(event, handler, options?): Modifier",
    points: [
      "Accepts any standard EventTarget event name.",
      "Optional third argument maps to addEventListener options like once, passive, and capture.",
      "Multiple on() calls on the same element are all registered.",
    ],
    code: apiCode.onClick,
  },
  {
    id: "list",
    index: "04",
    title: "list()",
    description: "Synchronizes an array of objects to DOM nodes. Items stay mounted while their object identity remains stable.",
    signature: "list(provider, renderer): Node[]",
    points: [
      "provider is a zero-arg function returning the current array and re-evaluates on update().",
      "renderer(item, index) builds the DOM for each item.",
      "Items are tracked by object identity, so mutate in place when possible.",
    ],
    code: apiCode.listBasic,
  },
  {
    id: "when",
    index: "05",
    title: "when()",
    description: "Conditional rendering with DOM preservation. Chain .when() branches and finish with .else() for the fallback.",
    signature: "when(condition, ...content): ConditionalChain",
    points: [
      "condition is a zero-arg function re-evaluated on every update().",
      "The first truthy branch wins, and its DOM persists while that branch stays active.",
      "Each branch can render multiple children, not just a single node.",
    ],
    code: apiCode.whenBasic,
  },
];

const ca = {
  sectionCard: cn(
    display("flex")
      .flexDirection("column")
      .gap("20px")
      .padding("28px 24px")
      .backgroundColor(colors.bgCard)
      .border(`1px solid ${colors.border}`)
      .borderRadius("12px"),
    { medium: padding("28px 32px") }
  ),

  signatureCard: cn(
    padding("18px 24px")
      .borderRadius("10px")
      .backgroundColor("#161B27")
      .border("1px solid #252A38")
      .fontFamily("'JetBrains Mono', 'Courier New', monospace")
      .fontSize("15px")
      .lineHeight("1.5")
      .color("#A8B4C8")
  ),

  pointsCard: cn(
    display("flex")
      .flexDirection("column")
      .gap("10px")
      .padding("14px 16px")
      .borderRadius("8px")
      .backgroundColor(colors.primaryAlpha08)
  ),

  pointRow: cn(display("flex").gap("10px").alignItems("flex-start")),
  pointDot: cn(
    width("6px")
      .height("6px")
      .marginTop("8px")
      .borderRadius("999px")
      .backgroundColor(colors.primary)
      .flexShrink("0")
  ),

  pointText: cn(fontSize("14px").lineHeight("1.6").color(colors.textMuted)),

  nextWrap: cn(display("flex").flexDirection("column").gap("20px").paddingTop("8px")),
  nextTitle: cn(fontSize("26px").fontWeight("700").letterSpacing("-0.02em").color(colors.text)),
  nextGrid: cn(
    display("grid").gap("16px"),
    { medium: gridTemplateColumns("repeat(2, minmax(0, 1fr))"), large: gridTemplateColumns("repeat(3, minmax(0, 1fr))") }
  ),
  nextCard: cn(
    display("flex")
      .flexDirection("column")
      .gap("12px")
      .padding("20px 22px")
      .backgroundColor(colors.bgCard)
      .border(`1px solid ${colors.border}`)
      .borderRadius("12px")
      .cursor("pointer")
      .transition("transform 0.2s, border-color 0.2s, box-shadow 0.2s"),
    {
      hover: borderColor(colors.borderPrimary)
        .transform("translateY(-2px)")
        .boxShadow(`0 18px 36px ${colors.primaryGlow}`)
    }
  ),
};

function SignatureCard(signature: string) {
  const [name, rest] = signature.split("(");
  return div(
    ca.signatureCard,
    span(cn(color("#6DBF2F").fontWeight("700")), name),
    span("("),
    span(cn(color("#E8C77A")), rest ?? "")
  );
}

function ApiSectionCard(apiSection: ApiSection) {
  return section(
    { id: apiSection.id },
    ca.sectionCard,
    DocsSectionHeader(apiSection.index, apiSection.title, apiSection.description, true),
    SignatureCard(apiSection.signature),
    div(
      ca.pointsCard,
      ...apiSection.points.map((point) =>
        div(
          ca.pointRow,
          span(ca.pointDot),
          p(ca.pointText, point)
        )
      )
    ),
    CodeBlock(apiSection.code.code, apiSection.code.lang, {
      label: apiSection.code.lang,
      variant: "docs",
    })
  );
}

function NextCard(route: Route, title: string, description: string) {
  return a(
    { href: route === "home" ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}${route}` },
    ca.nextCard,
    div(
      cn(display("flex").alignItems("center").justifyContent("space-between").gap("12px")),
      h3(cn(fontSize("16px").fontWeight("600").color(colors.text)), title),
      span(cn(color(colors.border)), ArrowRightIcon())
    ),
    p(cn(fontSize("13px").lineHeight("1.55").color(colors.textDim)), description),
    on("click", (e) => {
      e.preventDefault();
      setRoute(route);
    })
  );
}

export function CoreApiPage() {
  return DocsPageFrame({
    hero: DocsHero({
      badge: "Reference",
      breadcrumb: "Core API",
      title: "Core API",
      subtitle: "The five functions that power every Nuclo application: update(), render(), on(), list(), and when().",
      meta: "~8 min read",
      updated: "Last updated: March 2026",
      sourceHref: "https://github.com/dan2dev/nuclo/blob/main/docs-source/src/pages/CoreApi.ts",
    }),
    tocItems,
    children: [
      ...sections.map((item) => ApiSectionCard(item)),
      div(
        { id: "next-steps" },
        ca.nextWrap,
        h2(ca.nextTitle, "What to explore next"),
        div(
          ca.nextGrid,
          NextCard("getting-started", "Getting Started", "Install Nuclo and build your first imperative UI step by step."),
          NextCard("examples", "Examples", "See update(), list(), and when() in runnable demos."),
          NextCard("styling", "Styling Guide", "Move from the core API into helpers, breakpoints, and pseudo-classes.")
        )
      ),
    ],
  });
}
