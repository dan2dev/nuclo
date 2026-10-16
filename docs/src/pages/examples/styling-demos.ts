// Bound to the site's own theme custom properties (not fixed hex) so these previews
// actually switch with light/dark mode instead of always rendering a light card.
const demo = createCss({
  colors: {
    primary: "var(--c-primary)",
    surface: "var(--c-bg-secondary)",
    border: "var(--c-border-light)",
    text: "var(--c-text)",
    muted: "var(--c-text-muted)",
  },
  screens: {
    sm: "(min-width: 520px)",
  },
});

const { css, cx } = demo;

export interface StylingFeature {
  id: string;
  docs: string; // the docs section it demonstrates
  title: string;
  desc: string;
  code: string;
  preview: () => NodeModLike<"div">;
}

const cardStyle = css("pages-examples-styling-demos-cardStyle", {
  p: 16,
  rounded: 8,
  border: "1px solid",
  borderColor: "border",
  bg: "surface",
  color: "text",
  w: "100%",
  maxW: 260,
});

const quietText = css("pages-examples-styling-demos-quietText", { color: "muted", text: 13, lineHeight: "1.5", marginTop: 6 });

function CssPreview() {
  return div(
    cardStyle,
    strong("Simple card"),
    p(quietText, "One style object returns one reusable class."),
  );
}

const baseButton = css("pages-examples-styling-demos-baseButton", {
  px: 14,
  py: 9,
  rounded: 6,
  border: "1px solid",
  borderColor: "border",
  color: "text",
  cursor: "pointer",
});

const selectedButton = css("pages-examples-styling-demos-selectedButton", {
  bg: "primary",
  color: "white",
  borderColor: "primary",
});

function CxPreview() {
  let selected = false;

  return div(
    css("pages-examples-styling-demos-styling-gallery-inline-1", { col: true, gap: 10, items: "center" }),
    button(
      () => cx(baseButton, selected ? selectedButton : null),
      () => selected ? "Selected" : "Select",
      { onClick: () => { selected = !selected; update(); } },
    ),
    span(css("pages-examples-styling-demos-styling-gallery-inline-2", { color: "muted", text: 12 }), "cx() adds the selected class."),
  );
}

const responsiveCard = css("pages-examples-styling-demos-responsiveCard", {
  p: 12,
  rounded: 8,
  border: "1px solid",
  borderColor: "border",
  bg: "surface",
  color: "text",
  w: "100%",
  maxW: 260,
  sm: {
    p: 20,
    borderColor: "primary",
  },
});

function ThemePreview() {
  return div(
    responsiveCard,
    strong("Theme tokens"),
    p(quietText, "Resize above 520px to use the sm screen rule."),
  );
}

// Each snippet is a small file of its own: a theme, a class or two, and a component that shows them.
const THEME = `// A theme: named colors (and screens) that css() accepts as values
const { css, cx } = createCss({
  colors: {
    primary: "#ff3f00",
    surface: "#fafafa",
    border: "#d4d4d4",
    text: "#222222",
    muted: "#737373",
  },
  screens: {
    sm: "(min-width: 520px)",
  },
})`;

export const STYLING_FEATURES: StylingFeature[] = [
  {
    id: "css",
    docs: "api-styling",
    title: "css()",
    desc: "Create a class from one typed style object.",
    code: `import 'nuclo'

${THEME}

// css() turns one style object into one reusable class
const card = css({
  p: 16,
  rounded: 8,
  border: "1px solid",
  borderColor: "border",
  bg: "surface",
  color: "text",
  w: "100%",
  maxW: 260,
})

const quiet = css({ color: "muted", text: 13, lineHeight: "1.5", marginTop: 6 })

// A class is just an argument: pass it to the element
export function Card() {
  return div(
    card,
    strong("Simple card"),
    p(quiet, "One style object returns one reusable class."),
  )
}`,
    preview: CssPreview,
  },
  {
    id: "cx",
    docs: "api-cx",
    title: "cx()",
    desc: "Compose classes conditionally. Later styles win.",
    code: `import 'nuclo'

${THEME}

const baseButton = css({
  px: 14,
  py: 9,
  rounded: 6,
  border: "1px solid",
  borderColor: "border",
  color: "text",
  cursor: "pointer",
})

const selectedButton = css({
  bg: "primary",
  color: "white",
  borderColor: "primary",
})

let selected = false

export function Button() {
  return div(
    css({ col: true, gap: 10, items: "center" }),
    button(
      // cx() joins the classes that are truthy, so the selected style
      // is added on top of the base one only while selected is true
      () => cx(baseButton, selected ? selectedButton : null),
      () => selected ? "Selected" : "Select",
      { onClick: () => { selected = !selected; update() } },
    ),
    span(css({ color: "muted", text: 12 }), "cx() adds the selected class."),
  )
}`,
    preview: CxPreview,
  },
  {
    id: "create-css",
    docs: "api-create-css",
    title: "createCss()",
    desc: "Define a small theme and use its tokens.",
    code: `import 'nuclo'

${THEME}

// "surface", "border" and "primary" are theme tokens; "sm" is a screen,
// so its styles apply only above 520px
const box = css({
  p: 12,
  rounded: 8,
  border: "1px solid",
  borderColor: "border",
  bg: "surface",
  color: "text",
  w: "100%",
  maxW: 260,
  sm: { p: 20, borderColor: "primary" },
})

const quiet = css({ color: "muted", text: 13, lineHeight: "1.5", marginTop: 6 })

export function Box() {
  return div(
    box,
    strong("Theme tokens"),
    p(quiet, "Resize above 520px to use the sm screen rule."),
  )
}`,
    preview: ThemePreview,
  },
];
