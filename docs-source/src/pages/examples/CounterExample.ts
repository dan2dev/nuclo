import "nuclo";
import { cn, s, colors } from "../../styles.ts";
import { CodeBlock } from "../../components/CodeBlock.ts";
import { examplesContent } from "../../content/examples.ts";
import { setRoute } from "../../router.ts";

// Live demo state
let counterCount = 0;

const demoStyle = cn(backgroundColor(colors.bgCard)
  .padding("32px")
  .borderRadius("16px")
  .border(`1px solid ${colors.border}`)
  .marginBottom("32px"));

const demoBtnStyle = cn(padding("10px 20px")
  .backgroundColor(colors.primary)
  .color(colors.bg)
  .border("none")
  .borderRadius("8px")
  .fontSize("14px")
  .fontWeight("600")
  .cursor("pointer")
  .transition("all 0.2s"));

const demoBtnSecondary = cn(padding("10px 20px")
  .backgroundColor(colors.bgLight)
  .color(colors.text)
  .border(`1px solid ${colors.border}`)
  .borderRadius("8px")
  .fontSize("14px")
  .fontWeight("500")
  .cursor("pointer")
  .transition("all 0.2s"));

function LiveCounter() {
  return div(
    demoStyle,
    div(
      s.flexBetween,
      div(
        h3(
          cn(fontSize("48px").fontWeight("700").color(colors.text).marginBottom("8px")),
          () => counterCount
        ),
        p(cn(fontSize("14px").color(colors.textMuted)), "Current count")
      ),
      div(
        s.flex,
        s.gap8,
        button(
          demoBtnStyle,
          cn(width("44px").height("44px").fontSize("20px").padding("0").display("flex").alignItems("center").justifyContent("center")),
          "−",
          on("click", () => {
            counterCount--;
            update();
          }),
          on("mouseenter", (e) => {
            (e.target as HTMLElement).style.backgroundColor = colors.primaryHover;
            (e.target as HTMLElement).style.transform = "scale(1.05)";
          }),
          on("mouseleave", (e) => {
            (e.target as HTMLElement).style.backgroundColor = colors.primary;
            (e.target as HTMLElement).style.transform = "scale(1)";
          })
        ),
        button(
          demoBtnStyle,
          cn(width("44px").height("44px").fontSize("20px").padding("0").display("flex").alignItems("center").justifyContent("center")),
          "+",
          on("click", () => {
            counterCount++;
            update();
          }),
          on("mouseenter", (e) => {
            (e.target as HTMLElement).style.backgroundColor = colors.primaryHover;
            (e.target as HTMLElement).style.transform = "scale(1.05)";
          }),
          on("mouseleave", (e) => {
            (e.target as HTMLElement).style.backgroundColor = colors.primary;
            (e.target as HTMLElement).style.transform = "scale(1)";
          })
        ),
        button(
          demoBtnSecondary,
          "Reset",
          on("click", () => {
            counterCount = 0;
            update();
          }),
          on("mouseenter", (e) => {
            (e.target as HTMLElement).style.borderColor = colors.primary;
          }),
          on("mouseleave", (e) => {
            (e.target as HTMLElement).style.borderColor = colors.border;
          })
        )
      )
    )
  );
}

export function CounterExamplePage() {
  const example = examplesContent.find(e => e.id === "counter")!;

  return div(
    s.pageContent,
    a(
      cn(color(colors.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),
      "← Back to Examples",
      on("click", (e) => {
        e.preventDefault();
        setRoute("examples");
      })
    ),
    h1(s.pageTitle, example.title),
    p(s.pageSubtitle, example.description),
    LiveCounter(),
    h2(s.h2, "Source Code"),
    CodeBlock(example.code, "typescript")
  );
}
