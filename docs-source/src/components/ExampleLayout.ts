import "nuclo";
import { cn, s, colors } from "../styles.ts";
import { CodeBlock } from "./CodeBlock.ts";
import { setRoute } from "../router.ts";

/**
 * Shared layout for all example pages.
 * Renders: breadcrumb → title → subtitle → live demo → source code section.
 */
export function ExampleLayout(opts: {
  title: string;
  description: string;
  demoLabel?: string;
  demo: unknown;
  code: string;
}) {
  const backLink = div(
    cn(display("flex").alignItems("center").gap("6px").marginBottom("32px")),
    a(
      cn(
        display("inline-flex").alignItems("center").gap("6px")
          .fontSize("13px").color(colors.textDim)
          .cursor("pointer").transition("color 0.15s"),
        { hover: color(colors.textMuted) }
      ),
      span(cn(fontSize("15px")), "←"),
      "Examples",
      on("click", (e) => { e.preventDefault(); setRoute("examples"); })
    ),
    span(cn(color(colors.border)), "›"),
    span(cn(fontSize("13px").color(colors.textMuted)), opts.title)
  );

  const demoPanel = div(
    cn(
      backgroundColor(colors.bgCard).borderRadius("16px")
        .border(`1px solid ${colors.border}`).overflow("hidden").marginBottom("40px")
    ),
    // Demo panel header
    div(
      cn(
        padding("12px 20px").backgroundColor(colors.bgLight)
          .borderBottom(`1px solid ${colors.border}`)
          .display("flex").alignItems("center").justifyContent("space-between")
      ),
      span(
        cn(fontSize("11px").fontWeight("700").color(colors.textDim)
          .textTransform("uppercase").letterSpacing("0.08em")),
        opts.demoLabel ?? "Live Demo"
      ),
      span(
        cn(
          display("inline-flex").alignItems("center").gap("5px")
            .padding("3px 10px").borderRadius("99px")
            .backgroundColor(colors.primaryAlpha08)
            .fontSize("11px").fontWeight("600").color(colors.primary)
        ),
        span(cn(
          width("6px").height("6px").borderRadius("50%")
            .backgroundColor(colors.primary).display("block")
        )),
        "Interactive"
      )
    ),
    // Demo content
    div(
      cn(padding("32px"), { medium: padding("40px") }),
      opts.demo as HTMLElement
    )
  );

  const sourceSection = div(
    cn(marginTop("8px")),
    h2(
      cn(
        fontSize("16px").fontWeight("700").color(colors.text)
          .marginBottom("16px").display("flex").alignItems("center").gap("10px")
          .paddingTop("8px")
      ),
      span(cn(color(colors.textMuted)), "Source Code"),
      span(
        cn(
          fontSize("10px").fontWeight("700").padding("3px 8px").borderRadius("6px")
            .textTransform("uppercase").letterSpacing("0.08em").color(colors.primary)
        ),
        { style: { backgroundColor: colors.primaryAlpha08, border: `1px solid ${colors.borderGlow}` } },
        "TypeScript"
      )
    ),
    CodeBlock(opts.code, "typescript")
  );

  return div(
    s.pageContent,
    backLink,
    h1(s.pageTitle, { className: "gradient-text" }, opts.title),
    p(s.pageSubtitle, { style: { marginBottom: "40px" } }, opts.description),
    demoPanel,
    sourceSection
  );
}
