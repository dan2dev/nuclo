import "nuclo";
import { cn, colors } from "../../styles.ts";
import { examplesContent } from "../../content/examples.ts";
import { ExampleLayout } from "../../components/ExampleLayout.ts";

// Live demo state
let isAnimating = false;

const btnStyle = cn(
  padding("12px 24px")
    .backgroundColor(colors.primary)
    .color(colors.primaryText)
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
    .color(colors.primaryText)
    .margin("0 auto")
);

const orbStyle = cn(
  width("48px")
    .height("48px")
    .borderRadius("50%")
    .display("flex")
    .alignItems("center")
    .justifyContent("center")
    .fontSize("10px")
    .fontWeight("700")
    .color(colors.primaryText)
);

const orbsRowStyle = cn(
  display("flex")
    .gap("16px")
    .justifyContent("center")
    .alignItems("center")
    .marginTop("24px")
    .flexWrap("wrap")
);

// Ensure keyframes exist once in the document
function ensureKeyframes() {
  const id = "nuclo-demo-animations-keyframes";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    @keyframes pulse {
      from { transform: scale(1); opacity: 0.85; }
      to { transform: scale(1.08); opacity: 1; }
    }
    @keyframes float {
      0%   { transform: translateX(0) rotate(0deg); }
      50%  { transform: translateX(40px) rotate(180deg); }
      100% { transform: translateX(0) rotate(360deg); }
    }
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 20px rgba(213,255,64,0.3); }
      50% { box-shadow: 0 0 40px rgba(213,255,64,0.6); }
    }
  `;
  document.head.appendChild(style);
}

function LiveAnimations() {
  ensureKeyframes();
  return div(
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
          animation: isAnimating
            ? "pulse 600ms ease-in-out infinite alternate, float 2.5s ease-in-out infinite, glow 1.5s ease-in-out infinite alternate"
            : "none",
          willChange: isAnimating ? "transform, opacity, box-shadow" : "auto",
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          boxShadow: isAnimating ? "0 0 20px rgba(213,255,64,0.3)" : "none",
        }),
      },
      "Animated Box"
    ),
    div(
      orbsRowStyle,
      ...[0, 1, 2].map((i) =>
        div(
          orbStyle,
          {
            style: () => ({
              animation: isAnimating
                ? `pulse 800ms ease-in-out infinite alternate`
                : "none",
              animationDelay: isAnimating ? `${i * 150}ms` : "0ms",
              willChange: isAnimating ? "transform, opacity" : "auto",
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            }),
          },
          String(i + 1)
        )
      )
    )
  );
}

export function AnimationsExamplePage() {
  const example = examplesContent.find(e => e.id === "animations")!;
  return ExampleLayout({
    title: example.title,
    description: example.description,
    demo: LiveAnimations(),
    code: example.code,
  });
}
