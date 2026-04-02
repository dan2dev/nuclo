import { examplesContent } from "../content/examples.ts";
import {
  getHomepageExampleIds,
  HomeExamplesSection,
  HomeHeroSection,
  HomeInstallBar,
  HomeQuickStartSection,
  HomeShowcaseSection,
} from "./home/components.ts";

export function HomePage() {
  const homepageExampleIds = getHomepageExampleIds();
  const examples = examplesContent.filter(({ id }) => homepageExampleIds.has(id));

  return div(
    HomeHeroSection(),
    HomeShowcaseSection(),
    HomeInstallBar(),
    HomeQuickStartSection(),
    HomeExamplesSection(examples),
  );
}
