import "nuclo";
import { cn, s, colors } from "../styles.ts";
import { setRoute } from "../router.ts";
import { CodeBlock } from "../components/CodeBlock.ts";
import { examplesContent } from "../content/examples.ts";
import { gettingStartedCode } from "../content/gettingStarted.ts";
import { stylingCode } from "../content/styling.ts";
import { ArrowRightIcon, RocketIcon, BoxIcon, ZapIcon, RefreshIcon, CodeIcon, LayersIcon } from "../components/icons.ts";

const heroCode = `import 'nuclo';

let count = 0;

const counter = div(
  h1(() => \`Count: \${count}\`),
  button('Increment', on('click', () => {
    count++;
    update();
  }))
);

render(counter, document.body);`;

let heroDemoCount = 0;

function HeroDemo() {
  return div(
    cn(
      display("flex")
        .flexDirection("column")
        .gap("12px")
        .padding("24px")
        .backgroundColor(colors.bgCard)
        .border(`1px solid ${colors.border}`)
        .borderRadius("12px")
    ),
    h3(cn(fontSize("16px").fontWeight("600").color(colors.text)), "Live Counter Demo"),
    div(
      cn(display("flex").alignItems("center").gap("12px")),
      span(cn(fontSize("32px").fontWeight("700").color(colors.text)), () => heroDemoCount),
      span(cn(color(colors.textDim)), () => heroDemoCount % 2 === 0 ? "even" : "odd")
    ),
    div(
      cn(display("flex").gap("8px")),
      button(
        s.btnSecondary,
        "-",
        on("click", () => {
          heroDemoCount--;
          update();
        })
      ),
      button(
        s.btnSecondary,
        "Reset",
        on("click", () => {
          heroDemoCount = 0;
          update();
        })
      ),
      button(
        s.btnPrimary,
        { style: s.btnPrimaryStyle },
        "+",
        on("click", () => {
          heroDemoCount++;
          update();
        })
      )
    )
  );
}

function FeatureCard(iconEl: unknown, title: string, description: string) {
  const featureCardStyle = cn(
    padding("32px")
      .backgroundColor(colors.bgCard)
      .borderRadius("16px")
      .border(`1px solid ${colors.border}`)
      .transition("all 0.3s")
      .position("relative")
      .overflow("hidden"),
  );
  
  return div(
    featureCardStyle,
    div(s.featureIcon, { style: s.featureIconStyle }, iconEl as HTMLElement),
    h3(s.featureTitle, title),
    p(s.featureDesc, description)
  );
}

const previewIds = ["counter", "todo", "search", "async", "styled-card", "subtasks"];
const previewExamples = examplesContent.filter((ex) => previewIds.includes(ex.id));

function goToExample(id: string) {
  setRoute("examples");
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 150);
}

