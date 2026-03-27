import "nuclo";
import { cn, colors } from "../styles.ts";
import { CodeBlock } from "./CodeBlock.ts";
import { setRoute } from "../router.ts";
import { d, DocsSectionHeader, DocsPageFrame, type DocsTocItem } from "./DocsPage.ts";

/**
 * Shared layout for all example pages.
 * Matches the DocsPageFrame aesthetic: hero banner, sidebar TOC, section headers.
 */
export function ExampleLayout(opts: {
  title: string;
  description: string;
  demoLabel?: string;
  demo: unknown;
  code: string;
}) {
  function routeHref(r: string) {
    const base = import.meta.env.BASE_URL || "/";
    return r === "home" ? base : `${base}${r}`;
  }

  const tocItems: DocsTocItem[] = [
    { id: "ex-demo", label: "Live Demo" },
    { id: "ex-source", label: "Source Code" },
  ];

  // Hero — same structure as DocsHero but with 3-level breadcrumb: Docs › Examples › {title}
  const hero = section(
    d.hero,
    div(
      d.breadcrumb,
      a(
        { href: routeHref("home") },
        cn(color(colors.textDim).transition("color 0.2s")),
        { hover: color(colors.textMuted) },
        "Docs",
        on("click", (e) => { e.preventDefault(); setRoute("home"); })
      ),
      span(cn(color(colors.border)), "›"),
      a(
        { href: routeHref("examples") },
        cn(color(colors.textDim).transition("color 0.2s")),
        { hover: color(colors.textMuted) },
        "Examples",
        on("click", (e) => { e.preventDefault(); setRoute("examples"); })
      ),
      span(cn(color(colors.border)), "›"),
      span(cn(color(colors.primary).fontWeight("600")), opts.title)
    ),
    div(
      d.heroMeta,
      span(
        d.heroBadge,
        span(cn(width("6px").height("6px").borderRadius("999px").backgroundColor(colors.primary))),
        "Example"
      ),
      span(cn(fontSize("13px").color(colors.textDim)), "Interactive · TypeScript")
    ),
    h1(d.heroTitle, opts.title),
    p(d.heroSubtitle, opts.description)
  );

  // Demo section
  const demoSection = div(
    { id: "ex-demo" },
    cn(display("flex").flexDirection("column").gap("24px")),
    DocsSectionHeader(
      "01",
      "Live Demo",
      opts.demoLabel ?? "Try the interactive example below — no setup required."
    ),
    div(
      cn(
        backgroundColor(colors.bgCard).borderRadius("16px")
          .border(`1px solid ${colors.border}`).overflow("hidden")
      ),
      div(
        cn(
          padding("12px 20px").backgroundColor(colors.bgLight)
            .borderBottom(`1px solid ${colors.border}`)
            .display("flex").alignItems("center").justifyContent("space-between")
        ),
        span(
          cn(
            fontSize("11px").fontWeight("700").color(colors.textDim)
              .textTransform("uppercase").letterSpacing("0.08em")
          ),
          "Interactive"
        ),
        span(
          cn(
            display("inline-flex").alignItems("center").gap("5px")
              .padding("3px 10px").borderRadius("99px")
              .backgroundColor(colors.primaryAlpha08)
              .fontSize("11px").fontWeight("600").color(colors.primary)
          ),
          span(
            cn(width("6px").height("6px").borderRadius("50%")
              .backgroundColor(colors.primary).display("block"))
          ),
          "Live"
        )
      ),
      div(
        cn(padding("32px"), { medium: padding("40px") }),
        opts.demo as HTMLElement
      )
    )
  );

  // Source code section
  const sourceSection = div(
    { id: "ex-source" },
    cn(display("flex").flexDirection("column").gap("24px")),
    div(
      d.sectionIntro,
      div(
        d.sectionChipRow,
        span(d.sectionChip, "02"),
        h2(d.sectionTitle, "Source Code"),
        span(
          cn(
            fontSize("10px").fontWeight("700").padding("3px 8px").borderRadius("6px")
              .textTransform("uppercase").letterSpacing("0.08em").color(colors.primary)
          ),
          {
            style: {
              backgroundColor: colors.primaryAlpha08,
              border: `1px solid ${colors.borderGlow}`,
            },
          },
          "TypeScript"
        )
      ),
      p(d.sectionDescription, "Full TypeScript source for this example — ready to copy and adapt.")
    ),
    CodeBlock(opts.code, "typescript")
  );

  return DocsPageFrame({
    hero,
    tocItems,
    children: [demoSection, sourceSection],
  });
}
