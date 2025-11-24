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

const cardStyle = cn(
  backgroundColor(colors.bgCard)
    .padding("24px")
    .borderRadius("12px")
    .border(`1px solid ${colors.border}`)
    .cursor("pointer")
    .transition("all 0.2s")
);

const cardTitleStyle = cn(
  fontSize("18px")
    .fontWeight("600")
    .color(colors.text)
    .marginBottom("8px")
);

const cardDescStyle = cn(
  fontSize("14px")
    .color(colors.textMuted)
    .lineHeight("1.5")
);

const gridStyle = cn(
  display("grid")
    .gridTemplateColumns("repeat(auto-fill, minmax(300px, 1fr))")
    .gap("20px")
    .marginBottom("48px")
);

const categoryTitleStyle = cn(
  fontSize("20px")
    .fontWeight("600")
    .color(colors.text)
    .marginBottom("20px")
    .marginTop("32px")
);

const liveBadgeStyle = cn(
  display("inline-block")
    .padding("4px 8px")
    .backgroundColor("rgba(132, 204, 22, 0.15)")
    .color(colors.primary)
    .fontSize("11px")
    .fontWeight("600")
    .borderRadius("4px")
    .marginLeft("8px")
    .textTransform("uppercase")
);

function ExampleCard(example: ExampleContent, hasLiveDemo: boolean) {
  const route = exampleRoutes[example.id];

  return div(
    cardStyle,
    on("click", () => setRoute(route)),
    on("mouseenter", (e) => {
      (e.currentTarget as HTMLElement).style.borderColor = colors.primary;
      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    }),
    on("mouseleave", (e) => {
      (e.currentTarget as HTMLElement).style.borderColor = colors.border;
      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      (e.currentTarget as HTMLElement).style.boxShadow = "none";
    }),
    div(
      cardTitleStyle,
      example.title,
      hasLiveDemo ? span(liveBadgeStyle, "Live Demo") : null
    ),
    p(cardDescStyle, example.description)
  );
}

// Categorize examples
const basicExamples = ["counter", "todo", "subtasks"];
const dataExamples = ["search", "async", "forms"];
const advancedExamples = ["nested", "animations", "routing", "styled-card"];

function getExamplesByIds(ids: string[]) {
  return examplesContent.filter(e => ids.includes(e.id));
}

export function ExamplesPage() {
  // All examples now have live demos
  const liveExamples = new Set([
    "counter", "todo", "subtasks", "search", "async",
    "forms", "nested", "animations", "routing", "styled-card"
  ]);

  return div(
    s.pageContent,
    h1(s.pageTitle, "Examples"),
    p(
      s.pageSubtitle,
      "Explore practical examples demonstrating Nuclo's features. Examples with live demos are marked with a badge."
    ),

    h2(categoryTitleStyle, "Getting Started"),
    p(cn(color(colors.textMuted).marginBottom("16px")), "Simple examples to help you understand the basics."),
    div(
      gridStyle,
      ...getExamplesByIds(basicExamples).map(e => ExampleCard(e, liveExamples.has(e.id)))
    ),

    h2(categoryTitleStyle, "Data & Forms"),
    p(cn(color(colors.textMuted).marginBottom("16px")), "Working with data, APIs, and form handling."),
    div(
      gridStyle,
      ...getExamplesByIds(dataExamples).map(e => ExampleCard(e, liveExamples.has(e.id)))
    ),

    h2(categoryTitleStyle, "Advanced Patterns"),
    p(cn(color(colors.textMuted).marginBottom("16px")), "More complex patterns and techniques."),
    div(
      gridStyle,
      ...getExamplesByIds(advancedExamples).map(e => ExampleCard(e, liveExamples.has(e.id)))
    ),

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
