import "nuclo";
import { cn, colors } from "../styles.ts";
import { NucloLogo } from "./icons.ts";
import { setRoute } from "../router.ts";

const col = cn(display("flex").flexDirection("column").gap("12px"));
const linkStyle = cn(
  fontSize("13px").color(colors.textDim).transition("color 0.15s").cursor("pointer"),
  { hover: color(colors.textMuted) }
);
const headingStyle = cn(
  fontSize("11px").fontWeight("700").color(colors.textDim)
    .textTransform("uppercase").letterSpacing("0.08em").marginBottom("4px")
);

function FooterLink(label: string, route: Parameters<typeof setRoute>[0]) {
  return a(
    linkStyle,
    label,
    on("click", (e) => { e.preventDefault(); setRoute(route); })
  );
}

function ExternalLink(label: string, href: string) {
  return a(
    { href, target: "_blank", rel: "noopener noreferrer" },
    linkStyle,
    label
  );
}

export function Footer() {
  return footer(
    cn(
      borderTop(`1px solid ${colors.border}`)
        .backgroundColor(colors.bgLight)
        .padding("48px 24px 32px"),
      { medium: padding("56px 48px 40px") }
    ),

    // Top section: logo + columns
    div(
      cn(
        maxWidth("1200px").margin("0 auto")
          .display("grid").gap("40px").gridTemplateColumns("1fr"),
        {
          medium: gridTemplateColumns("1.5fr 1fr 1fr 1fr").gap("48px")
        }
      ),

      // Brand column
      div(
        col,
        div(
          cn(display("flex").alignItems("center").gap("10px").marginBottom("4px")),
          NucloLogo(24),
          span(cn(fontSize("16px").fontWeight("700").color(colors.primary)), "Nuclo")
        ),
        p(
          cn(fontSize("13px").color(colors.textDim).lineHeight("1.7").maxWidth("240px")),
          "A lightweight imperative DOM framework. Just functions, plain objects, and explicit updates."
        ),
        div(
          cn(display("flex").gap("12px").marginTop("4px")),
          ExternalLink("GitHub", "https://github.com/dan2dev/nuclo"),
          ExternalLink("npm", "https://www.npmjs.com/package/nuclo"),
        )
      ),

      // Docs column
      div(
        col,
        span(headingStyle, "Docs"),
        FooterLink("Getting Started", "getting-started"),
        FooterLink("Core API", "core-api"),
        FooterLink("Tag Builders", "tag-builders"),
        FooterLink("Styling", "styling"),
        FooterLink("Pitfalls", "pitfalls"),
      ),

      // Examples column
      div(
        col,
        span(headingStyle, "Examples"),
        FooterLink("Counter", "example-counter"),
        FooterLink("Todo List", "example-todo"),
        FooterLink("Search Filter", "example-search"),
        FooterLink("Async Loading", "example-async"),
        FooterLink("All Examples", "examples"),
      ),

      // Resources column
      div(
        col,
        span(headingStyle, "Resources"),
        ExternalLink("Source Code", "https://github.com/dan2dev/nuclo"),
        ExternalLink("Report an Issue", "https://github.com/dan2dev/nuclo/issues"),
        ExternalLink("npm Package", "https://www.npmjs.com/package/nuclo"),
        ExternalLink("Changelog", "https://github.com/dan2dev/nuclo/releases"),
      )
    ),

    // Bottom bar
    div(
      cn(
        maxWidth("1200px").margin("0 auto")
          .borderTop(`1px solid ${colors.border}`)
          .marginTop("40px").paddingTop("24px")
          .display("flex").alignItems("center").justifyContent("space-between")
          .flexWrap("wrap").gap("12px")
      ),
      span(
        cn(fontSize("12px").color(colors.textDim)),
        "© 2024 ",
        a(
          {
            href: "https://github.com/dan2dev",
            target: "_blank",
            rel: "noopener noreferrer"
          },
          cn(color(colors.textDim).transition("color 0.15s"), { hover: color(colors.textMuted) }),
          "Danilo Celestino de Castro"
        ),
        " · MIT License"
      ),
      span(
        cn(fontSize("12px").color(colors.textDim)),
        "Built with ",
        a(
          cn(color(colors.primary).fontWeight("500")),
          { style: { cursor: "pointer" } },
          "Nuclo",
          on("click", () => setRoute("home"))
        )
      )
    )
  );
}
