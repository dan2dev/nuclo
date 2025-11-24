import "nuclo";
import { cn, s, colors } from "../../styles.ts";
import { CodeBlock } from "../../components/CodeBlock.ts";
import { examplesContent } from "../../content/examples.ts";
import { setRoute } from "../../router.ts";

// Live demo state
let isVisible = true;
let opacity = 1;
let scale = 1;
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

function toggle() {
  isVisible = !isVisible;
  update();
}

function animate() {
  if (isAnimating) return;
  isAnimating = true;

  const start = Date.now();
  const duration = 500;

  function tick() {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    if (isVisible) {
      opacity = eased;
      scale = 0.5 + eased * 0.5;
    } else {
      opacity = 1 - eased;
      scale = 1 - eased * 0.5;
    }

    update();

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      isAnimating = false;
    }
  }

  tick();
}

function LiveAnimations() {
  return div(
    demoStyle,
    h3(cn(fontSize("18px").fontWeight("600").color(colors.text).marginBottom("20px")), "Animation Demo"),
    div(
      cn(textAlign("center")),
      button(
        btnStyle,
        { disabled: () => isAnimating },
        () => isAnimating ? "Animating..." : (isVisible ? "Hide" : "Show"),
        on("click", () => {
          toggle();
          animate();
        }),
        on("mouseenter", (e) => {
          if (!isAnimating) {
            (e.target as HTMLElement).style.backgroundColor = colors.primaryHover;
          }
        }),
        on("mouseleave", (e) => {
          (e.target as HTMLElement).style.backgroundColor = colors.primary;
        })
      ),
      div(
        boxStyle,
        {
          style: () => ({
            opacity: opacity,
            transform: `scale(${scale})`,
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