export function HomePage() {
  return div(
    // Hero Section
    section(
      s.hero,
      // Background decoration
      // div(
      //   // cn(position("absolute").left("50%").width("600px").height("600px").opacity("0.1").pointerEvents("none")),
      //   // { style: { transform: "translateX(-50%)" } },
      //   NucloLogo(600, true)
      // ),
      h1(
        s.heroTitle,
        "Build ",
        span(s.heroTitleAccent, { style: s.heroTitleAccentStyle }, "Faster"),
        ", ",
        span(s.heroTitleAccent, { style: s.heroTitleAccentStyle }, "Reactive"),
        " Interfaces."
      ),
      p(
        s.heroSubtitle,
        "A lightweight, flexible, component-based framework for the modern web. Just functions, plain objects, and explicit updates."
      ),
      div(
        s.heroButtons,
        button(
          cn(
            padding("14px 32px")
              .backgroundColor(colors.primary)
              .color(colors.bg)
              .borderRadius("8px")
              .fontWeight("600")
              .fontSize("15px")
              .border("none")
              .transition("all 0.2s")
              .display("flex")
              .alignItems("center")
              .gap("8px"),
            {
              hover: backgroundColor(colors.primaryHover).transform("translateY(-2px)").boxShadow(`0 0 30px ${colors.primaryGlow}`)
            }
          ),
          { style: s.btnPrimaryStyle },
          "Get Started",
          ArrowRightIcon(),
          on("click", () => setRoute("getting-started"))
        ),
        button(
          cn(
            padding("14px 32px")
              .backgroundColor("transparent")
              .color(colors.text)
              .borderRadius("8px")
              .fontWeight("600")
              .fontSize("15px")
              .border(`1px solid ${colors.borderLight}`)
              .transition("all 0.2s"),
            {
              hover: border(`1px solid ${colors.primary}`).color(colors.primary).transform("translateY(-2px)")
            }
          ),
          "View Demo",
          on("click", () => setRoute("examples"))
        )
      )
    ),

    // Code Preview
    section(
      cn(padding("0 48px 100px").maxWidth("800px").margin("0 auto")),
      div(
        cn(borderRadius("16px").border(`1px solid ${colors.border}`).overflow("hidden")),
        { style: s.glowBoxStyle },
        div(
          cn(padding("12px 20px").backgroundColor(colors.bgLight).borderBottom(`1px solid ${colors.border}`).display("flex").alignItems("center").gap("8px")),
          span(cn(width("12px").height("12px").borderRadius("50%").backgroundColor("#ff5f57"))),
          span(cn(width("12px").height("12px").borderRadius("50%").backgroundColor("#febc2e"))),
          span(cn(width("12px").height("12px").borderRadius("50%").backgroundColor("#28c840"))),
          span(cn(marginLeft("auto").fontSize("13px").color(colors.textDim)), "main.ts")
        ),
        CodeBlock(heroCode, "typescript", false)
      )
    ),

    // Features
    section(
      s.features,
      { style: s.featuresStyle },
      FeatureCard(
        RocketIcon(),
        "Lightweight & Fast",
        "Zero dependencies, tiny bundle size. Built for performance from the ground up with direct DOM manipulation."
      ),
      FeatureCard(
        BoxIcon(),
        "Component-Based",
        "Build encapsulated components that manage their own state. Compose them to make complex UIs simple."
      ),
      FeatureCard(
        RefreshIcon(),
        "Simple Reactivity",
        "Explicit update() calls give you full control. No magic, no proxies, no hidden re-renders."
      ),
      FeatureCard(
        ZapIcon(),
        "Fine-Grained Updates",
        "Only updates what changed. Elements are reused, branches are preserved, performance is maximized."
      ),
      FeatureCard(
        CodeIcon(),
        "TypeScript-First",
        "Full type definitions for 140+ HTML and SVG tags. Catch errors at compile time, not runtime."
      ),
      FeatureCard(
        LayersIcon(),
        "Intuitive API",
        "Global tag builders feel natural. Just use div(), span(), button() - no imports needed."
      )
    ),

    // Quick Start Section
    section(
      s.section,
      h2(s.sectionTitle, "Quick Start"),
      p(s.sectionSubtitle, "Get up and running in seconds."),
      div(
        s.flexCol,
        s.gap32,
        div(
          h3(cn(fontSize("18px").fontWeight("600").color(colors.primary).marginBottom("16px")), "1. Install"),
          CodeBlock("npm install nuclo", "bash")
        ),
        div(
          h3(cn(fontSize("18px").fontWeight("600").color(colors.primary).marginBottom("16px")), "2. Import and use"),
          CodeBlock(`import 'nuclo';

// Now use div(), update(), on(), list(), when(), render() globally
const app = div(
  h1('Hello, Nuclo!'),
  p('Building UIs made simple.')
);

render(app, document.body);`, "typescript")
        ),
        div(
          h3(cn(fontSize("18px").fontWeight("600").color(colors.primary).marginBottom("16px")), "3. Add TypeScript support"),
          CodeBlock(`// tsconfig.json
{
  "compilerOptions": {
    "types": ["nuclo/types"]
  }
}`, "json")
        )
      ),
      div(
        cn(marginTop("32px")),
        h3(cn(fontSize("18px").fontWeight("600").color(colors.primary).marginBottom("16px")), "Try it live"),
        HeroDemo()
      )
    ),

    // Core Concepts (from original landing page)
    section(
      s.section,
      h2(s.sectionTitle, "Core Concepts"),
      p(s.sectionSubtitle, "Explicit updates, reactive functions, conditionals, list syncing, and styling."),
      div(
        s.demoContainerSingle,
        div(
          s.demoPanel,
          div(s.demoPanelHeader, "Batch updates"),
          div(
            s.demoPanelContent,
            CodeBlock(gettingStartedCode.batchUpdates.code, gettingStartedCode.batchUpdates.lang, false)
          )
        ),
        div(
          s.demoPanel,
          div(s.demoPanelHeader, "Reactive functions"),
          div(
            s.demoPanelContent,
            CodeBlock(gettingStartedCode.reactiveText.code, gettingStartedCode.reactiveText.lang, false)
          )
        )
      ),
      div(
        cn(display("grid").gap("20px").gridTemplateColumns("1fr"), { medium: gridTemplateColumns("repeat(2, 1fr)"), large: gridTemplateColumns("repeat(3, 1fr)") }),
        div(
          s.featureCard,
          h3(s.featureTitle, "Conditional rendering"),
          CodeBlock(`when(() => user.isAdmin,
  div('Admin Panel')
).when(() => user.isLoggedIn,
  div('Dashboard')
).else(
  div('Please log in')
);`, "typescript", false)
        ),
        div(
          s.featureCard,
          h3(s.featureTitle, "List synchronization"),
          CodeBlock(`list(() => items, (item, index) =>
  div(() => \`\${index}: \${item.name}\`)
);`, "typescript", false)
        ),
        div(
          s.featureCard,
          h3(s.featureTitle, "CSS-in-JS styling"),
          CodeBlock(stylingCode.overviewQuickExample.code, stylingCode.overviewQuickExample.lang, false)
        )
      )
    ),

    // Examples preview
    section(
      s.section,
      h2(s.sectionTitle, "Examples"),
      p(s.sectionSubtitle, "Jump into any example from the original gallery."),
      div(
        cn(display("grid").gap("20px"), { medium: gridTemplateColumns("repeat(3, 1fr)") }),
        ...previewExamples.map((example) =>
          div(
            s.featureCard,
            h3(s.featureTitle, example.title),
            p(s.featureDesc, example.description),
            button(
              s.btnSecondary,
              "View Example",
              on("click", () => goToExample(example.id))
            )
          )
        )
      )
    )
  );
}
