import {
  HomeHeroSection,
  PipelineSection,
  PhilosophySection,
  FeaturesSection,
  ComparisonSection,
  HomeQuickStartSection,
  ExamplesTeaserSection,
  CTASection,
} from "./home/components.ts";

export function HomePage() {
  return div(
    { id: "home-page" },
    HomeHeroSection(),
    PipelineSection(),
    PhilosophySection(),
    FeaturesSection(),
    ComparisonSection(),
    HomeQuickStartSection(),
    ExamplesTeaserSection(),
    CTASection(),
  );
}
