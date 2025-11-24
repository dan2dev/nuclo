import "nuclo";
import { cn, s, colors } from "../../styles.ts";
import { CodeBlock } from "../../components/CodeBlock.ts";
import { examplesContent } from "../../content/examples.ts";
import { setRoute } from "../../router.ts";

// Live demo state - internal mini router
type DemoRoute = "home" | "about" | "contact";
let currentDemoRoute: DemoRoute = "home";

// Styles
const demoStyle = cn(
  backgroundColor(colors.bgCard)
    .padding("32px")
    .borderRadius("16px")
    .border(`1px solid ${colors.border}`)
    .marginBottom("32px")
);

const navStyle = cn(
  display("flex")
    .gap("8px")
    .marginBottom("24px")
    .paddingBottom("16px")
    .borderBottom(`1px solid ${colors.border}`)
);

const navBtnStyle = cn(
  padding("10px 20px")
    .backgroundColor("transparent")
    .color(colors.textMuted)
    .border(`1px solid ${colors.border}`)
    .borderRadius("8px")
    .fontSize("14px")
    .fontWeight("500")
    .cursor("pointer")
    .transition("all 0.2s")
);

const navBtnActiveStyle = {
  backgroundColor: colors.primary,
  color: colors.bg,
  borderColor: colors.primary,
};

const pageStyle = cn(
  padding("24px")
    .backgroundColor(colors.bgLight)
    .borderRadius("12px")
    .minHeight("150px")
);

const pageTitleStyle = cn(
  fontSize("20px")
    .fontWeight("600")
    .color(colors.text)
    .marginBottom("12px")
);

const pageTextStyle = cn(
  fontSize("14px")
    .color(colors.textMuted)
    .lineHeight("1.6")
);

const linkBtnStyle = cn(
  padding("8px 16px")
    .backgroundColor(colors.bgCard)
    .color(colors.primary)
    .border(`1px solid ${colors.border}`)
    .borderRadius("6px")
    .fontSize("13px")
    .cursor("pointer")
    .transition("all 0.2s")
    .marginTop("16px")
);

function navigateDemo(route: DemoRoute) {
  currentDemoRoute = route;
  update();
}

function DemoHomePage() {
  return div(
    pageStyle,
    h3(pageTitleStyle, "Home Page"),
    p(pageTextStyle, "Welcome to our website! This is a simple client-side routing example."),
    button(
      linkBtnStyle,
      "Go to About →",
      on("click", () => navigateDemo("about")),
      on("mouseenter", (e) => {
        (e.target as HTMLElement).style.borderColor = colors.primary;
      }),
      on("mouseleave", (e) => {
        (e.target as HTMLElement).style.borderColor = colors.border;
      })
    )
  );
}

function DemoAboutPage() {
  return div(
    pageStyle,
    h3(pageTitleStyle, "About Page"),
    p(pageTextStyle, "Learn more about us. We're passionate about building great software."),
    button(
      linkBtnStyle,
      "Go to Contact →",
      on("click", () => navigateDemo("contact")),
      on("mouseenter", (e) => {
        (e.target as HTMLElement).style.borderColor = colors.primary;
      }),
      on("mouseleave", (e) => {
        (e.target as HTMLElement).style.borderColor = colors.border;
      })
    )
  );
}

function DemoContactPage() {
  return div(
    pageStyle,
    h3(pageTitleStyle, "Contact Page"),
    p(pageTextStyle, "Get in touch! We'd love to hear from you."),
    button(
      linkBtnStyle,
      "Go Home →",
      on("click", () => navigateDemo("home")),
      on("mouseenter", (e) => {
        (e.target as HTMLElement).style.borderColor = colors.primary;
      }),
      on("mouseleave", (e) => {
        (e.target as HTMLElement).style.borderColor = colors.border;
      })
    )
  );
}

function NavButton(label: string, route: DemoRoute) {
  return button(
    navBtnStyle,
    {
      style: () => currentDemoRoute === route ? navBtnActiveStyle : {},
    },
    label,
    on("click", () => navigateDemo(route)),
    on("mouseenter", (e) => {
      if (currentDemoRoute !== route) {
        (e.target as HTMLElement).style.borderColor = colors.primary;
        (e.target as HTMLElement).style.color = colors.primary;
      }
    }),
    on("mouseleave", (e) => {
      if (currentDemoRoute !== route) {
        (e.target as HTMLElement).style.borderColor = colors.border;
        (e.target as HTMLElement).style.color = colors.textMuted;
      }
    })
  );
}

function LiveRouting() {
  return div(
    demoStyle,
    h3(cn(fontSize("18px").fontWeight("600").color(colors.text).marginBottom("20px")), "Mini Router Demo"),
    nav(
      navStyle,
      NavButton("Home", "home"),
      NavButton("About", "about"),
      NavButton("Contact", "contact")
    ),
    when(() => currentDemoRoute === "home", DemoHomePage())
      .when(() => currentDemoRoute === "about", DemoAboutPage())
      .when(() => currentDemoRoute === "contact", DemoContactPage())
  );
}

export function RoutingExamplePage() {
  const example = examplesContent.find(e => e.id === "routing")!;

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
    LiveRouting(),
    h2(s.h2, "Source Code"),
    CodeBlock(example.code, "typescript")
  );
}
