import "nuclo";
import { cn, s, colors } from "../styles.ts";
import { examplesContent, type ExampleContent } from "../content/examples.ts";
import { setRoute, type Route } from "../router.ts";

const exampleRoutes: Record<string, Route> = {
  counter: "example-counter",
  todo: "example-todo",
  subtasks: "example-subtasks",
  search: "example-search",
  async: "example-async",
  forms: "example-forms",
  nested: "example-nested",
  animations: "example-animations",
  routing: "example-routing",
  "styled-card": "example-styled-card",
};

// Emoji icons for each example category
const exampleIcons: Record<string, string> = {
  counter: "🔢",
  todo: "✅",
  subtasks: "🗂️",
  search: "🔍",
  async: "⚡",
  forms: "📝",
  nested: "🧩",
  animations: "✨",
  routing: "🗺️",
  "styled-card": "🎨",
};

const cardStyle = cn(
  backgroundColor(colors.bgCard)
    .padding("24px")
    .borderRadius("16px")
    .border(`1px solid ${colors.border}`)
    .cursor("pointer")
    .transition("all 0.2s")
    .display("flex")
    .flexDirection("column")
    .gap("12px"),
  {
    hover: border(`1px solid ${colors.primary}`)
      .transform("translateY(-2px)")
      .boxShadow("0 8px 24px rgba(0,0,0,0.15)")
  }
);

const gridStyle = cn(
  display("grid")
    .gridTemplateColumns("1fr")
    .gap("16px")
    .marginBottom("48px"),
  {
    medium: gridTemplateColumns("repeat(2, 1fr)").gap("20px"),
    large: gridTemplateColumns("repeat(3, 1fr)")
  }
);

const categoryLabelStyle = cn(
  fontSize("11px")
    .fontWeight("700")
    .color(colors.primary)
    .textTransform("uppercase")
    .letterSpacing("0.08em")
    .marginBottom("20px")
    .marginTop("40px")
    .display("block")
);

const categoryDescStyle = cn(
  color(colors.textMuted)
    .fontSize("14px")
    .marginBottom("20px")
);

const liveBadgeStyle = cn(
  display("inline-flex")
    .alignItems("center")
    .gap("5px")
    .padding("3px 8px")
    .backgroundColor("rgba(132, 204, 22, 0.1)")
    .color(colors.primary)
    .fontSize("11px")
    .fontWeight("600")
    .borderRadius("99px")
);

function ExampleCard(example: ExampleContent) {
  const route = exampleRoutes[example.id];
  const icon = exampleIcons[example.id] ?? "📄";

  return div(
    cardStyle,
    on("click", () => setRoute(route)),

    div(
      cn(display("flex").alignItems("center").justifyContent("space-between")),
      span(cn(fontSize("28px")), icon),
      span(liveBadgeStyle,
        span(cn(width("5px").height("5px").borderRadius("50%").backgroundColor(colors.primary).display("block"))),
        "Live"
      )
    ),
    div(
      h3(cn(fontSize("16px").fontWeight("600").color(colors.text).marginBottom("6px")), example.title),
      p(cn(fontSize("13px").color(colors.textMuted).lineHeight("1.6")), example.description)
    ),
    span(
      cn(fontSize("13px").fontWeight("600").color(colors.primary)
        .display("inline-flex").alignItems("center").gap("4px").marginTop("auto")),
      "View Example →"
    )
  );
}

const basicExamples = ["counter", "todo", "subtasks"];
const dataExamples = ["search", "async", "forms"];
const advancedExamples = ["nested", "animations", "routing", "styled-card"];

function getExamplesByIds(ids: string[]) {
  return examplesContent.filter(e => ids.includes(e.id));
}

export function ExamplesPage() {
  return div(
    s.pageContent,
    h1(s.pageTitle, "Examples"),
    p(s.pageSubtitle, "Interactive examples demonstrating Nuclo's features. Every example includes a live demo and full source code."),

    span(categoryLabelStyle, "Getting Started"),
    p(categoryDescStyle, "Simple examples to understand the basics."),
    div(gridStyle, ...getExamplesByIds(basicExamples).map(e => ExampleCard(e))),

    span(categoryLabelStyle, "Data & Forms"),
    p(categoryDescStyle, "Working with data, async APIs, and form handling."),
    div(gridStyle, ...getExamplesByIds(dataExamples).map(e => ExampleCard(e))),

    span(categoryLabelStyle, "Advanced Patterns"),
    p(categoryDescStyle, "More complex patterns and techniques."),
    div(gridStyle, ...getExamplesByIds(advancedExamples).map(e => ExampleCard(e))),

    section(
      cn(marginTop("48px").paddingTop("32px").borderTop(`1px solid ${colors.border}`)),
      h2(s.h2, "More Examples"),
      p(
        s.p,
        "Find even more demos in the ",
        a(
          {
            href: "https://github.com/dan2dev/nuclo/tree/main/examples",
            target: "_blank",
            rel: "noopener noreferrer"
          },
          cn(color(colors.primary)),
          "GitHub examples directory"
        ),
        "."
      )
    )
  );
}
