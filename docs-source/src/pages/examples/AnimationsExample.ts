import "nuclo";
import { cn, s, colors } from "../../styles.ts";
import { CodeBlock } from "../../components/CodeBlock.ts";
import { examplesContent } from "../../content/examples.ts";
import { setRoute } from "../../router.ts";

// Live demo state
let isAnimating = false;

// Styles
const demoStyle = cn(
  backgroundColor(colors.bgCard)
    .padding("32px")
    .borderRadius("16px")
    .border(`1px solid ${colors.border}`)
    .marginBottom("32px")
);

const btnStyle = cn(
  padding("12px 24px")
    .backgroundColor(colors.primary)
    .color(colors.bg)
    .border("none")
    .borderRadius("8px")
    .fontSize("14px")
    .fontWeight("600")
    .cursor("pointer")
    .transition("all 0.2s")
    .marginBottom("24px")
);

const boxStyle = cn(
  width("200px")
    .height("200px")
    .borderRadius("16px")
    .display("flex")
    .alignItems("center")
    .justifyContent("center")
    .fontSize("16px")
    .fontWeight("600")
    .color(colors.bg)
    .margin("0 auto")
);

// Ensure keyframes exist once in the document
function ensureKeyframes() {
  const id = "nuclo-demo-pulse-keyframes";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `@keyframes pulse { from { transform: scale(1); opacity: 0.85; } to { transform: scale(1.08); opacity: 1; } }`;
  document.head.appendChild(style);
}

function LiveAnimations() {
  ensureKeyframes();
  return div(
    demoStyle,
    h3(cn(fontSize("18px").fontWeight("600").color(colors.text).marginBottom("20px")), "Animation Demo"),
    div(
      cn(textAlign("center")),
      button(
        btnStyle,
        () => (isAnimating ? "Stop Animation" : "Start Animation"),
        on("click", () => {
          isAnimating = !isAnimating;
          update();
        }),
        on("mouseenter", (e) => {
          (e.target as HTMLElement).style.backgroundColor = colors.primaryHover;
        }),
        on("mouseleave", (e) => {
          (e.target as HTMLElement).style.backgroundColor = colors.primary;
        })
      ),
      div(
        boxStyle,
        {
          style: () => ({
            animation: isAnimating ? "pulse 600ms ease-in-out infinite alternate" : "none",
            willChange: isAnimating ? "transform, opacity" : "auto",
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          })
        },
        "Animated Box"
      )
    )
  );
}

export function AnimationsExamplePage() {
  const example = examplesContent.find(e => e.id === "animations")!;

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
    LiveAnimations(),
    h2(s.h2, "Source Code"),
    CodeBlock(example.code, "typescript")
  );
}
