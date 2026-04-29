import {
  HomeHeroSection,
  PhilosophySection,
  FeaturesSection,
  HomeQuickStartSection,
  ExamplesTeaserSection,
  CTASection,
} from "./home/components.ts";

export function HomePage() {
  return div(
    { id: "home-page" },
    HomeHeroSection(),
    PhilosophySection(),
    FeaturesSection(),
    HomeQuickStartSection(),
    ExamplesTeaserSection(),
    CTASection(),
  );
}
