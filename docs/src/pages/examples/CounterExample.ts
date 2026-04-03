import { cn, colors } from "../../styles.ts";
import { examplesContent } from "../../content/examples.ts";
import { ExampleLayout } from "../../components/ExampleLayout.ts";

let counterCount = 0;

const btnBase = cn(
  display("flex").alignItems("center").justifyContent("center")
    .borderRadius("10px").fontWeight("700").fontSize("18px")
    .cursor("pointer").transition("all 0.15s").border("none")
);

function LiveCounter() {
  return div(
    cn(display("flex").alignItems("center").justifyContent("space-between").flexWrap("wrap").gap("20px")),

    div(
      div(
        cn(display("flex").alignItems("baseline").gap("12px")),
        h2(
          cn(fontSize("56px").fontWeight("800").lineHeight("1").color(colors.text)),
          () => counterCount
        ),
        span(
          cn(
            fontSize("12px").fontWeight("700").padding("4px 10px")
              .borderRadius("99px").textTransform("uppercase").letterSpacing("0.07em")
              .transition("all 0.3s")
          ),
          {
            style: () => ({
              backgroundColor: counterCount % 2 === 0
                ? colors.primaryAlpha13 : "rgba(34, 211, 238, 0.15)",
              color: counterCount % 2 === 0 ? colors.primary : colors.accentSecondary,
            })
          },
          () => counterCount % 2 === 0 ? "even" : "odd"
        )
      ),
      p(cn(fontSize("12px").color(colors.textDim).letterSpacing("0.06em")
        .textTransform("uppercase").fontWeight("600").marginTop("8px")), "Current count")
    ),

    div(
      cn(display("flex").gap("8px")),
      button(
        btnBase,
        cn(width("44px").height("44px").backgroundColor(colors.bgLight).color(colors.text)
          .border(`1px solid ${colors.borderLight}`)),
        { ariaLabel: "Decrease count" },
        "−",
        on("click", () => { counterCount--; update(); })
      ),
      button(
        btnBase,
        cn(width("44px").height("44px").backgroundColor(colors.primary).color(colors.primaryText)),
        { ariaLabel: "Increase count" },
        "+",
        on("click", () => { counterCount++; update(); })
      ),
      button(
        cn(
          padding("0 16px").height("44px").display("flex").alignItems("center")
            .backgroundColor(colors.bgLight).color(colors.textMuted)
            .borderRadius("10px").border(`1px solid ${colors.border}`)
            .fontSize("13px").cursor("pointer").transition("all 0.15s")
        ),
        "Reset",
        on("click", () => { counterCount = 0; update(); })
      )
    )
  );
}

export function CounterExamplePage() {
  const example = examplesContent.find(e => e.id === "counter")!;
  return ExampleLayout({
    title: example.title,
    description: example.description,
    demo: LiveCounter(),
    code: example.code,
  });
}
