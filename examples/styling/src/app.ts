// The showcase page: one section per styling feature, each rendered live.
import { s } from "./ui.ts";
import { basicsSection, compositesSection } from "./sections/basics.ts";
import { tokensSection } from "./sections/tokens.ts";
import { pseudoSection, responsiveSection, selectorsSection } from "./sections/variants.ts";
import { composeSection } from "./sections/compose.ts";
import { recipesSection } from "./sections/recipes.ts";
import { animationSection } from "./sections/animation.ts";
import { generatedSection } from "./sections/generated.ts";

export const app = div(
  s.page,
  h1(s.pageTitle, "nuclo styling"),
  p(
    s.pageLead,
    "Atomic, theme-aware, typed CSS-in-TS. Everything below is defined with css() / cx() / variants() / keyframes() / globalStyle() from a single themed createCss() instance, and rendered live.",
  ),
  basicsSection,
  compositesSection,
  tokensSection,
  pseudoSection,
  responsiveSection,
  selectorsSection,
  composeSection,
  recipesSection,
  animationSection,
  generatedSection,
);
